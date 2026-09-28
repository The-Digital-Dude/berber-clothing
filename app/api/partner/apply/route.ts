import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

function generateCode(name: string) {
  const clean = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5) || "PARTNER"
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `${clean}${rand}`
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    const body = await req.json()
    const {
      name,
      email,
      phone,
      partnerType = "BOTH", // AFFILIATE, RESELLER, BOTH
      shopName,
      facebookPage,
      website,
      payoutMethod = "BKASH",
      payoutNumber,
      bankName,
      bankAccountName,
      bankAccountNumber,
      bankBranch,
      bankRouting,
    } = body

    if (!name || !email) {
      return NextResponse.json({ error: "Name and Email are required" }, { status: 400 })
    }

    // Check if affiliate/partner already exists with this email
    const existing = await prisma.affiliate.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase().trim() },
          ...(session?.user?.id ? [{ userId: session.user.id }] : []),
        ],
      },
    })

    if (existing) {
      return NextResponse.json({
        error: "A partner application or profile already exists for this email/account.",
        partner: existing,
      }, { status: 409 })
    }

    let code = generateCode(shopName || name)
    let tries = 0
    while (tries < 5) {
      const codeExists = await prisma.affiliate.findUnique({ where: { code } })
      if (!codeExists) break
      code = generateCode(shopName || name)
      tries++
    }

    const partner = await prisma.affiliate.create({
      data: {
        userId: session?.user?.id || null,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone || null,
        code,
        partnerType,
        status: "APPROVED", // Auto-approved by default
        shopName: shopName || null,
        facebookPage: facebookPage || null,
        website: website || null,
        commissionType: "PERCENTAGE",
        commissionValue: 10,
        resellerDiscountPct: 15,
        payoutMethod,
        payoutNumber: payoutNumber || null,
        bankName: bankName || null,
        bankAccountName: bankAccountName || null,
        bankAccountNumber: bankAccountNumber || null,
        bankBranch: bankBranch || null,
        bankRouting: bankRouting || null,
        isActive: true,
      },
    })

    return NextResponse.json({ ok: true, partner })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to submit partner application" }, { status: 500 })
  }
}
