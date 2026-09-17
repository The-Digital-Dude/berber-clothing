import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import QAClient from "./QAClient"

export const dynamic = "force-dynamic"

export default async function QAPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")

  const qas = await prisma.reviewQA.findMany({
    include: { product: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Product Q&A</h1>
        <p className="text-sm text-muted-foreground mt-1">Answer customer questions and manage published Q&A.</p>
      </div>
      <QAClient data={JSON.parse(JSON.stringify(qas))} />
    </div>
  )
}
