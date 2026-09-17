const VERCEL_ENV = process.env.VERCEL_ENV
const VERCEL_URL = process.env.VERCEL_URL

export const APP_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (VERCEL_ENV === "production"
    ? `https://${VERCEL_URL}`
    : VERCEL_ENV === "preview"
    ? `https://${VERCEL_URL}`
    : "http://localhost:3000")
