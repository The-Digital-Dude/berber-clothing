import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"))
  return lines.slice(1).map((line) => {
    const values = line.split(",")
    return Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? "").trim()]))
  })
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "CSV file required" }, { status: 400 })

  const text = await file.text()
  const rows = parseCSV(text)

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of rows) {
    const email = row.email
    if (!email) { skipped++; continue }

    try {
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) { skipped++; continue }

      // Create a minimal user record (no auth — they'll sign in via email)
      await prisma.user.create({
        data: {
          id: `import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          email,
          name: row.name || row.full_name || null,
          phone: row.phone || null,
          role: "CUSTOMER",
        },
      })
      imported++
    } catch (e: any) {
      errors.push(`${email}: ${e.message}`)
    }
  }

  return NextResponse.json({ imported, skipped, errors: errors.slice(0, 20) })
}
