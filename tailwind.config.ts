import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#24130a",
        fern: "#c2410c",
        mint: "#ffedd5",
        clay: "#ea580c",
        brass: "#f59e0b",
        paper: "#fff7ed",
        pearl: "#fffaf5"
      },
      boxShadow: {
        panel: "0 18px 45px rgba(124, 45, 18, 0.10)"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "Segoe UI", "Arial", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
