import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const title = searchParams.get("title") || "Berber"
  const price = searchParams.get("price")
  const image = searchParams.get("image")
  const storeName = searchParams.get("store") || "Berber"

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "1200px",
          height: "630px",
          background: "#0f0e0c",
          position: "relative",
          fontFamily: "serif",
        }}
      >
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.35 }}
          />
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "60px",
            position: "relative",
            width: "100%",
          }}
        >
          <div style={{ fontSize: 18, color: "#c9a84c", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 16 }}>
            {storeName}
          </div>
          <div style={{ fontSize: title.length > 40 ? 40 : 56, color: "#fff", fontWeight: 700, lineHeight: 1.1, marginBottom: 24 }}>
            {title}
          </div>
          {price && (
            <div style={{ fontSize: 32, color: "#c9a84c", fontWeight: 700 }}>
              ৳{price}
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
