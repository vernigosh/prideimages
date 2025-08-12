import type { Config } from "tailwindcss"
import defaultConfig from "tailwindcss/defaultConfig"

const config: Config = {
  ...defaultConfig,
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Vernigosh brand colors from actual website
        brand: {
          coral: "#ffb8ad", // Main coral background from your site
          black: "#000000", // Black text
          white: "#ffffff", // White/light areas
          gray: "#f8f9fa", // Light gray for content areas
          darkGray: "#6c757d", // Darker gray for secondary text
          lime: "#32cd32", // Lime green accent
        },
        // Extended coral palette
        coral: {
          50: "#fff8f7",
          100: "#ffefec",
          200: "#ffddd6",
          300: "#ffb8ad", // Main brand color
          400: "#ff9b8a",
          500: "#ff7e67",
          600: "#ff6144",
          700: "#e54421",
          800: "#cc3d1e",
          900: "#b3361a",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        sans: ["var(--font-roboto)", "Roboto", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
