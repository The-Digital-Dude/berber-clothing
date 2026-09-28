import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import WorkflowsClient from "./WorkflowsClient"
import { Zap, GitBranch, Play, CheckCircle2 } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function WorkflowsPage() {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")

  const workflows = await prisma.workflow.findMany({
    include: { _count: { select: { runs: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
              <Zap className="w-3.5 h-3.5" />
              Event-Driven Automations
            </span>
            <span className="text-xs text-zinc-600 font-medium">Trigger-condition-action workflow engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">Automation Workflows</h1>
          <p className="text-sm text-zinc-600 mt-0.5">
            Construct automated pipelines that trigger custom emails, apply customer tags, issue store credit, or notify staff based on shopper actions.
          </p>
        </div>
      </div>

      <WorkflowsClient data={JSON.parse(JSON.stringify(workflows))} />
    </div>
  )
}
