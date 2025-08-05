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
        brand: {
          primary: '#a855f7',
          secondary: '#ec4899',
          accent: '#6366f1',
          light: '#f3e8ff',
          dark: '#581c87',
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "brand-gradient": "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
        "hero-gradient": "linear-gradient(135deg, #1e1b4b 0%, #581c87 50%, #be185d 100%)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
export default config;
