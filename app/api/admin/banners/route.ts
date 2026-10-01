import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const banners = await prisma.banner.findMany({ orderBy: { sortOrder: "asc" } })
  return NextResponse.json(banners)
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const { title, image, link, isActive, sortOrder } = await req.json()
  if (!image) return NextResponse.json({ error: "Image is required" }, { status: 400 })

  const banner = await prisma.banner.create({
    data: {
      title: title || null,
      image,
      link: link || null,
      isActive: isActive ?? true,
      sortOrder: sortOrder ?? 0,
    },
  })
  return NextResponse.json(banner)
}
