import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { generateReferralCode } from "@/lib/referral"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id
  let user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  })

  let referralCode = user?.referralCode
  if (!referralCode) {
    referralCode = await generateReferralCode(userId)
  }

  const logs = await prisma.referralLog.findMany({
    where: { referrerId: userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { referee: { select: { name: true, email: true } } },
  })

  return NextResponse.json({
    referralCode,
    referralCount: logs.length,
    logs,
  })
}
