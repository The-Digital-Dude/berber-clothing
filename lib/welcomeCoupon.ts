import prisma from "@/lib/prisma"

export const WELCOME_COUPON_CODE = "WELCOME10"

// Ensures the newsletter-signup "10% off your first order" coupon actually
// exists. Created lazily on first use rather than requiring a manual DB seed,
// so it can't silently go missing. usagePerUser: 1 is enforced generically by
// the checkout/apply-coupon per-user-limit check (matches the coupon.code
// against the customer's userId or guestEmail order history) -- the same
// mechanism already used for referral rewards -- so this one code can be
// shared in every welcome email while still only being redeemable once per
// customer.
export async function ensureWelcomeCoupon(): Promise<string> {
  const existing = await prisma.coupon.findUnique({ where: { code: WELCOME_COUPON_CODE } })
  if (existing) return existing.code

  await prisma.coupon.create({
    data: {
      code: WELCOME_COUPON_CODE,
      type: "PERCENTAGE",
      value: 10,
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
