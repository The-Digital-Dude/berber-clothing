import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const affiliates = await prisma.affiliate.findMany({
    include: {
      coupon: { select: { id: true, code: true, value: true, type: true } },
      _count: { select: { clicks: true, conversions: true, resellerOrders: true, payoutRequests: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(JSON.parse(JSON.stringify(affiliates)))
}

export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const data = await req.json()
  const affiliate = await prisma.affiliate.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      code: data.code.toUpperCase(),
      partnerType: data.partnerType || "AFFILIATE",
      status: data.status || "APPROVED",
      shopName: data.shopName || null,
      facebookPage: data.facebookPage || null,
      website: data.website || null,
      commissionType: data.commissionType || "PERCENTAGE",
      commissionValue: Number(data.commissionValue || 10),
      resellerDiscountPct: Number(data.resellerDiscountPct || 15),
      couponId: data.couponId || null,
      payoutMethod: data.payoutMethod || "BKASH",
      payoutNumber: data.payoutNumber || null,
      bankName: data.bankName || null,
      bankAccountNumber: data.bankAccountNumber || null,
      isActive: data.isActive ?? true,
    },
    include: {
      coupon: true,
      _count: { select: { clicks: true, conversions: true, resellerOrders: true } },
    },
  })
  return NextResponse.json(affiliate)
}
