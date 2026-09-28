import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const data = await req.json()
  const affiliate = await prisma.affiliate.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.code !== undefined && { code: data.code.toUpperCase() }),
      ...(data.partnerType !== undefined && { partnerType: data.partnerType }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.shopName !== undefined && { shopName: data.shopName }),
      ...(data.facebookPage !== undefined && { facebookPage: data.facebookPage }),
      ...(data.website !== undefined && { website: data.website }),
      ...(data.commissionType !== undefined && { commissionType: data.commissionType }),
      ...(data.commissionValue !== undefined && { commissionValue: Number(data.commissionValue) }),
      ...(data.resellerDiscountPct !== undefined && { resellerDiscountPct: Number(data.resellerDiscountPct) }),
      ...(data.couponId !== undefined && { couponId: data.couponId || null }),
      ...(data.payoutMethod !== undefined && { payoutMethod: data.payoutMethod }),
      ...(data.payoutNumber !== undefined && { payoutNumber: data.payoutNumber }),
      ...(data.bankName !== undefined && { bankName: data.bankName }),
      ...(data.bankAccountNumber !== undefined && { bankAccountNumber: data.bankAccountNumber }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.walletBalance !== undefined && { walletBalance: Number(data.walletBalance) }),
    },
    include: {
      coupon: true,
      _count: { select: { clicks: true, conversions: true, resellerOrders: true } },
    },
  })
  return NextResponse.json(affiliate)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.affiliate.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
