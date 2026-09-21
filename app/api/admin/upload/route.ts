import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { createAdminClient } from "@/lib/supabase"
import sharp from "sharp"

const ALLOWED_BUCKETS = ["product-images", "category-images", "brand-images", "bundle-images", "blog-images"]
const MAX_WIDTH = 1200
const WEBP_QUALITY = 82

async function compressToWebP(buffer: ArrayBuffer): Promise<{ data: Buffer; contentType: string; ext: string }> {
  try {
    const data = await sharp(Buffer.from(buffer))
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer()
    return { data, contentType: "image/webp", ext: "webp" }
  } catch {
    // Fall back to original if sharp fails
    return { data: Buffer.from(buffer), contentType: "application/octet-stream", ext: "jpg" }
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const supabase = createAdminClient()

    const formData = await req.formData()
    const file = formData.get("file") as File
    const bucketParam = (formData.get("bucket") as string | null)?.trim()
    const BUCKET = bucketParam && ALLOWED_BUCKETS.includes(bucketParam) ? bucketParam : "product-images"

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const exists = buckets?.some(b => b.name === BUCKET)
    if (!exists) {
      await supabase.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 5242880 })
    }
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const allowed = ["jpg", "jpeg", "png", "webp", "avif"]
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: "Only JPG, PNG, WEBP, AVIF allowed" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const { data: compressed, contentType: compressedType, ext: compressedExt } = await compressToWebP(arrayBuffer)

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${compressedExt}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filename, compressed, { contentType: compressedType, upsert: false })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename)

    return NextResponse.json({ url: publicUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
