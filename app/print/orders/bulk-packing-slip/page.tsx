import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import PrintButton from "../[id]/packing-slip/PrintButton"
import { PackingSlipContent } from "@/components/print/PackingSlipContent"
import { generateQrCodeDataUrl } from "@/lib/barcode"

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
      <div style={{ fontFamily: "sans-serif", padding: 40, background: "#fff" }}>
        <p>No orders selected. Go back and select at least one order to print.</p>
      </div>
    )
  }

  const [rawOrders, settings] = await Promise.all([
    prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: {
        items: true,
        delivery: true,
      },
    }),
    prisma.setting.findMany({ where: { key: { in: ["store_name", "support_phone", "store_url"] } } }),
  ])

  // Preserve the order the admin selected them in, not the DB's default order.
  const orders = orderIds.map(id => rawOrders.find(o => o.id === id)).filter(Boolean) as typeof rawOrders

  const map = Object.fromEntries(settings.map(s => [s.key, s.value]))
  const storeName = map.store_name || "Berber"
  const supportPhone = map.support_phone || ""
  const siteUrl = (map.store_url || process.env.NEXT_PUBLIC_SITE_URL || "https://www.berber.clothing").replace(/\/+$/, "")

  // Generate QR codes for all orders targeting on-site tracking in parallel
  const qrCodes = await Promise.all(
    orders.map(order => {
      const trackingTarget = `${siteUrl}/track?order=${encodeURIComponent(order.orderNumber)}`
      return generateQrCodeDataUrl(trackingTarget)
    })
  )

  return (
    <div className="print-bulk-slips-container">
      <style>{`
        @page {
          size: 3in 3in;
          margin: 0;
        }
        @media screen {
          .print-bulk-slips-container {
            min-height: 100vh;
            background: #e4e4e7;
            padding: 24px 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
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
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .slip-wrap {
            width: 76.2mm;
            min-height: 76.2mm;
            max-width: 76.2mm;
            background: #fff;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            border-radius: 4px;
            padding: 2mm 3mm;
            overflow: hidden;
            display: flex;
            justify-content: center;
          }
        }
        @media print {
          html, body {
            width: 3in !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          .print-bulk-slips-container {
            background: #fff !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
          }
          .slip-wrap {
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 1mm 0 !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 65mm !important;
            height: 3in !important;
            max-height: 3in !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            display: block !important;
          }
        }
      `}</style>

      <div className="preview-banner no-print">
        <span>🏷️ Bulk Steadfast Packing Slips ({orders.length} orders)</span>
      </div>

      <div className="no-print mb-2">
        <PrintButton />
      </div>

      {orders.map((order, idx) => (
        <div key={order.id} className="slip-wrap">
          <PackingSlipContent
            order={order as any}
            storeName={storeName}
            supportPhone={supportPhone}
            qrDataUrl={qrCodes[idx]}
          />
        </div>
      ))}
    </div>
  )
}
