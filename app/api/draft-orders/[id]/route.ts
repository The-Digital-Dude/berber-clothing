import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Public route — anyone with the ID can view the draft (it contains a link sent via email/WhatsApp)
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const draft = await prisma.draftOrder.findUnique({ where: { id } })
  if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ ...draft, items: JSON.parse(draft.items) })
}
