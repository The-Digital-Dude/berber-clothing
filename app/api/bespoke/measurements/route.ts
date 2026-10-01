import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ profiles: [] })
    }

    const profiles = await prisma.measurementProfile.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error("[BESPOKE_MEASUREMENTS_GET]", error)
    return NextResponse.json({ error: "Failed to fetch measurement profiles" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    const body = await req.json()
    const {
      profileName = "My Bespoke Fit",
      isDefault = false,
      heightCm,
      weightKg,
      age,
      fitPreference = "SLIM",
      shoulderType = "NORMAL",
      postureType = "REGULAR",
      unit = "inch",
      neck,
      chest,
      stomach,
      hips,
      shoulderWidth,
      sleeveLength,
      bicep,
      wrist,
      jacketLength,
      trouserWaist,
      trouserHips,
      crotchDepth,
      inseam,
      outseam,
      thigh,
      knee,
      ankleOpening,
      tailorNotes,
      userId,
    } = body

    const targetUserId = session?.user?.id || userId
    if (!targetUserId) {
      return NextResponse.json({ error: "User identity required" }, { status: 400 })
    }

    if (isDefault) {
      await prisma.measurementProfile.updateMany({
        where: { userId: targetUserId },
        data: { isDefault: false },
      })
    }

    const profile = await prisma.measurementProfile.create({
      data: {
        userId: targetUserId,
        profileName: profileName.trim(),
        isDefault,
        heightCm: heightCm ? parseFloat(heightCm) : null,
        weightKg: weightKg ? parseFloat(weightKg) : null,
        age: age ? parseInt(age) : null,
        fitPreference,
        shoulderType,
        postureType,
        unit,
        neck: neck ? parseFloat(neck) : null,
        chest: chest ? parseFloat(chest) : null,
        stomach: stomach ? parseFloat(stomach) : null,
        hips: hips ? parseFloat(hips) : null,
        shoulderWidth: shoulderWidth ? parseFloat(shoulderWidth) : null,
        sleeveLength: sleeveLength ? parseFloat(sleeveLength) : null,
        bicep: bicep ? parseFloat(bicep) : null,
        wrist: wrist ? parseFloat(wrist) : null,
        jacketLength: jacketLength ? parseFloat(jacketLength) : null,
        trouserWaist: trouserWaist ? parseFloat(trouserWaist) : null,
        trouserHips: trouserHips ? parseFloat(trouserHips) : null,
        crotchDepth: crotchDepth ? parseFloat(crotchDepth) : null,
        inseam: inseam ? parseFloat(inseam) : null,
        outseam: outseam ? parseFloat(outseam) : null,
        thigh: thigh ? parseFloat(thigh) : null,
        knee: knee ? parseFloat(knee) : null,
        ankleOpening: ankleOpening ? parseFloat(ankleOpening) : null,
        tailorNotes: tailorNotes || null,
      },
    })

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error("[BESPOKE_MEASUREMENTS_POST]", error)
    return NextResponse.json({ error: "Failed to save measurement profile" }, { status: 500 })
  }
}
