// Shared slip content optimized for 3" x 3" (76mm x 76mm) thermal label printers.
// Includes Steadfast / courier consignment details and tracking information.

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
  delivery?: {
    courier?: string | null
    trackingCode?: string | null
    consignmentId?: string | null
    status?: string | null
  } | null
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
  const courierName = order.delivery?.courier?.toUpperCase() || "STEADFAST"
  const trackingCode = order.delivery?.trackingCode
  const consignmentId = order.delivery?.consignmentId

  return (
    <div
      className="slip-thermal-content"
      style={{
        color: "#000",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: "8.5px",
        lineHeight: 1.15,
        padding: "1mm 1.5mm",
        margin: "0 auto",
        width: "100%",
        maxWidth: "66mm",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div style={{ borderBottom: "1.5px solid #000", paddingBottom: "2px", marginBottom: "2.5px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: "11px", fontWeight: 900, letterSpacing: "0.5px", textTransform: "uppercase" }}>{storeName}</span>
          <span style={{ fontSize: "7.5px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>PACKING SLIP</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1px" }}>
          <span style={{ fontSize: "9.5px", fontWeight: 800 }}>#{order.orderNumber}</span>
          <span style={{ fontSize: "7.5px", color: "#111" }}>{formattedDate}</span>
        </div>
      </div>

      {/* Steadfast / Courier Tracking Bar */}
      <div
        style={{
          border: "1px solid #000",
          padding: "1.5px 3px",
          marginBottom: "2.5px",
          background: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "7.5px",
        }}
      >
        <div>
          <span style={{ fontWeight: 900, textTransform: "uppercase" }}>🚚 {courierName}</span>
          {trackingCode && (
            <span style={{ fontWeight: 800, marginLeft: "3px" }}>· TRK: {trackingCode}</span>
          )}
        </div>
        <div>
          {consignmentId ? (
            <span style={{ fontWeight: 700 }}>CID: #{consignmentId}</span>
          ) : (
            <span style={{ color: "#444" }}>INV: #{order.orderNumber}</span>
          )}
        </div>
      </div>

      {/* Recipient / Shipping Address */}
      <div style={{ borderBottom: "1px dashed #000", paddingBottom: "2px", marginBottom: "2.5px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: "9px", fontWeight: 800 }}>{order.shippingName}</span>
          <span style={{ fontSize: "8.5px", fontWeight: 800 }}>{order.shippingPhone}</span>
        </div>
        <div style={{ fontSize: "8px", marginTop: "1px", wordBreak: "break-word", lineHeight: 1.15 }}>
          {order.shippingAddress}
        </div>
        {locationParts && (
          <div style={{ fontSize: "7.5px", fontWeight: 600, color: "#111", marginTop: "1px" }}>
            📍 {locationParts}
          </div>
        )}
      </div>

      {/* Items List */}
      <div style={{ borderBottom: "1px dashed #000", paddingBottom: "2px", marginBottom: "2.5px" }}>
        <div style={{ fontSize: "7px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "1px" }}>
          ITEMS ({order.items.reduce((acc, item) => acc + (item.quantity || 1), 0)} PCS)
        </div>
        {order.items.map((item) => {
          const variant = [item.size, item.color].filter(Boolean).join(" / ")
          return (
            <div key={item.id} style={{ display: "flex", alignItems: "center", padding: "1px 0", borderBottom: "1px dotted #e5e5e5" }}>
              <div style={{ width: "8px", height: "8px", border: "1.2px solid #000", marginRight: "4px", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0, paddingRight: "6px" }}>
                <span style={{ fontWeight: 700, fontSize: "8.5px", wordBreak: "break-word" }}>
                  {item.productName}
                </span>
                {variant && (
                  <span style={{ fontSize: "7.5px", color: "#333", marginLeft: "3px" }}>({variant})</span>
                )}
              </div>
              <div style={{ fontWeight: 900, fontSize: "9px", flexShrink: 0, paddingRight: "2px" }}>
                ×{item.quantity}
              </div>
            </div>
          )
        })}
      </div>

      {/* Payment / Collection Box */}
      <div style={{ border: "1.2px solid #000", padding: "2px 4px", marginBottom: "2px", background: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "7px", textTransform: "uppercase", fontWeight: 700 }}>Payment Method</div>
            <div style={{ fontSize: "8px", fontWeight: 800 }}>{order.paymentMethod || "COD"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "7px", textTransform: "uppercase", fontWeight: 700 }}>
              {isPaid ? "Paid Total" : "Collect COD"}
            </div>
            <div style={{ fontSize: "10.5px", fontWeight: 900 }}>
              ৳{Number(order.total).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Notes or Gift Message */}
      {(order.note || order.giftWrap) && (
        <div style={{ fontSize: "7px", border: "1px dotted #000", padding: "1px 3px", marginBottom: "2px", lineHeight: 1.15 }}>
          {order.giftWrap && <div style={{ fontWeight: 800 }}>🎁 Gift Wrapped{order.giftMessage ? `: "${order.giftMessage}"` : ""}</div>}
          {order.note && <div><strong>Note:</strong> {order.note}</div>}
        </div>
      )}

      {/* Footer Support Info */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "6.5px", color: "#333", marginTop: "1px", borderTop: "0.5px solid #e0e0e0", paddingTop: "1px" }}>
        <span>Thank you for shopping with us!</span>
        {supportPhone && <span>Support: {supportPhone}</span>}
      </div>
    </div>
  )
}
