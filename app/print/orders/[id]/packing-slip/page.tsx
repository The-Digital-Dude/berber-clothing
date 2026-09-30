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
          @page {
            size: 3in 3in;
            margin: 2mm;
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
            max-width: 76mm;
            margin: 0 auto;
            background: #fff;
            overflow: hidden;
          }
          @media screen {
            body {
              background: #e4e4e7;
              padding: 24px 16px;
              min-height: 100vh;
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
              width: 76mm;
              min-height: 76mm;
              background: #fff;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
              border-radius: 4px;
              padding: 3mm;
            }
          }
          @media print {
            .preview-banner, button {
              display: none !important;
            }
            body {
              background: #fff !important;
              padding: 0 !important;
            }
            .slip-wrap {
              box-shadow: none !important;
              border-radius: 0 !important;
              padding: 0 !important;
              max-width: 100% !important;
              width: 100% !important;
            }
          }
        `}</style>
      </head>
      <body>
        <div className="preview-banner">
          🏷️ 3" × 3" Thermal Label Preview
        </div>
        <div className="slip-wrap">
          <PackingSlipContent order={order as any} storeName={storeName} supportPhone={supportPhone} />
        </div>
        <PrintButton />
      </body>
    </html>
  )
}
