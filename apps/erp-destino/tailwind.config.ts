import type { Config } from "tailwindcss";

/**
 * ERP Destino — config Tailwind INTENCIONALMENTE simple/corporativa.
 * Contraste con operator-ui (dark + coral premium).
 * Look: SAP Fiori, blanco + azul corporativo, denso.
 */
const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        corp: {
          blue: "#0066a3",
          "blue-hover": "#005084",
          "blue-light": "#e6f0f7",
          gray: "#666666",
          "gray-light": "#f5f5f5",
          border: "#dddddd",
        },
      },
      fontFamily: {
        sans: ["Arial", "Helvetica", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
