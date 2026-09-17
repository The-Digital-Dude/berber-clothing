# Feature Gap Analysis: berber-clothing vs axionwear

> **Context:** axionwear is the more mature upstream codebase. berber-clothing is derived from it with brand-specific customisations. This document catalogues every feature, page, component, API route, schema model, and integration that axionwear has but berber-clothing is missing or has only partially implemented. Use it as a build roadmap.

---

## Table of Contents

1. [Store / Frontend Pages](#1-store--frontend-pages)
2. [Admin Panel Pages](#2-admin-panel-pages)
3. [Database Schema Gaps](#3-database-schema-gaps)
4. [Missing Components](#4-missing-components)
5. [Missing API Routes](#5-missing-api-routes)
6. [Third-Party Integrations](#6-third-party-integrations)
7. [Feature-Level Summary Table](#7-feature-level-summary-table)
8. [Prioritised Roadmap](#8-prioritised-roadmap)

---

## 1. Store / Frontend Pages

### 1.1 Completely Missing Pages

| Page | axionwear path | Notes |
|---|---|---|
| About | `app/(store)/about/page.tsx` | Brand story page |
| Category slug route | `app/(store)/category/[slug]/page.tsx` | Dedicated per-category landing; berber only has `/shop?category=` filter |
| Collections | `app/(store)/collections/[slug]/page.tsx` | Curated collection landing pages |
| Product Drops list | `app/(store)/drops/page.tsx` | Scheduled product releases |
| Product Drop detail | `app/(store)/drops/[slug]/page.tsx` | Individual drop page with countdown |
| Episodes list | `app/(store)/episode/page.tsx` | Editorial collection pages (berber replaced with basic Lookbook) |
| Episode detail | `app/(store)/episode/[slug]/page.tsx` | Single editorial episode |
| Gift Cards (store) | `app/(store)/gift-cards/page.tsx` | Customer-facing gift card purchase page (admin side exists, store side absent) |
| Draft Order confirm | `app/(store)/order/draft/[id]/page.tsx` | Lets customers view/confirm a draft order placed by admin |
| Warranty | `app/(store)/warranty/page.tsx` | Static warranty information page |
| Unsubscribed | `app/(store)/unsubscribed/page.tsx` | Landing page after email unsubscribe |
| Blog tag filter | `app/(store)/blog/tag/[tag]/page.tsx` | Browse blog posts by tag |
| Account Wishlist tab | `app/(store)/account/wishlist/page.tsx` | Wishlist inside the account dashboard (berber has `/wishlist` separately) |

### 1.2 Pages in berber NOT in axionwear (berber advantages)
- `app/(store)/lookbook/page.tsx` — berber-specific editorial page (replaces Episodes, but without DB backing)

---

## 2. Admin Panel Pages

### 2.1 Completely Missing Admin Sections

| Section | axionwear path(s) | Notes |
|---|---|---|
| Analytics — Funnel | `admin/analytics/funnel/page.tsx` | Conversion funnel visualisation |
| Analytics — Search | `admin/analytics/search/page.tsx` | What customers search for |
| Email Campaigns | `admin/campaigns/page.tsx` + `new/` + `[id]/` | Full email broadcast system |
| Contact Inbox | `admin/contact/page.tsx` + `ContactInbox.tsx` | Read/reply to contact form submissions |
| Customer CSV Import | `admin/customers/import/page.tsx` | Bulk import customers from CSV |
| Drops Management | `admin/drops/page.tsx` + `DropsClient.tsx` | Manage scheduled product releases |
| Episodes (Editorial) | `admin/episodes/` (list, new, edit) + `EpisodeForm.tsx` | Manage editorial collection episodes |
| Product Duplicate | `admin/products/DuplicateButton.tsx` | One-click product duplication |
| Bundle new/edit forms | `admin/bundles/new/page.tsx` + `[id]/page.tsx` + `BundleForm.tsx` | berber only has a list; no create/edit pages |
| Q&A Moderation | `admin/qa/page.tsx` | Approve/reject product Q&A |
| Smart Collections | `admin/smart-collections/` (list, new, edit) | Tag-rule based auto-collections |
| Reviews Admin | `admin/reviews/page.tsx` + `ReviewsClient.tsx` | Moderate customer reviews |

### 2.2 Partially Present in berber

| Section | Gap |
|---|---|
| Dashboard Charts | berber has `RevenueChart.tsx`; axionwear has the broader `DashboardCharts.tsx` with more widgets |
| Bulk Packing Slip | berber has single-order packing slip; bulk API route is absent |

---

## 3. Database Schema Gaps

### 3.1 Entirely Missing Models

| Model | Purpose | Key Fields |
|---|---|---|
| `Episode` | Editorial "collection episode" pages with hero, story, artist note | `name`, `slug`, `number`, `tagline`, `story`, `heroImage`, `heroVideo`, `artistNote`, `isPublished` |
| `EpisodeProduct` | Junction linking Episodes to Products with editorial note | `episodeId`, `productId`, `editorialNote`, `sortOrder` |
| `FrequentlyBoughtTogether` | Admin-curated cross-sell product pairs | `productId`, `relatedId`, `sortOrder` |
| `ProductTag` | Structured product tagging (many-to-many) | `name`, `slug`, products relation |
| `SmartCollection` | Tag/rule based dynamic collections | `name`, `slug`, `rules` (JSON), `ruleMatch`, `sortBy` |
| `DropNotify` | Email sign-up for product drop notifications | `productId`, `email`, `createdAt` |
| `OrderMessage` | Bi-directional admin↔customer messaging per order | `orderId`, `fromAdmin`, `message`, `readAt` |
| `SearchAnalytic` | Tracks search queries and click-throughs | `query`, `resultsCount`, `clicked`, `clickedSlug`, `userId`, `sessionId` |
| `FunnelEvent` | Conversion funnel event log | `event`, `productId`, `orderId`, `userId`, `sessionId`, `value` |
| `EmailCampaign` | Admin broadcast email campaigns | `subject`, `bodyHtml`, `status`, `scheduledAt`, `recipientType`, `totalSent`, `totalOpened` |
| `SmsLog` | Audit log of SMS notifications sent | `phone`, `message`, `event`, `status`, `provider` |
| `RateLimit` | DB-backed rate limiting | `key`, `count`, `windowEnd` |
| `ContactMessage` | Contact form submissions | `name`, `email`, `subject`, `message`, `isRead`, `isReplied` |
| `ReferralLog` | Referral conversion tracking | `referrerId`, `refereeId`, `orderId`, `creditAmount`, `pointsAmount` |

### 3.2 Missing Fields on Existing Models

**`User` model — berber missing:**
- `isLocked` — admin can lock/ban accounts
- `referralCode` — unique shareable referral code
- `referredByCode` — tracks which referrer brought this user

**`Product` model — berber missing:**
- `metaTitle`, `metaDescription`, `ogImage` — SEO meta fields
- `releaseAt` — scheduled drop/release date
- `frequentlyBoughtTogether` relation
- `productTags` relation
- `episodes` relation
- `dropNotifies` relation

**`ProductVariant` model — berber missing:**
- `comparePrice` — variant-level compare/original price for sale display

**`Order` model — berber missing:**
- `codCallNote` — admin note from COD verification call
- `tags` — string array for order segmentation
- `messages` relation (to `OrderMessage`)

**`Payment` model:**
- berber uses `String?` for `gatewayResponse`; axionwear uses `Json?` (structured gateway data)

**`ReturnRequest` model:**
- berber uses `String?` for `photos`; axionwear uses `String[]` (native Postgres array)

**`AbandonedCart` model:**
- berber uses `String` for `items`; axionwear uses `Json` (queryable structured data)

---

## 4. Missing Components

### 4.1 Store Components

| Component | File | What it does |
|---|---|---|
| `AbandonedCartTracker` | `components/store/AbandonedCartTracker.tsx` | Captures email/phone client-side before order completes |
| `ContactForm` | `components/store/ContactForm.tsx` | Persisted contact form (saves to `ContactMessage`) |
| `DeliveryEstimate` | `components/store/DeliveryEstimate.tsx` | Shows estimated delivery date on PDP/cart |
| `DropCountdown` | `components/store/DropCountdown.tsx` | Countdown timer for upcoming product drops |
| `DropNotifyButton` | `components/store/DropNotifyButton.tsx` | "Notify me" button for upcoming drops |
| `EpisodeAddToCart` | `components/store/EpisodeAddToCart.tsx` | Add-to-cart from within an Episode page |
| `FrequentlyBoughtTogether` | `components/store/FrequentlyBoughtTogether.tsx` | "Customers also buy" widget on PDP |
| `NewsletterForm` | `components/store/NewsletterForm.tsx` | Standalone newsletter signup widget |
| `OrderMessages` | `components/store/OrderMessages.tsx` | Customer-side order message thread |
| `PageTransitionOverlay` | `components/store/PageTransitionOverlay.tsx` | Page transition animation overlay |
| `PostPurchaseUpsell` | `components/store/PostPurchaseUpsell.tsx` | Upsell/cross-sell modal on order confirmation |
| `RecentlyViewed` | `components/store/RecentlyViewed.tsx` | "Recently viewed" product carousel |
| `RecentlyViewedTracker` | `components/store/RecentlyViewedTracker.tsx` | Client-side tracker that records viewed products |
| `SearchTracker` | `components/store/SearchTracker.tsx` | Logs search queries to `SearchAnalytic` |
| `SizeQuiz` | `components/store/SizeQuiz.tsx` | Interactive size recommendation quiz |
| `ViewingCounter` | `components/store/ViewingCounter.tsx` | "X people are viewing this" social proof on PDP |

### 4.2 Tracking / Pixel Components

| Component | File | What it does |
|---|---|---|
| `MetaPixelTracker` | `components/MetaPixelTracker.tsx` | Facebook/Meta Pixel initialisation |
| `PixelPageView` | `components/store/PixelPageView.tsx` | Fires `PageView` pixel event |
| `PurchaseTracker` | `components/store/PurchaseTracker.tsx` | Fires `Purchase` pixel event on order success |
| `ViewContentTracker` | `components/store/ViewContentTracker.tsx` | Fires `ViewContent` pixel event on PDP |

### 4.3 Admin Components

| Component | File | What it does |
|---|---|---|
| `CampaignComposer` | `components/admin/CampaignComposer.tsx` | Rich email campaign editor |
| `DashboardCharts` | `components/admin/DashboardCharts.tsx` | Full admin dashboard chart suite |

---

## 5. Missing API Routes

### 5.1 Store-facing APIs

| Route | Notes |
|---|---|
| `POST /api/drops/[id]/notify` | Customer opts into drop notification |
| `GET /api/feed/products.xml` | Google Shopping / Facebook Catalog XML product feed |
| `GET /api/og` | Dynamic Open Graph image generation (`@vercel/og`) |
| `POST /api/store/funnel` | Log funnel events (view, add-to-cart, checkout) |
| `POST /api/store/newsletter` | Newsletter signup |
| `GET/POST /api/store/orders/[id]/messages` | Customer side of order messaging |
| `GET /api/store/referral` | Customer fetches their referral link/stats |
| `POST /api/store/referral` | Submit referral code at checkout |
| `GET /api/store/unsubscribe` | Email unsubscribe handler |

### 5.2 Account APIs

| Route | Notes |
|---|---|
| `GET /api/account/referral` | Customer views referral dashboard |
| `GET /api/account/returns` | Customer views return request history |

### 5.3 Admin APIs

| Route | Notes |
|---|---|
| `GET /api/admin/analytics/search` | Search analytics data |
| `GET/POST /api/admin/blog/categories` | Blog category management |
| `GET/POST /api/admin/campaigns` | List/create email campaigns |
| `GET/PUT/DELETE /api/admin/campaigns/[id]` | Edit/delete a campaign |
| `POST /api/admin/campaigns/[id]/send` | Send or schedule a campaign |
| `PATCH /api/admin/contact/[id]` | Mark contact message read/replied |
| `POST /api/admin/customers/import` | CSV customer import |
| `POST /api/admin/customers/lock` | Lock/unlock a customer account |
| `GET/POST /api/admin/episodes` | Episode list/create |
| `GET/PUT/DELETE /api/admin/episodes/[id]` | Episode edit/delete |
| `PATCH /api/admin/inventory/bulk` | Bulk stock adjustment |
| `POST /api/admin/orders/[id]/cod-note` | Save COD call verification note |
| `POST /api/admin/orders/[id]/draft-to-order` | Promote draft to live order |
| `GET/POST /api/admin/orders/[id]/items` | Edit line items on an existing order |
| `GET/POST /api/admin/orders/[id]/messages` | Admin side of order messaging |
| `POST /api/admin/orders/[id]/steadfast` | Push order to Steadfast courier |
| `PATCH /api/admin/orders/[id]/tags` | Add/remove order tags |
| `POST /api/admin/orders/packing-slip` | Generate bulk packing slip PDF |
| `POST /api/admin/products/[id]/duplicate` | Duplicate a product |
| `GET/POST /api/admin/products/[id]/fbt` | Manage Frequently Bought Together pairs |
| `GET/POST /api/admin/qa` | Q&A list/moderation |
| `PATCH/DELETE /api/admin/qa/[id]` | Approve/reject/delete a Q&A |
| `GET/POST /api/admin/reviews` | Reviews list/moderation |
| `PATCH/DELETE /api/admin/reviews/[id]` | Approve/reject/delete a review |
| `GET/POST /api/admin/smart-collections` | Smart collection list/create |
| `GET/PUT/DELETE /api/admin/smart-collections/[id]` | Edit/delete smart collection |
| `GET /api/admin/smart-collections/[id]/products` | Products in a smart collection |
| `GET/POST /api/admin/tags` | Product tag management |

### 5.4 Payment Gateway APIs (Entirely Missing)

| Gateway | Routes |
|---|---|
| **SSLCommerz** | `init`, `success`, `fail`, `cancel`, `ipn` (5 routes) |
| **UddoktaPay** | `create`, `callback`, `webhook` (3 routes) |

### 5.5 Cron & Webhooks

| Route | Notes |
|---|---|
| `POST /api/cron/post-purchase` | Post-purchase follow-up email automation (cron) |
| `POST /api/webhooks/steadfast` | Steadfast delivery status update webhook |

---

## 6. Third-Party Integrations

| Integration | axionwear | berber-clothing | Priority |
|---|---|---|---|
| **SSLCommerz** (card payments) | Full integration | Missing | HIGH — major payment method |
| **UddoktaPay** | Full integration | Missing | HIGH — local payment gateway |
| **Steadfast Courier** | API + webhook | Missing (only Pathao) | MEDIUM |
| **Meta / Facebook Pixel** | PageView, ViewContent, AddToCart, Purchase | None | HIGH — ad attribution |
| **Google Shopping XML Feed** | Yes | Missing | MEDIUM — product discoverability |
| **Open Graph image generation** | `@vercel/og` API route | Missing | LOW |
| **Post-purchase email cron** | Yes | Missing | MEDIUM |

### berber advantages over axionwear (do NOT remove these):
- **Resend** email provider (`resend` + `@react-email/components`) — more modern than nodemailer
- **Framer Motion** — richer animations
- **Vercel Analytics + Speed Insights** — already wired up
- PostgreSQL-only (no SQLite adapter complexity)

---

## 7. Feature-Level Summary Table

| Feature | axionwear | berber-clothing | Gap Level |
|---|---|---|---|
| Referral program | Full (code gen, log, checkout) | Missing | 🔴 COMPLETE MISS |
| Product Drops | Full (pages, notify, countdown, admin) | Missing | 🔴 COMPLETE MISS |
| Episodes / Editorial | Full (admin CRUD, store pages) | Basic Lookbook (no DB) | 🟠 PARTIAL |
| Smart Collections | Full (rule engine, admin, store) | Missing | 🔴 COMPLETE MISS |
| Frequently Bought Together | Full (admin + PDP widget) | Missing | 🔴 COMPLETE MISS |
| Email Campaigns | Full (compose, schedule, send, track) | Missing | 🔴 COMPLETE MISS |
| Meta Pixel tracking | Full (4 event types) | Missing | 🔴 COMPLETE MISS |
| Order messaging (admin↔customer) | Full bi-directional | Missing | 🔴 COMPLETE MISS |
| Contact form persistence (inbox) | Full (DB + admin page) | Missing | 🔴 COMPLETE MISS |
| Product Reviews moderation | Admin panel | Missing | 🔴 COMPLETE MISS |
| Q&A moderation | Admin panel | Missing | 🔴 COMPLETE MISS |
| Recently Viewed Products | Tracker + widget | Missing | 🟡 MODERATE |
| "X people viewing this" counter | Yes | Missing | 🟡 MODERATE |
| Size Quiz | Interactive widget | Missing | 🟡 MODERATE |
| Post-Purchase Upsell modal | Yes | Missing | 🟡 MODERATE |
| Customer Lock/Unlock | Admin action | Missing | 🟡 MODERATE |
| COD call verification note | Order field + UI | Missing | 🟡 MODERATE |
| Order tagging | Admin UI | Missing | 🟡 MODERATE |
| Draft Orders (customer view) | Full customer page | Missing | 🟡 MODERATE |
| Abandoned cart email capture | Client tracker | Missing | 🟡 MODERATE |
| Referral account tab | Yes | Missing | 🔴 COMPLETE MISS |
| Newsletter signup component | Yes | Missing | 🟡 MODERATE |
| Blog tag browsing | `/blog/tag/[tag]` | Missing | 🟢 MINOR |
| SSLCommerz payment | Full | Missing | 🔴 CRITICAL |
| UddoktaPay payment | Full | Missing | 🔴 CRITICAL |
| Steadfast courier | API + webhook | Missing | 🟡 MODERATE |
| Google Shopping XML feed | Yes | Missing | 🟡 MODERATE |
| Inventory bulk update | API | Missing | 🟡 MODERATE |
| Customer CSV import | Admin page | Missing | 🟡 MODERATE |
| Search analytics | DB + admin + tracker | Missing | 🟡 MODERATE |
| Funnel analytics | DB + admin + tracker | Missing | 🟡 MODERATE |
| Product duplication | One-click | Missing | 🟢 MINOR |
| Bundle create/edit forms | Full CRUD | Partial (list only) | 🟠 PARTIAL |
| Warranty page | Static page | Missing | 🟢 MINOR |
| About page | Static page | Missing | 🟢 MINOR |
| SEO meta fields on Product | `metaTitle`, `metaDescription`, `ogImage` | Missing | 🟡 MODERATE |
| Variant-level comparePrice | Yes | Missing | 🟡 MODERATE |
| Unsubscribe landing page | Yes | Missing | 🟢 MINOR |

---

## 8. Prioritised Roadmap

### Tier 1 — Critical / High ROI, Relatively Self-Contained

1. **SSLCommerz + UddoktaPay payment gateways** — payment options directly affect revenue
2. **Meta / Facebook Pixel** — 4 tracker components, zero DB changes, major ad attribution impact
3. **Referral program** — add 3 User fields + `ReferralLog` model + 2 API routes + account tab
4. **Contact form persistence** — `ContactMessage` model + admin inbox page
5. **Product Reviews admin** — moderation panel + API routes (users can already submit; admin just can't manage)
6. **Newsletter signup** — `NewsletterForm` component + `/api/store/newsletter` route

### Tier 2 — High Impact, Medium Effort

7. **Order messaging** — `OrderMessage` model + 2 API routes + `OrderMessages.tsx` + admin UI
8. **Frequently Bought Together** — `FrequentlyBoughtTogether` model + admin UI + PDP widget
9. **Email campaigns** — `EmailCampaign` model + admin CRUD + `CampaignComposer.tsx`
10. **Smart Collections** — `ProductTag` + `SmartCollection` models + admin + store route
11. **Steadfast courier integration** — API route + webhook
12. **Recently Viewed Products** — client-side only, no DB required
13. **SEO meta fields on Product** — schema migration + admin form fields + page `<head>` tags
14. **Variant-level comparePrice** — small schema migration + PDP display update
15. **Google Shopping XML feed** — one API route, feeds paid acquisition

### Tier 3 — Unique/Specialised Features

16. **Product Drops system** — `DropNotify` model + admin management + store pages + countdown
17. **Episodes / Editorial** — `Episode` + `EpisodeProduct` models + admin CRUD + store pages
18. **Post-purchase upsell modal** — `PostPurchaseUpsell.tsx` on order confirmation
19. **Size Quiz** — `SizeQuiz.tsx` interactive widget on PDP
20. **Search + Funnel analytics** — `SearchAnalytic` + `FunnelEvent` models + trackers + admin pages
21. **Customer lock/unlock** — `isLocked` User field + admin action
22. **COD call note on orders** — `codCallNote` Order field + admin UI
23. **Order tagging** — `tags` Order field + admin UI
24. **Draft Orders customer view** — `DraftOrderClient.tsx` + store route
25. **Inventory bulk update** — single API route
26. **Customer CSV import** — admin page + API route
27. **OG image generation** — `@vercel/og` API route
28. **Post-purchase email cron** — one cron API route
29. **Product duplication** — one API route + `DuplicateButton.tsx`
30. **Bundle create/edit forms** — `BundleForm.tsx` + new/edit pages
31. **Blog tag browsing** — one store route
32. **Warranty / About / Unsubscribe pages** — static content pages
