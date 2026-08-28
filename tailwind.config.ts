import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // IHG Brand Colors
        brand: {
          DEFAULT: "#1F3A5F", // Deep Navy - primary
          50: "#F0F4F9",
          100: "#D9E2EE",
          200: "#B3C5DD",
          300: "#8DA8CC",
          400: "#678BBB",
          500: "#416EAA",
          600: "#1F3A5F", // primary
          700: "#192F4F",
          800: "#13243F",
          900: "#0D192F",
        },
        accent: {
          DEFAULT: "#FF2147", // Vibrant Red - CTA
          50: "#FFE5EA",
          100: "#FFCCD4",
          200: "#FF99AA",
          300: "#FF667F",
          400: "#FF3355",
          500: "#FF2147", // accent
          600: "#CC1A38",
          700: "#99142A",
          800: "#660E1C",
          900: "#33070E",
        },
        border: "hsl(214, 32%, 91%)",
        input: "hsl(214, 32%, 91%)",
        ring: "hsl(214, 60%, 25%)",
        background: "hsl(0, 0%, 100%)",
        foreground: "hsl(222, 47%, 11%)",
        primary: {
          DEFAULT: "#1F3A5F",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F1F5F9",
          foreground: "#1F3A5F",
        },
        destructive: {
          DEFAULT: "#FF2147",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F1F5F9",
          foreground: "#64748B",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#222222",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#222222",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem",
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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
