// Shared slip content, used by both the single-order packing slip page
// and the bulk (multi-order, A4) packing slip page — keeps the two
// visually identical without duplicating the markup.

type SlipOrder = {
  orderNumber: string
  createdAt: string | Date
  shippingName: string
  shippingPhone: string
  shippingAddress: string
  shippingArea: string
  shippingDistrict: string
  shippingDivision: string
  paymentMethod: string
  paymentStatus: string
  total: number | string
  note: string | null
  giftWrap: boolean
  giftMessage: string | null
  items: { id: string; productName: string; size: string; color: string; quantity: number }[]
}

export function PackingSlipContent({
  order,
  storeName,
  supportPhone,
}: {
  order: SlipOrder
  storeName: string
  supportPhone: string
}) {
  return (
    <div className="slip">
      <div style={{ borderBottom: "2px solid #000", paddingBottom: 10, marginBottom: 10 }}>
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
        {order.items.map((item) => (
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
    </div>
  )
}
