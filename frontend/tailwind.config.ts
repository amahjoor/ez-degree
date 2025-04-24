import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: {
          blue: "#4285F4",
          red: "#EA4335",
          yellow: "#FBBC05",
          green: "#34A853",
        },
        // Secondary colors
        purple: "#8F44AD",
        orange: "#F39C12",
        teal: "#16A085",
        "bright-red": "#E74C3C",
        
        // Blue shades
        blue: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
        },
        // Gray shades
        gray: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
        },
        // Red shades
        red: {
          50: "#fef2f2",
          100: "#fee2e2",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
        },
        // Green shades
        green: {
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
        // Yellow shades
        yellow: {
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          500: "#eab308",
        },
        // Background and foreground
        background: "#ffffff",
        foreground: "#171717",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      // Add a dark mode variant
      darkMode: {
        background: "#0a0a0a",
        foreground: "#ededed",
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
