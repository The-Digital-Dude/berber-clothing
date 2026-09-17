import prisma from "@/lib/prisma"
import { serialize } from "@/lib/utils"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import BundleDetail from "./BundleDetail"

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const bundle = await prisma.bundle.findUnique({ where: { slug: params.slug } })
  if (!bundle) return {}
  return {
    title: `${bundle.name} — Berber`,
    description: bundle.description ?? `Save with the ${bundle.name} bundle from Berber.`,
  }
}

export default async function BundleDetailPage({ params }: { params: { slug: string } }) {
  const bundle = await prisma.bundle.findUnique({
    where: { slug: params.slug, isActive: true },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" } },
              variants: true,
            },
          },
        },
      },
    },
  })

  if (!bundle) notFound()

  return <BundleDetail bundle={JSON.parse(JSON.stringify(bundle))} />
}
