import prisma from "@/lib/prisma"

const REFEREE_CREDIT = 100   // store credit ৳ given to referee
const REFERRER_POINTS = 500  // loyalty points given to referrer

export async function generateReferralCode(userId: string): Promise<string> {
  const code = userId.slice(-8).toUpperCase()
  await prisma.user.update({ where: { id: userId }, data: { referralCode: code } })
  return code
}

export async function processReferral(
  refereeId: string,
  referralCode: string,
  orderId: string
): Promise<void> {
  const referrer = await prisma.user.findUnique({ where: { referralCode } })
  if (!referrer || referrer.id === refereeId) return

  // Idempotency: skip if this order already triggered a referral
  const existing = await prisma.referralLog.findFirst({ where: { orderId } })
  if (existing) return

  // Only first qualifying order counts
  const qualifyingOrders = await prisma.order.count({
    where: {
      userId: refereeId,
      status: { in: ["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] },
      id: { not: orderId },
    },
  })
  if (qualifyingOrders > 0) return

  await prisma.$transaction([
    // Give referee store credit
    prisma.storeCredit.upsert({
      where: { userId: refereeId },
      create: { userId: refereeId, balance: REFEREE_CREDIT },
      update: { balance: { increment: REFEREE_CREDIT } },
    }),
    prisma.storeCreditTransaction.create({
      data: {
        userId: refereeId,
        amount: REFEREE_CREDIT,
        type: "REFERRAL_BONUS",
        reason: "Referral sign-up credit",
        orderId,
      },
    }),
    // Give referrer loyalty points
    prisma.loyaltyPoint.create({
      data: {
        userId: referrer.id,
        points: REFERRER_POINTS,
        type: "REFERRAL",
        description: `Referral reward for ${refereeId}`,
        orderId,
      },
    }),
    // Log the referral
    prisma.referralLog.create({
      data: {
        referrerId: referrer.id,
        refereeId,
        orderId,
        creditAmount: REFEREE_CREDIT,
        pointsAmount: REFERRER_POINTS,
      },
    }),
    // Mark the referee as referred
    prisma.user.update({
      where: { id: refereeId },
      data: { referredByCode: referralCode },
    }),
  ])
}
