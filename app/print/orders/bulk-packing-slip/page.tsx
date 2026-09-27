import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import PrintButton from "../[id]/packing-slip/PrintButton"
import { PackingSlipContent } from "@/components/print/PackingSlipContent"

// Prints multiple orders' packing slips onto A4 sheets, two slips per
// sheet (stacked, cut along the dashed line) instead of one order per
// receipt-width printout. Same "lives outside app/(admin)/admin/**"
// reasoning as the single-order packing slip page — see its comment.
export default async function BulkPackingSlipPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>
}) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/login")
  }

  const { ids } = await searchParams
  const orderIds = (ids || "").split(",").map(s => s.trim()).filter(Boolean)

  if (orderIds.length === 0) {
    return (
      <html>
        <body style={{ fontFamily: "sans-serif", padding: 40 }}>
          <p>No orders selected. Go back and select at least one order to print.</p>
        </body>
      </html>
    )
  }

  const [rawOrders, settings] = await Promise.all([
    prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: { items: true },
    }),
    prisma.setting.findMany({ where: { key: { in: ["store_name", "support_phone"] } } }),
  ])

  // Preserve the order the admin selected them in, not the DB's default order.
  const orders = orderIds.map(id => rawOrders.find(o => o.id === id)).filter(Boolean) as typeof rawOrders

  const map = Object.fromEntries(settings.map(s => [s.key, s.value]))
  const storeName = map.store_name || "Berber"
  const supportPhone = map.support_phone || ""

  return (
    <html>
      <head>
        <title>Packing Slips — {orders.length} orders</title>
        <style>{`
          @page { size: A4; margin: 10mm; }
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; }
          body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; background: #fff; }
          .slip-wrap { width: 100%; height: 138mm; padding-bottom: 6mm; overflow: hidden; }
          .slip-wrap.pair-top { border-bottom: 1px dashed #999; margin-bottom: 6mm; }
          .slip-wrap.page-end { page-break-after: always; }
          @media screen {
            body { background: #ddd; padding: 10mm 0; }
            .slip-wrap { background: #fff; max-width: 190mm; margin: 0 auto 6mm; box-shadow: 0 1px 4px rgba(0,0,0,0.2); padding: 8mm 8mm 6mm; }
            .slip-wrap.pair-top { border-bottom: 1px dashed #999; }
          }
          @media print { button { display: none; } }
        `}</style>
      </head>
      <body>
        {orders.map((order, i) => {
          const isBottomOfPair = i % 2 === 1
          const hasPairPartnerBelow = i % 2 === 0 && i + 1 < orders.length
          const isLastOverall = i === orders.length - 1
          const classes = [
            "slip-wrap",
            hasPairPartnerBelow ? "pair-top" : "",
            // Force a page break after every completed pair — but never
            // after the very last slip, or the print engine adds a
            // trailing blank page.
            (isBottomOfPair && !isLastOverall) ? "page-end" : "",
          ].filter(Boolean).join(" ")
          return (
            <div key={order.id} className={classes}>
              <PackingSlipContent order={order as any} storeName={storeName} supportPhone={supportPhone} />
            </div>
          )
        })}
        <PrintButton />
      </body>
    </html>
  )
}
