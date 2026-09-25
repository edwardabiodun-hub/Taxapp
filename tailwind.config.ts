import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ['-apple-system', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        body: ['-apple-system', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        border: "color-mix(in srgb, var(--border) calc(<alpha-value> * 100%), transparent)",
        input: "color-mix(in srgb, var(--input) calc(<alpha-value> * 100%), transparent)",
        ring: "color-mix(in srgb, var(--ring) calc(<alpha-value> * 100%), transparent)",
        background: "color-mix(in srgb, var(--background) calc(<alpha-value> * 100%), transparent)",
        foreground: "color-mix(in srgb, var(--foreground) calc(<alpha-value> * 100%), transparent)",
        primary: {
          DEFAULT: "color-mix(in srgb, var(--primary) calc(<alpha-value> * 100%), transparent)",
          foreground: "color-mix(in srgb, var(--primary-foreground) calc(<alpha-value> * 100%), transparent)",
        },
        secondary: {
          DEFAULT: "color-mix(in srgb, var(--secondary) calc(<alpha-value> * 100%), transparent)",
          foreground: "color-mix(in srgb, var(--secondary-foreground) calc(<alpha-value> * 100%), transparent)",
        },
        destructive: {
          DEFAULT: "color-mix(in srgb, var(--destructive) calc(<alpha-value> * 100%), transparent)",
          foreground: "color-mix(in srgb, var(--destructive-foreground) calc(<alpha-value> * 100%), transparent)",
        },
        muted: {
          DEFAULT: "color-mix(in srgb, var(--muted) calc(<alpha-value> * 100%), transparent)",
          foreground: "color-mix(in srgb, var(--muted-foreground) calc(<alpha-value> * 100%), transparent)",
        },
        accent: {
          DEFAULT: "color-mix(in srgb, var(--accent) calc(<alpha-value> * 100%), transparent)",
          foreground: "color-mix(in srgb, var(--accent-foreground) calc(<alpha-value> * 100%), transparent)",
        },
        popover: {
          DEFAULT: "color-mix(in srgb, var(--popover) calc(<alpha-value> * 100%), transparent)",
          foreground: "color-mix(in srgb, var(--popover-foreground) calc(<alpha-value> * 100%), transparent)",
        },
        card: {
          DEFAULT: "color-mix(in srgb, var(--card) calc(<alpha-value> * 100%), transparent)",
          foreground: "color-mix(in srgb, var(--card-foreground) calc(<alpha-value> * 100%), transparent)",
        },
        success: {
          DEFAULT: "color-mix(in srgb, var(--success) calc(<alpha-value> * 100%), transparent)",
          foreground: "color-mix(in srgb, var(--success-foreground) calc(<alpha-value> * 100%), transparent)",
        },
        warning: {
          DEFAULT: "color-mix(in srgb, var(--warning) calc(<alpha-value> * 100%), transparent)",
          foreground: "color-mix(in srgb, var(--warning-foreground) calc(<alpha-value> * 100%), transparent)",
        },
        info: {
          DEFAULT: "color-mix(in srgb, var(--info) calc(<alpha-value> * 100%), transparent)",
          foreground: "color-mix(in srgb, var(--info-foreground) calc(<alpha-value> * 100%), transparent)",
        },
        sidebar: {
          DEFAULT: "color-mix(in srgb, var(--sidebar-background) calc(<alpha-value> * 100%), transparent)",
          foreground: "color-mix(in srgb, var(--sidebar-foreground) calc(<alpha-value> * 100%), transparent)",
          primary: "color-mix(in srgb, var(--sidebar-primary) calc(<alpha-value> * 100%), transparent)",
          "primary-foreground": "color-mix(in srgb, var(--sidebar-primary-foreground) calc(<alpha-value> * 100%), transparent)",
          accent: "color-mix(in srgb, var(--sidebar-accent) calc(<alpha-value> * 100%), transparent)",
          "accent-foreground": "color-mix(in srgb, var(--sidebar-accent-foreground) calc(<alpha-value> * 100%), transparent)",
          border: "color-mix(in srgb, var(--sidebar-border) calc(<alpha-value> * 100%), transparent)",
          ring: "color-mix(in srgb, var(--sidebar-ring) calc(<alpha-value> * 100%), transparent)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slide-up": {
          from: { transform: "translateY(16px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
