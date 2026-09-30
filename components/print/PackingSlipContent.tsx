import { generateCode128Svg } from "@/lib/barcode"

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
  qrDataUrl,
}: {
  order: SlipOrder
  storeName: string
  supportPhone: string
  qrDataUrl?: string
}) {
  const isPaid = order.paymentStatus?.toUpperCase() === "PAID"
  const sfId = order.delivery?.consignmentId || order.delivery?.trackingCode || order.orderNumber
  const trackingCode = order.delivery?.trackingCode || sfId
  const barcodeSvg = generateCode128Svg(String(sfId), 26)

  // Format SF-ID with spaces like the official Steadfast label (e.g. 3 0 2 0 8 8 1 9 0)
  const spacedSfId = String(sfId).split("").join(" ")

  const printedAt = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }) + " " + new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })

  const locationParts = [order.shippingArea, order.shippingDistrict].filter(Boolean).join(", ")

  return (
    <div
      className="slip-thermal-content"
      style={{
        color: "#000",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: "8px",
        lineHeight: 1.15,
        padding: "1mm 1.5mm",
        margin: "0 auto",
        width: "100%",
        maxWidth: "66mm",
        boxSizing: "border-box",
        background: "#fff",
      }}
    >
      {/* 1. Steadfast Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "2px", borderBottom: "1.5px solid #000" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {/* Steadfast Swirl / Brand Logo */}
          <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: "9px" }}>
            B
          </div>
          <div>
            <div style={{ fontSize: "10.5px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3px", lineHeight: 1 }}>{storeName}</div>
            {supportPhone && <div style={{ fontSize: "6.5px", color: "#333", marginTop: "1px" }}>Support: {supportPhone}</div>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "7px", fontWeight: 800, color: "#000" }}>Merchant ID: K8U7MIIN</div>
          <div style={{ fontSize: "6.5px", fontWeight: 700, color: "#444" }}>Courier: <strong>STEADFAST</strong></div>
          {order.delivery?.trackingCode && (
            <div style={{ fontSize: "6.5px", color: "#222" }}>TRK: {order.delivery.trackingCode}</div>
          )}
        </div>
      </div>

      {/* 2. Barcode Section */}
      <div style={{ padding: "2px 0 1px", textAlign: "center", borderBottom: "1px dashed #000" }}>
        <div style={{ width: "96%", margin: "0 auto", height: "24px" }} dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
        <div style={{ fontSize: "8.5px", fontWeight: 800, letterSpacing: "2.5px", marginTop: "1px" }}>
          {spacedSfId}
        </div>
      </div>

      {/* 3. QR Code & Metadata Grid (Official Steadfast Layout) */}
      <div style={{ display: "flex", alignItems: "stretch", borderBottom: "1px dashed #000", padding: "2px 0" }}>
        {/* QR Code */}
        <div style={{ width: "24mm", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", paddingRight: "4px" }}>
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="Steadfast QR" style={{ width: "22mm", height: "22mm", display: "block" }} />
          ) : (
            <div style={{ width: "20mm", height: "20mm", border: "1px solid #000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "7px" }}>QR</div>
          )}
        </div>
        {/* Info Grid */}
        <div style={{ flex: 1, fontSize: "7.5px", borderLeft: "1px solid #ddd", paddingLeft: "4px", display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 800, color: "#444" }}>INVOICE</span>
            <span style={{ fontWeight: 800 }}>#{order.orderNumber}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 800, color: "#444" }}>SF-ID</span>
            <span style={{ fontWeight: 800 }}>{sfId}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 800, color: "#444" }}>DELIVERY</span>
            <span style={{ fontWeight: 800 }}>Home</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 800, color: "#444" }}>WEIGHT</span>
            <span style={{ fontWeight: 800 }}>0.5 KG</span>
          </div>
        </div>
      </div>

      {/* 4. Customer Info Section */}
      <div style={{ borderBottom: "1px dashed #000", padding: "2px 0" }}>
        <div style={{ display: "flex", marginBottom: "1px" }}>
          <span style={{ width: "14mm", fontWeight: 800, color: "#444", flexShrink: 0 }}>NAME</span>
          <span style={{ fontWeight: 800, fontSize: "8.5px" }}>{order.shippingName}</span>
        </div>
        <div style={{ display: "flex", marginBottom: "1px" }}>
          <span style={{ width: "14mm", fontWeight: 800, color: "#444", flexShrink: 0 }}>PHONE</span>
          <span style={{ fontWeight: 800, fontSize: "8.5px" }}>{order.shippingPhone}</span>
        </div>
        <div style={{ display: "flex", marginBottom: "1px" }}>
          <span style={{ width: "14mm", fontWeight: 800, color: "#444", flexShrink: 0 }}>ADDRESS</span>
          <span style={{ flex: 1, fontSize: "7.5px", wordBreak: "break-word" }}>{order.shippingAddress}</span>
        </div>
        {locationParts && (
          <div style={{ display: "flex" }}>
            <span style={{ width: "14mm", fontWeight: 800, color: "#444", flexShrink: 0 }}>AREA</span>
            <span style={{ flex: 1, fontWeight: 700, fontSize: "7.5px" }}>{locationParts}</span>
          </div>
        )}
      </div>

      {/* 5. Items to Pack (Packing Checklist) */}
      <div style={{ borderBottom: "1px dashed #000", padding: "2px 0" }}>
        <div style={{ fontSize: "6.5px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: "1px" }}>
          ITEMS TO PACK ({order.items.reduce((acc, item) => acc + (item.quantity || 1), 0)} PCS)
        </div>
        {order.items.map((item) => {
          const variant = [item.size, item.color].filter(Boolean).join(" / ")
          return (
            <div key={item.id} style={{ display: "flex", alignItems: "center", padding: "0.5px 0" }}>
              <div style={{ width: "7px", height: "7px", border: "1px solid #000", marginRight: "3px", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0, paddingRight: "4px" }}>
                <span style={{ fontWeight: 700, fontSize: "7.5px" }}>{item.productName}</span>
                {variant && <span style={{ fontSize: "6.5px", color: "#444", marginLeft: "2px" }}>({variant})</span>}
              </div>
              <div style={{ fontWeight: 800, fontSize: "8px", flexShrink: 0 }}>×{item.quantity}</div>
            </div>
          )
        })}
      </div>

      {/* 6. Cash on Delivery Box (Official Steadfast Style) */}
      <div style={{ border: "1.5px solid #000", padding: "2px 4px", margin: "2px 0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff" }}>
        <div style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {isPaid ? "PAID ONLINE" : "CASH ON DELIVERY"}
        </div>
        <div style={{ fontSize: "11px", fontWeight: 900 }}>
          ৳ {Number(order.total).toLocaleString()}
        </div>
      </div>

      {/* 7. Footer (Steadfast Branding & Print Date) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "6px", color: "#333", paddingTop: "1px" }}>
        <span>Printed: {printedAt}</span>
        <span style={{ fontWeight: 700 }}>
          ⚡ <strong>steadfast</strong> steadfast.com.bd
        </span>
      </div>
    </div>
  )
}
