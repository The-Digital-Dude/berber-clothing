import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.berber.clothing"
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/print/",
          "/api/",
          "/checkout",
          "/checkout/",
          "/account",
          "/account/",
          "/order/",
          "/*?*search=*",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin/", "/print/", "/api/", "/checkout/", "/account/", "/order/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
