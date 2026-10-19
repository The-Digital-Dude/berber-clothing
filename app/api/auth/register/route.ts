import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase"
import { brevoSubscribe } from "@/lib/brevo"
import { sendWelcomeEmail } from "@/lib/email"
import { linkReferralIfPresent } from "@/lib/referral"
import { createAdminNotification } from "@/lib/adminNotifications"

// Called right after a successful supabase.auth.signUp() on the client.
// Creates the matching Prisma profile row and mirrors the role into
// Supabase app_metadata so middleware can read it at the edge.
export async function POST(req: Request) {
  try {
    const { id, name, email, phone } = await req.json()

    if (!id || !name || !email) {
      return NextResponse.json({ error: "id, name and email are required" }, { status: 400 })
    }

    // This endpoint is unauthenticated, so never trust the body alone: the id
    // must be a real Supabase auth user whose email matches what was sent.
    const admin = createAdminClient()
    const { data: authData, error: authLookupError } = await admin.auth.admin.getUserById(id)
    if (authLookupError || !authData?.user || authData.user.email?.toLowerCase() !== String(email).toLowerCase()) {
      return NextResponse.json({ error: "Invalid registration" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    // An already-registered profile may only be edited by its signed-in owner.
    if (existing) {
      const session = await auth()
      if (session?.user.id !== id) {
        return NextResponse.json({ id: existing.id, name: existing.name, email: existing.email }, { status: 200 })
      }
    }

    const user = await prisma.user.upsert({
      where: { id },
      update: { name, phone: phone || null },
      create: { id, name, email, phone: phone || null, role: "CUSTOMER" },
    })

    await admin.auth.admin.updateUserById(id, {
      app_metadata: { role: user.role },
      user_metadata: { name },
    })

    // Fire-and-forget: welcome email + marketing list subscriptions
    sendWelcomeEmail({ to: email, name }).catch(() => {})
    brevoSubscribe(email, name).catch(() => {})

    if (!existing) {
      createAdminNotification({
        type: "new_customer",
        title: `New customer: ${name}`,
        message: `${email} just created an account`,
        link: "/admin/customers",
        entityId: user.id,
      })
    }

    // Attribute this signup to whoever referred them, if any
    const refCode = (await cookies()).get("berber_ref")?.value
    linkReferralIfPresent(user.id, refCode).catch(() => {})

    return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 })
  } catch (error: any) {
    console.error("[register]", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
