/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Default is 60s, which causes Vercel to re-run (and re-bill) the
    // Image Optimization pipeline on nearly every request. Product photos
    // get a new filename on every upload (never overwritten in place), so
    // a long cache lifetime is safe — this is the single biggest lever
    // against Vercel's Cached Egress usage.
    minimumCacheTTL: 31536000, // 1 year
    // Trim the default 8 device breakpoints down to what this store's
    // layouts actually request (grid cards top out around 25vw/50vw,
    // the widest is a 100vw hero) — fewer unique cached variants per image.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    remotePatterns: [
      // Supabase Storage (any project)
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Unsplash (used in homepage featured banner)
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // Generic https fallback for user-supplied image URLs
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
