import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import PrintButton from "./PrintButton"

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
          .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
          .store-name { font-size: 22px; font-weight: bold; letter-spacing: 4px; }
          .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #666; }
          .value { font-size: 13px; font-weight: bold; }
          .section { margin-bottom: 12px; border-bottom: 1px dashed #ccc; padding-bottom: 10px; }
          .item-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #eee; }
          .check-box { width: 14px; height: 14px; border: 2px solid #000; display: inline-block; margin-right: 8px; flex-shrink: 0; }
          .badge { display: inline-block; padding: 2px 8px; border: 1px solid #000; font-size: 10px; font-weight: bold; letter-spacing: 1px; }
          @media print { button { display: none; } }
        `}</style>
      </head>
      <body>
        <div className="header" style={{ borderBottom: "2px solid #000", paddingBottom: 10, marginBottom: 10 }}>
          <div style={{ fontSize: 22, fontWeight: "bold", letterSpacing: 4 }}>{storeName}</div>
          <div style={{ fontSize: 10, color: "#666" }}>PACKING SLIP{supportPhone ? ` · ${supportPhone}` : ""}</div>
          <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 16, fontWeight: "bold" }}>{order.orderNumber}</span>
            <span style={{ fontSize: 10, color: "#666" }}>{new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div style={{ marginBottom: 12, borderBottom: "1px dashed #ccc", paddingBottom: 10 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#666", marginBottom: 4 }}>Ship To</div>
          <div style={{ fontSize: 13, fontWeight: "bold" }}>{order.shippingName}</div>
          <div>{order.shippingPhone}</div>
          <div>{order.shippingAddress}</div>
          <div>{order.shippingArea}, {order.shippingDistrict}, {order.shippingDivision}</div>
        </div>

        <div style={{ marginBottom: 12, borderBottom: "1px dashed #ccc", paddingBottom: 10 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#666", marginBottom: 6 }}>Items to Pack</div>
          {order.items.map((item, i) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #eee" }}>
              <div style={{ width: 14, height: 14, border: "2px solid #000", display: "inline-block", marginRight: 8, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", fontSize: 12 }}>{item.productName}</div>
                <div style={{ fontSize: 10, color: "#666" }}>{item.size} / {item.color}</div>
              </div>
              <div style={{ fontWeight: "bold", fontSize: 14, marginLeft: 8 }}>×{item.quantity}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 10, textTransform: "uppercase", color: "#666" }}>Payment</div>
            <div style={{ fontWeight: "bold" }}>{order.paymentMethod} — {order.paymentStatus}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", color: "#666" }}>Total</div>
            <div style={{ fontWeight: "bold", fontSize: 16 }}>৳{Number(order.total).toLocaleString()}</div>
          </div>
        </div>

        {order.note && (
          <div style={{ padding: 8, border: "1px solid #000", marginBottom: 12, fontSize: 11 }}>
            <span style={{ fontWeight: "bold" }}>Note: </span>{order.note}
          </div>
        )}
        {order.giftWrap && (
          <div style={{ padding: 8, border: "2px solid #000", marginBottom: 12, fontSize: 11, textAlign: "center", fontWeight: "bold" }}>
            🎁 GIFT WRAPPED{order.giftMessage ? ` — "${order.giftMessage}"` : ""}
          </div>
        )}

        <div style={{ textAlign: "center", fontSize: 10, color: "#999", marginTop: 16 }}>
          Thank you for your order!
        </div>

        <PrintButton />
      </body>
    </html>
  )
}
