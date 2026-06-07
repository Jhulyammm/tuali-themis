import type { Config } from "tailwindcss";

/**
 * Source System — Portal de proveedor CPG ficticio.
 * Look intencional: blanco + verde corporativo mexicano.
 * Contraste claro con:
 *   - operator-ui (dark + coral premium)
 *   - erp-destino (blanco + azul SAP-like)
 *
 * Storytelling: "Cualquier proveedor publica su catálogo así. Themis lo lee
 * y lo replica al ERP destino sin saber el mapping por adelantado."
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
        vendor: {
          green: "#1e6b3a",
          "green-hover": "#155028",
          "green-light": "#e8f3ec",
          accent: "#d4af37",
          gray: "#555",
          "gray-light": "#f7f7f5",
          border: "#dcdcd0",
        },
      },
      fontFamily: {
        sans: ["system-ui", "Segoe UI", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
