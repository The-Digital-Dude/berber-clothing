import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { logAudit } from "@/lib/auditLog"
import { sendOrderConfirmation } from "@/lib/email"

// Lets an admin correct the delivery details snapshotted onto an order
// (name, phone, email, address, division/district/area) — e.g. the customer moved,
// gave a wrong phone number or email, or wants the parcel sent somewhere else.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const {
    shippingName,
    shippingPhone,
    shippingAddress,
    shippingArea,
    shippingDistrict,
    shippingDivision,
    email,
    linkToUser,
    sendConfirmationEmail,
  } = await req.json()

  if (
    !shippingName?.trim() ||
    !shippingPhone?.trim() ||
    !shippingAddress?.trim() ||
    !shippingDivision?.trim() ||
    !shippingDistrict?.trim() ||
    !shippingArea?.trim()
  ) {
    return NextResponse.json(
      { error: "Name, phone, address, division, district and area are all required" },
      { status: 400 }
    )
  }

  const existing = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      address: true,
      items: { include: { product: { include: { images: true } } } },
      payment: true,
      delivery: true,
      statusLogs: { orderBy: { createdAt: "desc" } },
    },
  })
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 })
  if (["SHIPPED", "DELIVERED", "CANCELLED"].includes(existing.status)) {
    return NextResponse.json(
      { error: `Delivery details can't be changed once an order is ${existing.status.toLowerCase()}` },
      { status: 400 }
    )
  }

  const normalizedEmail = email !== undefined ? (email?.trim() || null) : existing.guestEmail

  let targetUserId = existing.userId
  let isGuestOrder = existing.isGuest

  if (normalizedEmail) {
    const matchingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    })

    if (matchingUser && linkToUser) {
      targetUserId = matchingUser.id
      isGuestOrder = false
    } else if (!existing.userId) {
      isGuestOrder = true
    }
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
      guestEmail: normalizedEmail,
      userId: targetUserId,
      isGuest: isGuestOrder,
    },
    include: {
      user: true,
      address: true,
      items: { include: { product: { include: { images: true } } } },
      payment: true,
      delivery: true,
      statusLogs: { orderBy: { createdAt: "desc" } },
    },
  })

  const emailChangeNote =
    normalizedEmail !== existing.guestEmail
      ? ` (Email updated to: ${normalizedEmail || "none"}${targetUserId && linkToUser ? " · linked to user account" : ""})`
      : ""

  await prisma.orderStatusLog.create({
    data: {
      orderId: id,
      status: existing.status,
      note: `Delivery & customer contact details updated via Admin Panel${emailChangeNote}`,
    },
  })

  await logAudit({
    actorId: session!.user.id,
    actorEmail: session!.user.email,
    actorRole: session!.user.role,
    action: "order.shipping_updated",
    entityType: "Order",
    entityId: id,
    before: {
      shippingName: existing.shippingName,
      shippingPhone: existing.shippingPhone,
      shippingAddress: existing.shippingAddress,
      guestEmail: existing.guestEmail,
      userId: existing.userId,
    },
    after: {
      shippingName: updated.shippingName,
      shippingPhone: updated.shippingPhone,
      shippingAddress: updated.shippingAddress,
      guestEmail: updated.guestEmail,
      userId: updated.userId,
    },
  })

  // Optionally send confirmation email if requested and customer has an email
  const recipientEmail = updated.user?.email || updated.guestEmail
  if (sendConfirmationEmail && recipientEmail) {
    sendOrderConfirmation({
      to: recipientEmail,
      orderNumber: updated.orderNumber,
      customerName: updated.shippingName,
      items: updated.items.map((item: any) => ({
        productName: item.productName,
        size: item.size || "Default",
        color: item.color || "Default",
        quantity: item.quantity,
        price: Number(item.price),
      })),
      subtotal: Number(updated.subtotal),
      shippingCharge: Number(updated.shippingCharge),
      discount: Number(updated.discount),
      giftWrapCharge: Number(updated.giftWrapCharge || 0),
      total: Number(updated.total),
      paymentMethod: updated.paymentMethod,
      shippingName: updated.shippingName,
      shippingPhone: updated.shippingPhone,
      shippingAddress: updated.shippingAddress,
      shippingArea: updated.shippingArea,
      shippingDistrict: updated.shippingDistrict,
      shippingDivision: updated.shippingDivision,
      note: updated.note || null,
      giftWrap: updated.giftWrap || false,
      giftMessage: updated.giftMessage || null,
    }).catch((err) => {
      console.error("Failed to send order update confirmation email:", err)
    })
  }

  return NextResponse.json({ order: updated })
}
