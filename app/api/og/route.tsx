import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const title = searchParams.get("title") || "Berber Clothing | Modern Formalwear"
  const price = searchParams.get("price")
  const image = searchParams.get("image")
  const category = searchParams.get("category") || "Modern Formalwear"
  const storeName = searchParams.get("store") || "Berber Clothing"

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "1200px",
          height: "630px",
          backgroundColor: "#0d0c0a",
          backgroundImage: "radial-gradient(circle at 10% 20%, rgba(201, 168, 76, 0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(201, 168, 76, 0.1) 0%, transparent 40%)",
          position: "relative",
          padding: "50px",
          boxSizing: "border-box",
          fontFamily: "sans-serif",
          color: "#ffffff",
          alignItems: "center",
          justifyContent: "space-between",
          border: "4px solid #c9a84c",
        }}
      >
        {/* Left Content Side */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            maxWidth: image ? "640px" : "100%",
            zIndex: 10,
          }}
        >
          {/* Top Brand Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                backgroundColor: "#c9a84c",
                color: "#0d0c0a",
                fontWeight: 900,
                fontSize: "14px",
                letterSpacing: "3px",
                textTransform: "uppercase",
                padding: "6px 16px",
                borderRadius: "999px",
              }}
            >
              {storeName}
            </div>
            <div
              style={{
                color: "#c9a84c",
                fontSize: "14px",
                letterSpacing: "2px",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              • {category}
            </div>
          </div>

          {/* Title & Price */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", margin: "auto 0" }}>
            <div
              style={{
                fontSize: title.length > 35 ? "44px" : "56px",
                fontWeight: 800,
                lineHeight: 1.15,
                color: "#ffffff",
                letterSpacing: "-0.5px",
                textShadow: "0 2px 10px rgba(0,0,0,0.5)",
              }}
            >
              {title}
            </div>

            {price && (
              <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                <div
                  style={{
                    fontSize: "42px",
                    fontWeight: 900,
                    color: "#f5c358",
                    letterSpacing: "0.5px",
                  }}
                >
                  ৳{price}
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    color: "#a1a1aa",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  BDT • Inclusive of VAT
                </div>
              </div>
            )}
          </div>

          {/* Bottom Value Badges */}
          <div style={{ display: "flex", gap: "16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(201, 168, 76, 0.4)",
                padding: "8px 18px",
                borderRadius: "10px",
                fontSize: "14px",
                color: "#f4f4f5",
                fontWeight: 600,
              }}
            >
              ✓ Cash on Delivery Across BD
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(201, 168, 76, 0.4)",
                padding: "8px 18px",
                borderRadius: "10px",
                fontSize: "14px",
                color: "#f4f4f5",
                fontWeight: 600,
              }}
            >
              ⚡ Fast Home Delivery
            </div>
          </div>
        </div>

        {/* Right Product Image Side */}
        {image && (
          <div
            style={{
              display: "flex",
              width: "440px",
              height: "510px",
              borderRadius: "20px",
              overflow: "hidden",
              border: "2px solid rgba(201, 168, 76, 0.5)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.8)",
              position: "relative",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
