import Script from "next/script"
import prisma from "@/lib/prisma"

async function getTrackingSettings() {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: ["ga4_id", "meta_pixel_id", "clarity_id"] } },
    })
    return Object.fromEntries(settings.map((s) => [s.key, s.value]))
  } catch {
    return {}
  }
}

export default async function Analytics() {
  const s = await getTrackingSettings()

  // Fall back to env vars if DB has no value set yet
  const GA4_ID = s["ga4_id"] || process.env.NEXT_PUBLIC_GA4_ID || ""
  const CLARITY_ID = s["clarity_id"] || process.env.NEXT_PUBLIC_CLARITY_ID || ""
  // Meta Pixel is initialized once in app/(store)/layout.tsx (which also
  // handles SPA route-change PageView re-fires and _fbc capture) — do not
  // duplicate it here, or every event gets double-counted on Meta's side.

  return (
    <>
      {GA4_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA4_ID}', { page_path: window.location.pathname });
          `}</Script>
        </>
      )}

      {CLARITY_ID && (
        <Script id="clarity" strategy="afterInteractive">{`
          (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${CLARITY_ID}");
        `}</Script>
      )}
    </>
  )
}
