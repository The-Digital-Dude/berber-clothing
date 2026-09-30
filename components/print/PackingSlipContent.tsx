// Shared slip content optimized for 3" x 3" (76mm x 76mm) thermal label printers.
// High contrast (pure black/white), compact density, and clear section dividers.

type SlipOrder = {
  orderNumber: string
  createdAt: string | Date
  shippingName: string
  shippingPhone: string
  shippingAddress: string
  shippingArea?: string | null
  shippingDistrict?: string | null
  shippingDivision?: string | null
  paymentMethod: string
  paymentStatus: string
  total: number | string
  note?: string | null
  giftWrap?: boolean
  giftMessage?: string | null
  items: { id: string; productName: string; size?: string | null; color?: string | null; quantity: number }[]
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
  const isPaid = order.paymentStatus?.toUpperCase() === "PAID"
  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

  const locationParts = [order.shippingArea, order.shippingDistrict, order.shippingDivision].filter(Boolean).join(", ")

  return (
    <div className="slip-thermal-content" style={{ color: "#000", fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "10px", lineHeight: 1.25 }}>
      {/* Header */}
      <div style={{ borderBottom: "1.5px solid #000", paddingBottom: "3px", marginBottom: "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: "13px", fontWeight: 900, letterSpacing: "1px", textTransform: "uppercase" }}>{storeName}</span>
          <span style={{ fontSize: "8.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>PACKING SLIP</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px" }}>
          <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.5px" }}>#{order.orderNumber}</span>
          <span style={{ fontSize: "8.5px", color: "#222" }}>{formattedDate}</span>
        </div>
      </div>

      {/* Recipient / Shipping Address */}
      <div style={{ borderBottom: "1px dashed #000", paddingBottom: "4px", marginBottom: "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: "10.5px", fontWeight: 800 }}>{order.shippingName}</span>
          <span style={{ fontSize: "10px", fontWeight: 800 }}>{order.shippingPhone}</span>
        </div>
        <div style={{ fontSize: "9px", marginTop: "1px", wordBreak: "break-word" }}>
          {order.shippingAddress}
        </div>
        {locationParts && (
          <div style={{ fontSize: "8.5px", fontWeight: 600, color: "#111", marginTop: "1px" }}>
            📍 {locationParts}
          </div>
        )}
      </div>

      {/* Items List */}
      <div style={{ borderBottom: "1px dashed #000", paddingBottom: "3px", marginBottom: "4px" }}>
        <div style={{ fontSize: "8px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>
          ITEMS ({order.items.reduce((acc, item) => acc + (item.quantity || 1), 0)} PCS)
        </div>
        {order.items.map((item) => {
          const variant = [item.size, item.color].filter(Boolean).join(" / ")
          return (
            <div key={item.id} style={{ display: "flex", alignItems: "flex-start", padding: "2px 0", borderBottom: "1px dotted #ccc" }}>
              <div style={{ width: "10px", height: "10px", border: "1.2px solid #000", marginRight: "5px", marginTop: "1px", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0, paddingRight: "4px" }}>
                <div style={{ fontWeight: 700, fontSize: "9.5px", wordBreak: "break-word", lineHeight: 1.15 }}>
                  {item.productName}
                </div>
                {variant && (
                  <div style={{ fontSize: "8px", color: "#333" }}>{variant}</div>
                )}
              </div>
              <div style={{ fontWeight: 900, fontSize: "10.5px", flexShrink: 0 }}>
                ×{item.quantity}
              </div>
            </div>
          )
        })}
      </div>

      {/* Payment / Collection Box */}
      <div style={{ border: "1.5px solid #000", padding: "3px 5px", marginBottom: "4px", background: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "8px", textTransform: "uppercase", fontWeight: 700 }}>Payment Method</div>
            <div style={{ fontSize: "9.5px", fontWeight: 800 }}>{order.paymentMethod || "COD"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "8px", textTransform: "uppercase", fontWeight: 700 }}>
              {isPaid ? "Paid Total" : "Collect COD"}
            </div>
            <div style={{ fontSize: "12px", fontWeight: 900 }}>
              ৳{Number(order.total).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Notes or Gift Message */}
      {(order.note || order.giftWrap) && (
        <div style={{ fontSize: "8px", border: "1px dotted #000", padding: "2px 4px", marginBottom: "3px" }}>
          {order.giftWrap && <div style={{ fontWeight: 800 }}>🎁 Gift Wrapped{order.giftMessage ? `: "${order.giftMessage}"` : ""}</div>}
          {order.note && <div><strong>Note:</strong> {order.note}</div>}
        </div>
      )}

      {/* Footer Support Info */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "7.5px", color: "#444", marginTop: "2px", borderTop: "0.5px solid #eee", paddingTop: "2px" }}>
        <span>Thank you for shopping with us!</span>
        {supportPhone && <span>Support: {supportPhone}</span>}
      </div>
    </div>
  )
}
