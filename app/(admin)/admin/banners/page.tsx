import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import BannersClient from "./BannersClient"

export default async function BannersPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")
  const banners = await prisma.banner.findMany({ orderBy: { sortOrder: "asc" } })
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Banners</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage the homepage hero banner. The first active banner (by sort order) is shown full-bleed at the top of the storefront. When none are active, the homepage falls back to a placeholder stock photo.
        </p>
      </div>
      <BannersClient data={JSON.parse(JSON.stringify(banners))} />
    </div>
  )
}
