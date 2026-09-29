import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { logAudit } from "@/lib/auditLog"

// Lets an admin correct the delivery details snapshotted onto an order
// (name, phone, address, division/district/area) — e.g. the customer moved,
// gave a wrong phone number, or wants the parcel sent somewhere else. This
// only edits the order's own shipping snapshot; it does not touch the
// customer's saved Address book, and it does not recompute shipping charge
// even if the district changes (the charge was fixed at checkout time).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const { shippingName, shippingPhone, shippingAddress, shippingArea, shippingDistrict, shippingDivision } = await req.json()

  if (!shippingName?.trim() || !shippingPhone?.trim() || !shippingAddress?.trim() || !shippingDivision?.trim() || !shippingDistrict?.trim() || !shippingArea?.trim()) {
    return NextResponse.json({ error: "Name, phone, address, division, district and area are all required" }, { status: 400 })
  }

  const existing = await prisma.order.findUnique({
    where: { id },
    select: { shippingName: true, shippingPhone: true, shippingAddress: true, shippingArea: true, shippingDistrict: true, shippingDivision: true, status: true },
  })
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 })
  if (["SHIPPED", "DELIVERED", "CANCELLED"].includes(existing.status)) {
    return NextResponse.json({ error: `Delivery details can't be changed once an order is ${existing.status.toLowerCase()}` }, { status: 400 })
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      shippingName: shippingName.trim(),
      shippingPhone: shippingPhone.trim(),
      shippingAddress: shippingAddress.trim(),
      shippingArea: shippingArea.trim(),
      shippingDistrict: shippingDistrict.trim(),
      shippingDivision: shippingDivision.trim(),
    },
  })

  await prisma.orderStatusLog.create({
    data: { orderId: id, status: existing.status, note: "Delivery details updated via Admin Panel" },
  })

  await logAudit({
    actorId: session!.user.id,
    actorEmail: session!.user.email,
    actorRole: session!.user.role,
    action: "order.shipping_updated",
    entityType: "Order",
    entityId: id,
    before: existing,
    after: { shippingName: updated.shippingName, shippingPhone: updated.shippingPhone, shippingAddress: updated.shippingAddress, shippingArea: updated.shippingArea, shippingDistrict: updated.shippingDistrict, shippingDivision: updated.shippingDivision },
  })

  return NextResponse.json({ order: updated })
}
