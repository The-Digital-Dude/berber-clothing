import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const partner = await prisma.affiliate.findFirst({
      where: {
        OR: [
          ...(session.user.id ? [{ userId: session.user.id }] : []),
          ...(session.user.email ? [{ email: session.user.email }] : []),
        ],
        isActive: true,
      },
    })

    if (!partner) {
      return NextResponse.json({ error: "Partner profile not found" }, { status: 403 })
    }

    const body = await req.json()
    const { amount, method = "BKASH", accountDetails } = body

    const withdrawAmount = Number(amount)
    if (!withdrawAmount || withdrawAmount < 100) {
      return NextResponse.json({ error: "Minimum payout request amount is ৳100" }, { status: 400 })
    }

    const currentBalance = Number(partner.walletBalance || 0)
    if (withdrawAmount > currentBalance) {
      return NextResponse.json({
        error: `Insufficient balance (৳${currentBalance.toLocaleString()}). Cannot request ৳${withdrawAmount.toLocaleString()}`,
      }, { status: 400 })
    }

    // If method is STORE_CREDIT, convert instantly with 5% bonus
    if (method === "STORE_CREDIT") {
      if (!partner.userId) {
        return NextResponse.json({ error: "User account required to convert to store credit" }, { status: 400 })
      }

      const bonusPct = 5
      const bonusAmount = Math.round((withdrawAmount * bonusPct) / 100)
      const creditTotal = withdrawAmount + bonusAmount

      // Deduct from partner wallet
      await prisma.affiliate.update({
        where: { id: partner.id },
        data: {
          walletBalance: { decrement: withdrawAmount },
          totalPaid: { increment: withdrawAmount },
        },
      })

      // Add to user store credit
      await prisma.storeCredit.upsert({
        where: { userId: partner.userId },
        create: {
          userId: partner.userId,
          balance: creditTotal,
        },
        update: {
          balance: { increment: creditTotal },
        },
      })

      // Log transaction
      await prisma.storeCreditTransaction.create({
        data: {
          userId: partner.userId,
          amount: creditTotal,
          type: "ADD",
          reason: `Partner wallet balance conversion (৳${withdrawAmount} + ৳${bonusAmount} ${bonusPct}% bonus)`,
        },
      })

      // Record payout request as PAID
      const payoutReq = await prisma.payoutRequest.create({
        data: {
          affiliateId: partner.id,
          amount: withdrawAmount,
          method: "STORE_CREDIT",
          accountDetails: `Store Credit Account (Included +৳${bonusAmount} Bonus)`,
          status: "PAID",
          transactionId: `SC-${Date.now()}`,
          adminNote: "Instant Store Credit Conversion (+5% Bonus)",
          processedAt: new Date(),
        },
      })

      return NextResponse.json({ ok: true, payoutRequest: payoutReq, storeCreditAdded: creditTotal })
    }

    // Cash withdrawal request (bKash / Nagad / Rocket / Bank)
    if (!accountDetails) {
      return NextResponse.json({ error: "Recipient account / phone details are required" }, { status: 400 })
    }

    // Deduct from wallet balance to reserve
    await prisma.affiliate.update({
      where: { id: partner.id },
      data: {
        walletBalance: { decrement: withdrawAmount },
      },
    })

    const payoutReq = await prisma.payoutRequest.create({
      data: {
        affiliateId: partner.id,
        amount: withdrawAmount,
        method,
        accountDetails: accountDetails.trim(),
        status: "PENDING",
      },
    })

    return NextResponse.json({ ok: true, payoutRequest: payoutReq })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
