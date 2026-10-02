import { redirect, notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function PackingSlipQueryRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams
  if (!id) {
    notFound()
  }
  redirect(`/print/orders/${encodeURIComponent(id)}/packing-slip`)
}
