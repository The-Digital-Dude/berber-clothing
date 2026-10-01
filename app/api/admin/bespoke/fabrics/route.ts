import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET: Fetch all bespoke fabrics with optional filtering
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const season = searchParams.get("season")
    const search = searchParams.get("search")

    const where: any = {}
    if (season && season !== "ALL") {
      where.season = { contains: season, mode: "insensitive" }
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { millName: { contains: search, mode: "insensitive" } },
      ]
    }

    const fabrics = await prisma.bespokeFabric.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ fabrics })
  } catch (error) {
    console.error("[ADMIN_BESPOKE_FABRICS_GET]", error)
    return NextResponse.json({ error: "Failed to fetch fabrics" }, { status: 500 })
  }
}

// POST: Create a new bespoke fabric
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      name,
      code,
      millName,
      composition = "100% Wool",
      superCount = "Super 150s",
      weightGsm = 280,
      pattern = "Solid",
      colorHex = "#1a2436",
      textureImageUrl = "https://images.unsplash.com/photo-1594938298603-c8148c4b2fc4?q=80&w=800&auto=format&fit=crop",
      swatchImageUrl = "https://images.unsplash.com/photo-1594938298603-c8148c4b2fc4?q=80&w=300&auto=format&fit=crop",
      pricePerMeter = 3500,
      stockMeters = 50,
      isAvailable = true,
      season = "All Season",
    } = body

    if (!name || !code || !pricePerMeter) {
      return NextResponse.json(
        { error: "Cloth name, unique code, and price per meter are required." },
        { status: 400 }
      )
    }

    const fabric = await prisma.bespokeFabric.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        millName: millName ? millName.trim() : null,
        composition: composition.trim(),
        superCount: superCount ? superCount.trim() : null,
        weightGsm: weightGsm ? parseInt(weightGsm) : null,
        pattern: pattern.trim(),
        colorHex: colorHex.trim(),
        textureImageUrl: textureImageUrl.trim(),
        swatchImageUrl: swatchImageUrl ? swatchImageUrl.trim() : textureImageUrl.trim(),
        pricePerMeter: parseFloat(pricePerMeter),
        stockMeters: stockMeters ? parseFloat(stockMeters) : 0,
        isAvailable: isAvailable ?? true,
        season: season ? season.trim() : "All Season",
      },
    })

    return NextResponse.json({ success: true, fabric })
  } catch (error: any) {
    console.error("[ADMIN_BESPOKE_FABRICS_POST]", error)
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Cloth code already exists. Please use a unique code." }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create bespoke fabric" }, { status: 500 })
  }
}

// PATCH: Update an existing fabric
export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Fabric ID is required" }, { status: 400 })
    }

    const updateData: any = {}
    if (updates.name !== undefined) updateData.name = updates.name.trim()
    if (updates.code !== undefined) updateData.code = updates.code.trim().toUpperCase()
    if (updates.millName !== undefined) updateData.millName = updates.millName ? updates.millName.trim() : null
    if (updates.composition !== undefined) updateData.composition = updates.composition.trim()
    if (updates.superCount !== undefined) updateData.superCount = updates.superCount.trim()
    if (updates.weightGsm !== undefined) updateData.weightGsm = parseInt(updates.weightGsm)
    if (updates.pattern !== undefined) updateData.pattern = updates.pattern.trim()
    if (updates.colorHex !== undefined) updateData.colorHex = updates.colorHex.trim()
    if (updates.textureImageUrl !== undefined) updateData.textureImageUrl = updates.textureImageUrl.trim()
    if (updates.swatchImageUrl !== undefined) updateData.swatchImageUrl = updates.swatchImageUrl.trim()
    if (updates.pricePerMeter !== undefined) updateData.pricePerMeter = parseFloat(updates.pricePerMeter)
    if (updates.stockMeters !== undefined) updateData.stockMeters = parseFloat(updates.stockMeters)
    if (updates.isAvailable !== undefined) updateData.isAvailable = updates.isAvailable
    if (updates.season !== undefined) updateData.season = updates.season.trim()

    const updated = await prisma.bespokeFabric.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, fabric: updated })
  } catch (error) {
    console.error("[ADMIN_BESPOKE_FABRICS_PATCH]", error)
    return NextResponse.json({ error: "Failed to update fabric" }, { status: 500 })
  }
}

// DELETE: Remove a fabric
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Fabric ID is required" }, { status: 400 })
    }

    await prisma.bespokeFabric.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ADMIN_BESPOKE_FABRICS_DELETE]", error)
    return NextResponse.json({ error: "Failed to delete fabric" }, { status: 500 })
  }
}
