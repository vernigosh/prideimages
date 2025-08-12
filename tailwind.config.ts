import type { Config } from "tailwindcss"
import defaultConfig from "tailwindcss/defaultConfig"
import shadcnConfig from "shadcn/ui/tailwind.config"

const config: Config = {
  ...defaultConfig,
  ...shadcnConfig,
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
