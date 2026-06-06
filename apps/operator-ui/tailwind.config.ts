import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "hsl(var(--bg-base))",
          surface: "hsl(var(--bg-surface))",
          elevated: "hsl(var(--bg-elevated))",
          overlay: "hsl(var(--bg-overlay))",
        },
        border: {
          subtle: "hsl(var(--border-subtle))",
          DEFAULT: "hsl(var(--border-default))",
          strong: "hsl(var(--border-strong))",
        },
        text: {
          primary: "hsl(var(--text-primary))",
          secondary: "hsl(var(--text-secondary))",
          tertiary: "hsl(var(--text-tertiary))",
          disabled: "hsl(var(--text-disabled))",
        },
        coral: {
          DEFAULT: "hsl(var(--accent-coral))",
          soft: "hsl(var(--accent-coral-soft))",
          glow: "hsl(var(--accent-coral-glow))",
        },
        brand: {
          crimson: "#C8102E",
          "crimson-dark": "#B40D28",
          "crimson-text": "#FFFFFF",
        },
        status: {
          success: "hsl(var(--status-success))",
          "success-bg": "hsl(var(--status-success-bg))",
          warning: "hsl(var(--status-warning))",
          "warning-bg": "hsl(var(--status-warning-bg))",
          error: "hsl(var(--status-error))",
          info: "hsl(var(--status-info))",
          "info-bg": "hsl(var(--status-info-bg))",
        },
      },
      fontFamily: {
        sans: ["Geist", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "var(--radius-md)",
        sm: "var(--radius-sm)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        pulse_coral: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.15)" },
        },
        adapting_pulse: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
        self_heal: {
          "0%": { boxShadow: "0 0 0 0 rgba(245, 179, 1, 0.5)" },
          "70%": { boxShadow: "0 0 0 20px rgba(245, 179, 1, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(245, 179, 1, 0)" },
        },
        slide_in_right: {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        fade_in: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "pulse-coral": "pulse_coral 1.5s ease-in-out infinite",
        "adapting": "adapting_pulse 1s ease-in-out infinite",
        "self-heal": "self_heal 2s ease-out infinite",
        "slide-in-right": "slide_in_right 0.3s ease-out",
        "fade-in": "fade_in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
