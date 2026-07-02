import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem", // 20px on mobile
        sm: "2rem",         // 32px
        md: "3rem",         // 48px
        lg: "5rem",         // 80px
        xl: "6rem",         // 96px
        "2xl": "8rem",      // 128px
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        heading: ["var(--font-heading)", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        "berber-black": "#1B2A4A",
        "berber-gold": "#C9A24B",
        "berber-bg": "#FAFAF8",
        "berber-surface": "#FFFFFF",
        "berber-muted": "#F5F5F3",
        "berber-border": "#E8E8E4",
        "berber-text": "#2C2C2A",
        "berber-text-muted": "#6B6B63",
        "berber-success": "#2D6A4F",
        "berber-error": "#C1121F",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
      },
      boxShadow: {
        "berber": "0 4px 24px rgba(0, 0, 0, 0.06)",
      }
    },
  },
  plugins: [],
};
export default config;
