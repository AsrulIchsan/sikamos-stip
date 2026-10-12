import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        stip: {
          navy: "#0A2540",
          gold: "#D4AF37",
          blue: "#1E3A8A",
          light: "#F0F4F8",
          accent: "#2563EB",
        },
      },
    },
  },
  plugins: [],
};
export default config;
