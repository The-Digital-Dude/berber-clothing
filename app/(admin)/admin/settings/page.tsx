import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import { SettingsClient } from "./SettingsClient"
import { Settings, Sliders, Shield } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")

  const settings = await prisma.setting.findMany()
  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value
    return acc
  }, {} as Record<string, string>)

  const staff = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "STAFF"] },
    },
    orderBy: { createdAt: "desc" },
  })

  const formattedStaff = staff.map((s) => ({
    id: s.id,
    name: s.name || "N/A",
    email: s.email,
    role: s.role,
  }))

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
              <Sliders className="w-3.5 h-3.5" />
              Store Configuration
            </span>
            <span className="text-xs text-zinc-600 font-medium">Global store variables & staff management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">System & Store Settings</h1>
          <p className="text-sm text-zinc-600 mt-0.5">
            Configure store branding, SEO defaults, payment gateway keys, courier credentials, and administrative team access.
          </p>
        </div>
      </div>

      <SettingsClient initialSettings={settingsMap} initialStaff={formattedStaff} />
    </div>
  )
}
