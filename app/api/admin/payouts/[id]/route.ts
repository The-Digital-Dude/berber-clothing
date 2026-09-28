import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const { id } = await params
    const body = await req.json()
    const { status, transactionId, adminNote } = body

    const payout = await prisma.payoutRequest.findUnique({
      where: { id },
      include: { affiliate: true },
    })

    if (!payout) {
      return NextResponse.json({ error: "Payout request not found" }, { status: 404 })
    }

    if (payout.status === "PAID") {
      return NextResponse.json({ error: "This payout request is already marked as PAID." }, { status: 400 })
    }

    if (status === "PAID" || status === "APPROVED") {
      // Mark as paid
      const updated = await prisma.$transaction([
        prisma.payoutRequest.update({
          where: { id },
          data: {
            status: "PAID",
            transactionId: transactionId || null,
            adminNote: adminNote || null,
            processedAt: new Date(),
          },
        }),
        prisma.affiliate.update({
          where: { id: payout.affiliateId },
          data: {
            totalPaid: { increment: payout.amount },
          },
        }),
      ])
      return NextResponse.json({ ok: true, payout: updated[0] })
    } else if (status === "REJECTED") {
      // Refund reserved amount back to wallet
      const updated = await prisma.$transaction([
        prisma.payoutRequest.update({
          where: { id },
          data: {
            status: "REJECTED",
            adminNote: adminNote || "Payout request rejected by admin",
            processedAt: new Date(),
          },
        }),
        prisma.affiliate.update({
          where: { id: payout.affiliateId },
          data: {
            walletBalance: { increment: payout.amount },
          },
        }),
      ])
      return NextResponse.json({ ok: true, payout: updated[0] })
    }

    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
