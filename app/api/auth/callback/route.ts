import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase"
import prisma from "@/lib/prisma"

// Handles the redirect back from Supabase (OAuth + password recovery).
export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? ""

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
  }

  // Password recovery — redirect straight to the reset page
  if (next === "/reset-password") {
    return NextResponse.redirect(`${origin}/reset-password`)
  }

  const { id, email, user_metadata } = data.user

  let profile = await prisma.user.findUnique({ where: { id } })
  if (!profile) {
    profile = await prisma.user.create({
      data: {
        id,
        email: email ?? "",
        name: (user_metadata?.full_name as string) || (user_metadata?.name as string) || null,
        image: (user_metadata?.avatar_url as string) || null,
        role: "CUSTOMER",
      },
    })

    const admin = createAdminClient()
    await admin.auth.admin.updateUserById(id, { app_metadata: { role: "CUSTOMER" } })
  }

  const redirectTo = profile.role === "ADMIN" ? "/admin" : "/account"
  return NextResponse.redirect(`${origin}${redirectTo}`)
}
