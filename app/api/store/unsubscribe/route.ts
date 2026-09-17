import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

  await prisma.marketingSubscriber.updateMany({
    where: { email },
    data: { isActive: false },
  })

  return NextResponse.json({ message: "You've been unsubscribed from our mailing list." })
}
