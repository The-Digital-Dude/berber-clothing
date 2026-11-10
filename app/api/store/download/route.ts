import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Missing Supabase configuration (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)")
  }
  return createClient(url, key)
}

// GET /api/store/download?downloadId=xxx
export async function GET(req: Request) {
  const session = await auth()
  const { searchParams } = new URL(req.url)
  const downloadId = searchParams.get("downloadId")
  if (!downloadId) return NextResponse.json({ error: "Missing downloadId" }, { status: 400 })

  const download = await prisma.digitalDownload.findUnique({
    where: { id: downloadId },
    include: { asset: true },
  })
  if (!download) return NextResponse.json({ error: "Download not found" }, { status: 404 })

  // Auth check
  if (download.userId && session?.user.id !== download.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  // Expiry check
  if (download.expiresAt && new Date() > download.expiresAt) {
    return NextResponse.json({ error: "Download link has expired" }, { status: 410 })
  }

  // Download limit check
  if (download.maxDownloads !== null && download.downloadCount >= download.maxDownloads) {
    return NextResponse.json({ error: "Download limit reached" }, { status: 429 })
  }

  try {
    const supabaseAdmin = getSupabaseAdmin()
    // Generate signed URL from Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from("digital-assets")
      .createSignedUrl(download.asset.storagePath, 300) // 5 minutes

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 })
    }

    // Increment download count
    await prisma.digitalDownload.update({
      where: { id: downloadId },
      data: { downloadCount: { increment: 1 } },
    })

    return NextResponse.redirect(data.signedUrl)
  } catch (err: any) {
    console.error("[Download Route Error]:", err)
    return NextResponse.json({ error: err.message || "Failed to process download" }, { status: 500 })
  }
}
