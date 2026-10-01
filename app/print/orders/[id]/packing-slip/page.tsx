import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import PrintButton from "./PrintButton"
import { PackingSlipContent } from "@/components/print/PackingSlipContent"
import { generateQrCodeDataUrl } from "@/lib/barcode"

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
      delivery: true,
    },
  })
  if (!order) notFound()

  const settings = await prisma.setting.findMany({ where: { key: { in: ["store_name", "support_phone", "store_url"] } } })
  const map = Object.fromEntries(settings.map(s => [s.key, s.value]))
  const storeName = map.store_name || "Berber"
  const supportPhone = map.support_phone || ""
  const siteUrl = map.store_url || process.env.NEXT_PUBLIC_SITE_URL || "https://www.berber.clothing"

  // QR Code points to on-site live tracking page
  const trackingTarget = `${siteUrl.replace(/\/+$/, "")}/track?order=${encodeURIComponent(order.orderNumber)}`
  const qrDataUrl = await generateQrCodeDataUrl(trackingTarget)

  return (
    <div className="print-slip-container">
      <style>{`
        @page {
          size: 3in 3in;
          margin: 0;
        }
        @media screen {
          .print-slip-container {
            min-height: 100vh;
            background: #e4e4e7;
            padding: 24px 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .preview-banner {
            background: #18181b;
            color: #fafafa;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 11px;
            font-weight: 600;
            padding: 6px 14px;
            border-radius: 9999px;
            margin-bottom: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
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
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-slip-container {
            background: #fff !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 3in !important;
            height: 3in !important;
            max-height: 3in !important;
            overflow: hidden !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .slip-wrap {
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 1.5mm 1mm !important;
            margin: 0 auto !important;
            width: 3in !important;
            max-width: 3in !important;
            height: 3in !important;
            max-height: 3in !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
          }
        }
      `}</style>
      <div className="preview-banner no-print">
        🏷️ Steadfast 3" × 3" Packing Label Preview
      </div>
      <div className="slip-wrap">
        <PackingSlipContent
          order={order as any}
          storeName={storeName}
          supportPhone={supportPhone}
          qrDataUrl={qrDataUrl}
        />
      </div>
      <div className="no-print">
        <PrintButton />
      </div>
    </div>
  )
}
