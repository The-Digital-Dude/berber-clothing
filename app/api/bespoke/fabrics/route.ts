import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const DEFAULT_BESPOKE_FABRICS = [
  {
    code: "VBC-150-NVY",
    name: "Midnight Navy Super 150s Merino",
    millName: "Vitale Barberis Canonico (Italy)",
    composition: "100% Australian Merino Wool",
    superCount: "Super 150s",
    weightGsm: 260,
    pattern: "Solid Twill",
    colorHex: "#1a2436",
    textureImageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4b2fc4?q=80&w=800&auto=format&fit=crop",
    swatchImageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4b2fc4?q=80&w=300&auto=format&fit=crop",
    pricePerMeter: 3500,
    season: "All Season",
  },
  {
    code: "LP-160-CHR",
    name: "Charcoal Herringbone Worsted Wool",
    millName: "Loro Piana (Italy)",
    composition: "95% Super 160s Wool, 5% Silk",
    superCount: "Super 160s",
    weightGsm: 275,
    pattern: "Herringbone",
    colorHex: "#2b2e34",
    textureImageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop",
    swatchImageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=300&auto=format&fit=crop",
    pricePerMeter: 4800,
    season: "All Season",
  },
  {
    code: "SCB-130-BLK",
    name: "Onyx Black Formal Barathea",
    millName: "Scabal (Savile Row / England)",
    composition: "100% Fine Wool Barathea",
    superCount: "Super 130s",
    weightGsm: 300,
    pattern: "Barathea Weave",
    colorHex: "#111215",
    textureImageUrl: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=800&auto=format&fit=crop",
    swatchImageUrl: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=300&auto=format&fit=crop",
    pricePerMeter: 4200,
    season: "All Season",
  },
  {
    code: "HL-LIN-SND",
    name: "Sandstone Royal Irish Linen",
    millName: "Holland & Sherry (Scotland)",
    composition: "100% Pure Irish Linen",
    superCount: "Natural Slub",
    weightGsm: 240,
    pattern: "Plain Linen",
    colorHex: "#d1c2a5",
    textureImageUrl: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?q=80&w=800&auto=format&fit=crop",
    swatchImageUrl: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?q=80&w=300&auto=format&fit=crop",
    pricePerMeter: 3200,
    season: "Summer / Destination",
  },
  {
    code: "DRM-140-GLN",
    name: "Classic Glen Plaid Prince of Wales",
    millName: "Dormeuil (France / England)",
    composition: "100% Worsted Wool",
    superCount: "Super 140s",
    weightGsm: 280,
    pattern: "Glen Plaid / Check",
    colorHex: "#4a4c52",
    textureImageUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop",
    swatchImageUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=300&auto=format&fit=crop",
    pricePerMeter: 3900,
    season: "All Season",
  },
  {
    code: "VBC-130-EMR",
    name: "Imperial Emerald Evening Velvet",
    millName: "Reda (Italy)",
    composition: "100% Cotton Velvet",
    superCount: "Plush Velvet",
    weightGsm: 340,
    pattern: "Velvet",
    colorHex: "#12372a",
    textureImageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4b2fc4?q=80&w=800&auto=format&fit=crop",
    swatchImageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4b2fc4?q=80&w=300&auto=format&fit=crop",
    pricePerMeter: 4500,
    season: "Winter / Gala",
  },
]

export async function GET() {
  try {
    let fabrics = await prisma.bespokeFabric.findMany({
      where: { isAvailable: true },
      orderBy: { createdAt: "desc" },
    })

    // Seed defaults if empty
    if (fabrics.length === 0) {
      await prisma.bespokeFabric.createMany({
        data: DEFAULT_BESPOKE_FABRICS.map((f) => ({
          ...f,
          stockMeters: 50,
          isAvailable: true,
        })),
        skipDuplicates: true,
      })
      fabrics = await prisma.bespokeFabric.findMany({
        where: { isAvailable: true },
      })
    }

    return NextResponse.json({ fabrics })
  } catch (error) {
    console.error("[BESPOKE_FABRICS_GET]", error)
    return NextResponse.json({ fabrics: DEFAULT_BESPOKE_FABRICS })
  }
}
