import prisma from "@/lib/prisma"
import { serialize } from "@/lib/utils"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import BundleDetail from "./BundleDetail"
import { isValidFixedSuitBundle } from "@/lib/suitPurchasePolicy"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const bundle = await prisma.bundle.findUnique({ where: { slug } })
  if (!bundle) return {}
  return {
    title: `${bundle.name} — Berber`,
    description: bundle.description ?? `Save with the ${bundle.name} bundle from Berber.`,
  }
}

export default async function BundleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const bundle = await prisma.bundle.findUnique({
    where: { slug, isActive: true },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" } },
              variants: true,
              category: true,
            },
          },
        },
      },
    },
  })

  if (!bundle || bundle.type !== "FIXED" || !isValidFixedSuitBundle(bundle.items)) notFound()

  return <BundleDetail bundle={JSON.parse(JSON.stringify(bundle))} />
}
