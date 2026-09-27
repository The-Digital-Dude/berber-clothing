import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import PrintButton from "./PrintButton"
import { PackingSlipContent } from "@/components/print/PackingSlipContent"

// Deliberately NOT nested under app/(admin)/admin/** — that layout renders
// the sidebar/topbar admin chrome around {children}, but this page renders
// its own full <html>/<body> (a clean, print-friendly document meant to be
// sent straight to a printer). Next.js has no way for a nested page to
// "opt out" of an ancestor layout's rendered UI, so the only way to get a
// truly standalone document is to live outside that layout's subtree —
// which means auth has to be checked explicitly here instead of inheriting
// it for free from app/(admin)/admin/layout.tsx.
//
// Prints on A4 (not a narrow receipt-width layout) with 2 copies of the
// same slip per sheet — one for the parcel, one to keep as a paper record
// — instead of wasting a whole sheet on a single narrow slip.
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
          @page { size: A4; margin: 10mm; }
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; }
          body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; background: #fff; }
          .slip-wrap { width: 100%; height: 138mm; padding-bottom: 6mm; overflow: hidden; }
          .slip-wrap.pair-top { border-bottom: 1px dashed #999; margin-bottom: 6mm; }
          @media screen {
            body { background: #ddd; padding: 10mm 0; }
            .slip-wrap { background: #fff; max-width: 190mm; margin: 0 auto 6mm; box-shadow: 0 1px 4px rgba(0,0,0,0.2); padding: 8mm 8mm 6mm; height: auto; }
          }
          @media print { button { display: none; } }
        `}</style>
      </head>
      <body>
        <div className="slip-wrap pair-top">
          <PackingSlipContent order={order as any} storeName={storeName} supportPhone={supportPhone} />
        </div>
        <div className="slip-wrap">
          <PackingSlipContent order={order as any} storeName={storeName} supportPhone={supportPhone} />
        </div>
        <PrintButton />
      </body>
    </html>
  )
}
