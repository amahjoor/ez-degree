import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: "var(--color-primary-blue)",
          red: "var(--color-primary-red)",
          yellow: "var(--color-primary-yellow)",
          green: "var(--color-primary-green)",
        },
        // Map any remaining colors needed for backward compatibility
        blue: {
          50: "var(--color-blue-50)",
          100: "var(--color-blue-100)",
          200: "var(--color-blue-200)",
          500: "var(--color-blue-500)",
          600: "var(--color-blue-600)",
          700: "var(--color-blue-700)",
          800: "var(--color-blue-800)",
        },
        gray: {
          50: "var(--color-gray-50)",
          100: "var(--color-gray-100)",
          200: "var(--color-gray-200)",
          300: "var(--color-gray-300)",
          400: "var(--color-gray-400)",
          500: "var(--color-gray-500)",
          600: "var(--color-gray-600)",
          700: "var(--color-gray-700)",
          800: "var(--color-gray-800)",
        },
        // Add direct color variables
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
  // Add safelist to ensure critical utility classes aren't purged
  safelist: [
    'bg-primary-blue',
    'text-primary-blue',
    'border-primary-blue',
    'bg-primary-red',
    'text-primary-red',
    'border-primary-red',
    'bg-primary-green',
    'text-primary-green',
    'border-primary-green',
    'bg-primary-yellow',
    'text-primary-yellow',
    'border-primary-yellow',
  ],
};

export default config;
