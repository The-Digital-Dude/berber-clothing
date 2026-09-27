/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Vercel's on-demand Image Optimization (/_next/image) is a metered,
    // pausable-on-overage service — and redundant here, since every upload
    // already goes through sharp at upload time (resized to a 1200px max
    // width, re-encoded to WebP at quality 82 — see app/api/admin/upload/
    // route.ts). Rather than pay Vercel to re-resize an already-optimized
    // image on every unique width request, skip that pipeline entirely:
    // <Image> renders a plain <img src={original}> with zero Vercel-side
    // transformations, ever. Optimization still happens — it just happens
    // once, in our own code, at upload time, instead of repeatedly and
    // metered on Vercel's infrastructure.
    unoptimized: true,
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
