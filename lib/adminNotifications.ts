import prisma from "@/lib/prisma"

export type AdminNotificationType = "new_order" | "low_stock" | "order_cancelled" | "order_returned" | "new_customer" | "new_contact_message"

type CreateInput = {
  type: AdminNotificationType
  title: string
  message: string
  link?: string
  entityId?: string
}

/**
 * Records an event in the admin notification center. Fire-and-forget --
 * never throws, so a notification failure can't break checkout, order
 * updates, or any other flow that triggers one of these.
 */
export async function createAdminNotification(input: CreateInput): Promise<void> {
  try {
    await prisma.adminNotification.create({
      data: {
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link || null,
        entityId: input.entityId || null,
      },
    })
  } catch (err) {
    console.error("createAdminNotification failed", err)
  }
}
