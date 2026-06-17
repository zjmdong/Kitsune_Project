import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17201d",
        fern: "#153f39",
        mint: "#d8eadf",
        clay: "#b65345",
        brass: "#c59a45",
        paper: "#f6f4ee",
        pearl: "#fbfbf8"
      },
      boxShadow: {
        panel: "0 18px 45px rgba(23, 32, 29, 0.08)"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "Segoe UI", "Arial", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
