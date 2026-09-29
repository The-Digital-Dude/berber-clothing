import prisma from "@/lib/prisma"

export const WELCOME_COUPON_CODE = "WELCOME5"

// Ensures the newsletter-signup "5% off your first order" coupon actually
// exists. Created lazily on first use rather than requiring a manual DB seed,
// so it can't silently go missing. usagePerUser: 1 is enforced generically by
// the checkout/apply-coupon per-user-limit check (matches the coupon.code
// against the customer's userId or guestEmail order history) -- the same
// mechanism already used for referral rewards -- so this one code can be
// shared in every welcome email while still only being redeemable once per
// customer.
export async function ensureWelcomeCoupon(): Promise<string> {
  const existing = await prisma.coupon.findUnique({ where: { code: WELCOME_COUPON_CODE } })
  if (existing) {
    if (Number(existing.value) !== 5) {
      await prisma.coupon.update({
        where: { id: existing.id },
        data: { value: 5, type: "PERCENTAGE" },
      })
    }
    return existing.code
  }

  // Also check if legacy WELCOME10 existed and update to 5% if needed
  const legacy = await prisma.coupon.findUnique({ where: { code: "WELCOME10" } })
  if (legacy) {
    await prisma.coupon.update({
      where: { id: legacy.id },
      data: { value: 5, type: "PERCENTAGE" },
    }).catch(() => {})
  }

  await prisma.coupon.create({
    data: {
      code: WELCOME_COUPON_CODE,
      type: "PERCENTAGE",
      value: 5,
      isActive: true,
      rule: {
        create: {
          ruleType: "PER_USER_LIMIT",
          usagePerUser: 1,
        },
      },
    },
  })
  return WELCOME_COUPON_CODE
}
