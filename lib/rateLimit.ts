import prisma from "@/lib/prisma"

interface RateLimitConfig {
  windowMs: number
  max: number
}

const configs: Record<string, RateLimitConfig> = {
  checkout: { windowMs: 60_000, max: 5 },
  referral: { windowMs: 60_000, max: 5 },
  newsletter: { windowMs: 60_000, max: 3 },
  contact: { windowMs: 60_000, max: 3 },
}

export async function checkRateLimit(
  identifier: string,
  action: string
): Promise<{ allowed: boolean; remaining: number }> {
  const cfg = configs[action] ?? { windowMs: 60_000, max: 10 }
  const key = `${action}:${identifier}`
  const now = new Date()
  const windowEnd = new Date(now.getTime() + cfg.windowMs)

  const record = await prisma.rateLimit.findUnique({ where: { key } })

  if (!record || record.windowEnd < now) {
    await prisma.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, windowEnd },
      update: { count: 1, windowEnd },
    })
    return { allowed: true, remaining: cfg.max - 1 }
  }

  if (record.count >= cfg.max) {
    return { allowed: false, remaining: 0 }
  }

  await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  })

  return { allowed: true, remaining: cfg.max - record.count - 1 }
}
