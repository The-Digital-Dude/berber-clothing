import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const campaigns = await prisma.emailCampaign.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  })
  return NextResponse.json({ campaigns })
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { name, subject, body, scheduledAt } = await req.json()
  if (!name || !subject || !body) {
    return NextResponse.json({ error: "name, subject, and body are required" }, { status: 400 })
  }

  const campaign = await prisma.emailCampaign.create({
    data: { name, subject, body, scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined },
  })
  return NextResponse.json({ campaign })
}
