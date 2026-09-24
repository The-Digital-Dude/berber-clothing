import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Analytics from "@/components/Analytics";
import prisma from "@/lib/prisma";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-heading" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-mono" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://berber.clothing"

export const viewport: Viewport = {
  themeColor: "#C9A84C",
  width: "device-width",
  initialScale: 1,
}

export async function generateMetadata(): Promise<Metadata> {
  let siteTitle = "Berber Clothing | Modern Formalwear"
  let siteDescription = "Modern formalwear in Bangladesh. Shop premium 2-piece suits, 3-piece suits, and blazers. Free delivery above ৳5000."
  let storeName = "Berber Clothing"

  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: ["meta_title", "meta_description", "store_name"] } },
    })
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))
    if (map["meta_title"]) siteTitle = map["meta_title"]
    if (map["meta_description"]) siteDescription = map["meta_description"]
    if (map["store_name"]) storeName = map["store_name"]
  } catch { /* DB unavailable — use defaults */ }

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: siteTitle,
      template: `%s | ${storeName}`,
    },
    description: siteDescription,
    keywords: ["Bangladesh formalwear", "suits Bangladesh", "menswear BD", `${storeName} fashion`, "2-piece suit", "3-piece suit", "blazer", "mens clothing Bangladesh"],
    authors: [{ name: storeName }],
    creator: storeName,
    openGraph: {
      type: "website",
      locale: "en_BD",
      url: SITE_URL,
      siteName: storeName,
      title: siteTitle,
      description: siteDescription,
      images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: `${storeName} Fashion` }],
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDescription,
      images: ["/og-image.jpg"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
    },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let storeName = "Berber Clothing"
  let supportEmail = "support@berber.clothing"
  let supportPhone = ""
  let sameAs: string[] = []

  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: ["store_name", "support_email", "support_phone", "social_facebook", "social_instagram", "social_tiktok"] } },
    })
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))
    if (map.store_name) storeName = map.store_name
    if (map.support_email) supportEmail = map.support_email
    if (map.support_phone) supportPhone = map.support_phone
    sameAs = [map.social_facebook, map.social_instagram, map.social_tiktok].filter(Boolean)
  } catch { /* DB unavailable — use defaults */ }

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: storeName,
    url: SITE_URL,
    logo: `${SITE_URL}/logo-icon.png`,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: supportEmail,
      ...(supportPhone && { telephone: supportPhone }),
      availableLanguage: ["English", "Bengali"],
    },
    sameAs,
  }

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: storeName,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/shop?search={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  }

  return (
    <html lang="en" className={cn("font-sans", inter.variable, playfair.variable, spaceGrotesk.variable)}>
      <body className="antialiased text-berber-text bg-berber-bg selection:bg-berber-gold/30">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <NextTopLoader color="#C9A24B" showSpinner={false} />
        <VercelAnalytics />
        <SpeedInsights />
        <Analytics />
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
