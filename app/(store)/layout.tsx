export const dynamic = 'force-dynamic'

import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";
import BottomNav from "@/components/store/BottomNav";
import { CompareBar } from "@/components/store/CompareBar";
import WishlistSync from "@/components/store/WishlistSync";
import AbandonedCartTracker from "@/components/store/AbandonedCartTracker";
import MetaPixelTracker from "@/components/MetaPixelTracker";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { getActiveFlashSaleBatch, applyFlashSaleDiscount } from "@/lib/flashSale";

const SETTING_KEYS = [
  "free_shipping_above",
  "store_name",
  "store_tagline",
  "store_description",
  "support_email",
  "support_phone",
  "social_facebook",
  "social_instagram",
  "social_tiktok",
  "meta_pixel_id",
]

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const now = new Date()
  const [settings, categories, sitewideSale] = await Promise.all([
    prisma.setting.findMany({ where: { key: { in: SETTING_KEYS } } }),
    prisma.category.findMany({
      where: { isActive: true, showOnNavbar: true, parentId: null },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true, name: true, slug: true,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: { id: true, name: true, slug: true }
        }
      },
    }),
    prisma.flashSale.findFirst({
      where: { scope: "SITEWIDE", isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]))
  const freeShippingThreshold = settingsMap.free_shipping_above ? parseInt(settingsMap.free_shipping_above, 10) : null
  const metaPixelId = settingsMap.meta_pixel_id ?? process.env.NEXT_PUBLIC_META_PIXEL_ID ?? ""

  const branding = {
    storeName: settingsMap.store_name || "Berber",
    storeTagline: settingsMap.store_tagline || "Wear Your Story",
    storeDescription:
      settingsMap.store_description ||
      "Modern Bangladeshi clothing for the bold and elegant. We blend minimal aesthetics with premium quality.",
    supportEmail: settingsMap.support_email || "support@berber.clothing",
    supportPhone: settingsMap.support_phone || "+880 1700 000000",
    socialFacebook: settingsMap.social_facebook || "",
    socialInstagram: settingsMap.social_instagram || "",
    socialTiktok: settingsMap.social_tiktok || "",
  }

  return (
    <div className="min-h-screen flex flex-col bg-berber-bg text-berber-text">
      {metaPixelId && (
        <>
          {/* Meta Pixel base code */}
          <script
            dangerouslySetInnerHTML={{
              __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`,
            }}
          />
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
          <Suspense fallback={null}>
            <MetaPixelTracker />
          </Suspense>
        </>
      )}
      <Navbar
        freeShippingThreshold={freeShippingThreshold}
        storeName={branding.storeName}
        storeTagline={branding.storeTagline}
        categories={categories}
        activeFlashSale={sitewideSale ? {
          name: sitewideSale.name,
          discountType: sitewideSale.discountType,
          discountValue: Number(sitewideSale.discountValue),
          endsAt: sitewideSale.endsAt.toISOString(),
        } : null}
      />
      <WishlistSync />
      <AbandonedCartTracker />
      <main className="flex-1 pb-16 md:pb-0">
        {children}
      </main>
      <Footer branding={branding} categories={categories} />
      <CompareBar />
      <BottomNav />
    </div>
  );
}
