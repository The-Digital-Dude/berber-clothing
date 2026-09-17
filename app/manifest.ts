import { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Berber Clothing",
    short_name: "Berber",
    description: "Modern Bangladeshi clothing for the bold and elegant.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF9F6",
    theme_color: "#C9A84C",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
