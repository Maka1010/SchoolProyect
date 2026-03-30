import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          brown: "#4B3F36",
          terracotta: "#C97C5D",
          sand: "#E6D3B3",
          paper: "#F7F3EC",
          gray: "#8A8A8A",
          gray2: "#B0B0B0",
          ink: "#1A1A1A",
          white: "#FFFFFF"
        }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(26, 26, 26, 0.12)"
      }
    }
  },
  plugins: []
} satisfies Config;

