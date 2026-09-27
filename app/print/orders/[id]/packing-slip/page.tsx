import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import PrintButton from "./PrintButton"
import { PackingSlipContent } from "@/components/print/PackingSlipContent"

// Deliberately NOT nested under app/(admin)/admin/** — that layout renders
// the sidebar/topbar admin chrome around {children}, but this page renders
// its own full <html>/<body> (a clean, print-friendly document meant to be
// sent straight to a receipt/thermal printer). Next.js has no way for a
// nested page to "opt out" of an ancestor layout's rendered UI, so the only
// way to get a truly standalone document is to live outside that layout's
// subtree — which means auth has to be checked explicitly here instead of
// inheriting it for free from app/(admin)/admin/layout.tsx.
export default async function PackingSlipPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/login")
  }

  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { include: { images: { take: 1 } } } } },
    },
  })
  if (!order) notFound()

  const settings = await prisma.setting.findMany({ where: { key: { in: ["store_name", "support_phone"] } } })
  const map = Object.fromEntries(settings.map(s => [s.key, s.value]))
  const storeName = map.store_name || "Berber"
  const supportPhone = map.support_phone || ""

  return (
    <html>
      <head>
        <title>Packing Slip — {order.orderNumber}</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; background: #fff; padding: 20px; max-width: 148mm; }
          @media print { button { display: none; } }
        `}</style>
      </head>
      <body>
        <PackingSlipContent order={order as any} storeName={storeName} supportPhone={supportPhone} />
        <PrintButton />
      </body>
    </html>
  )
}
