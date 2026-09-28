import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import EmailStudioClient from "./EmailStudioClient"
import { Mail, Sparkles, Send, Layers } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function EmailStudioPage() {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              <Mail className="w-3.5 h-3.5" />
              Automated Communications
            </span>
            <span className="text-xs text-zinc-600 font-medium">Responsive HTML email rendering engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">Email Studio & Templates</h1>
          <p className="text-sm text-zinc-600 mt-0.5">
            Preview, customize, and test-send all customer transactional emails, cart recovery drips, and admin notification templates.
          </p>
        </div>
      </div>

      <EmailStudioClient />
    </div>
  )
}
