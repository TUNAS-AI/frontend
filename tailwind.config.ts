import animate from "tailwindcss-animate";
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        field: {
          50: "#F7F5EE",
          100: "#ECE8D9",
          200: "#D8CEB1",
          300: "#BCAA82",
          400: "#8A6A45",
          500: "#6E5638",
        },
        forest: {
          50: "#EAF3EC",
          100: "#D3E6D7",
          200: "#A9CFB1",
          300: "#78B082",
          400: "#4E8A59",
          500: "#2F6B3C",
          600: "#255631",
          700: "#1D4428",
        },
        leaf: {
          100: "#DDF0D8",
          300: "#A6D39A",
          500: "#6FAF5F",
          700: "#3E7538",
        },
        ai: {
          50: "#F4EFF8",
          100: "#E6D9F1",
          500: "#7541A4",
          700: "#522675",
        },
        rain: {
          100: "#DCECF7",
          300: "#91BFDD",
          500: "#4A90C2",
          700: "#2E6389",
        },
        harvest: {
          100: "#FAE9C8",
          300: "#F1C067",
          500: "#E7A23B",
          700: "#9C6718",
        },
        risk: {
          100: "#F8DCD8",
          300: "#E99387",
          500: "#D65A4A",
          700: "#963227",
        },
        ink: {
          700: "#243126",
          500: "#526154",
          300: "#7A867C",
        },
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        success: {
          DEFAULT: "hsl(var(--success) / <alpha-value>)",
          foreground: "hsl(var(--success-foreground) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "hsl(var(--warning) / <alpha-value>)",
          foreground: "hsl(var(--warning-foreground) / <alpha-value>)",
        },
        info: {
          DEFAULT: "hsl(var(--info) / <alpha-value>)",
          foreground: "hsl(var(--info-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        chart: {
          1: "hsl(var(--chart-1) / <alpha-value>)",
          2: "hsl(var(--chart-2) / <alpha-value>)",
          3: "hsl(var(--chart-3) / <alpha-value>)",
          4: "hsl(var(--chart-4) / <alpha-value>)",
          5: "hsl(var(--chart-5) / <alpha-value>)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        farm: "0 16px 40px rgba(36, 49, 38, 0.08)",
        lift: "0 10px 24px rgba(47, 107, 60, 0.12)",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
