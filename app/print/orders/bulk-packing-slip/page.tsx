import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import PrintButton from "../[id]/packing-slip/PrintButton"
import { PackingSlipContent } from "@/components/print/PackingSlipContent"

// Prints multiple orders' packing slips onto A4 sheets. Rather than
// forcing a fixed count per sheet, each slip is left at its natural
// content height and marked `break-inside: avoid` — the print engine
// then packs as many whole slips as actually fit on each page based on
// their real height (a 1-item order and a 6-item order don't take the
// same space), and only overflows a slip to the next page when it
// genuinely doesn't fit, instead of ever splitting one slip across two
// pages. Same "lives outside app/(admin)/admin/**" reasoning as the
// single-order packing slip page — see its comment.
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
          @page {
            size: 3in 3in;
            margin: 0mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #fff;
            color: #000;
          }
          .slip-wrap {
            width: 100%;
            max-width: 76.2mm;
            background: #fff;
            overflow: hidden;
            page-break-inside: avoid;
            break-inside: avoid;
            page-break-after: always;
            break-after: page;
          }
          .slip-wrap:last-child {
            page-break-after: avoid;
            break-after: avoid;
          }
          @media screen {
            body {
              background: #e4e4e7;
              padding: 24px 16px;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 16px;
            }
            .preview-banner {
              background: #18181b;
              color: #fafafa;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 11px;
              font-weight: 600;
              padding: 6px 14px;
              border-radius: 9999px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            }
            .slip-wrap {
              width: 76.2mm;
              height: 76.2mm;
              background: #fff;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
              border-radius: 4px;
              padding: 2.5mm 3mm;
            }
          }
          @media print {
            html, body {
              width: 3in !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .preview-banner, button {
              display: none !important;
              visibility: hidden !important;
              height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            body {
              background: #fff !important;
              padding: 0 !important;
              gap: 0 !important;
              display: block !important;
            }
            .slip-wrap {
              box-shadow: none !important;
              border-radius: 0 !important;
              padding: 2mm 2.5mm !important;
              max-width: 3in !important;
              width: 3in !important;
              height: 3in !important;
              max-height: 3in !important;
              box-sizing: border-box !important;
              overflow: hidden !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-after: always !important;
              break-after: page !important;
            }
            .slip-wrap:last-child {
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
          }
        `}</style>
      </head>
      <body>
        <div className="preview-banner">
          🏷️ 3" × 3" Thermal Bulk Labels ({orders.length} orders)
        </div>
        {orders.map((order) => (
          <div key={order.id} className="slip-wrap">
            <PackingSlipContent order={order as any} storeName={storeName} supportPhone={supportPhone} />
          </div>
        ))}
        <PrintButton />
      </body>
    </html>
  )
}
