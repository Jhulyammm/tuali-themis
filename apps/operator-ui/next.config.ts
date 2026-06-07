import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // CRÍTICO para Vercel monorepo pnpm:
  // Le dice a Next.js que rastree archivos desde el workspace root, no solo
  // desde apps/operator-ui. Sin esto, Vercel empaqueta el lambda sin las
  // workspace deps de packages/agent (Stagehand, Solana, Anthropic, etc) y
  // crashea con "Cannot find module '@browserbasehq/stagehand'" en runtime.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  // RED DE SEGURIDAD para Vercel monorepo: fuerza al tracing a incluir
  // estos node_modules en los lambdas que usan Stagehand/Solana/Mongo.
  // Sin esto, Vercel a veces omite deps externalizadas en monorepo pnpm.
  outputFileTracingIncludes: {
    // Datasets de fallback para Capa 3 (zonas y eventos calendario). Sin esto,
    // /api/events y /api/recommendations no encuentran los JSON cuando Gemini
    // está rate-limited o sin cuota.
    "/api/events/**": ["../../data/**/*.json"],
    "/api/recommendations/**": ["../../data/**/*.json"],
    "/api/browser/**": [
      "../../node_modules/.pnpm/@browserbasehq+stagehand@**/node_modules/@browserbasehq/stagehand/**",
      "../../node_modules/.pnpm/@browserbasehq+sdk@**/node_modules/@browserbasehq/sdk/**",
      "../../node_modules/.pnpm/playwright-core@**/node_modules/playwright-core/**",
      "../../node_modules/.pnpm/playwright@**/node_modules/playwright/**",
    ],
    "/api/execute/**": [
      "../../node_modules/.pnpm/@browserbasehq+stagehand@**/node_modules/@browserbasehq/stagehand/**",
      "../../node_modules/.pnpm/@browserbasehq+sdk@**/node_modules/@browserbasehq/sdk/**",
      "../../node_modules/.pnpm/playwright-core@**/node_modules/playwright-core/**",
      "../../node_modules/.pnpm/playwright@**/node_modules/playwright/**",
    ],
    "/api/playbooks/**": [
      "../../node_modules/.pnpm/mongodb@**/node_modules/mongodb/**",
    ],
    "/api/executions/**": [
      "../../node_modules/.pnpm/mongodb@**/node_modules/mongodb/**",
    ],
    "/api/status/**": [
      "../../node_modules/.pnpm/mongodb@**/node_modules/mongodb/**",
      "../../node_modules/.pnpm/@solana+web3.js@**/node_modules/@solana/web3.js/**",
    ],
  },
  transpilePackages: [
    "@hack4her/agent",
    "@hack4her/db",
    "@hack4her/playbooks",
  ],
  // NO bundlear estos paquetes; cargar en runtime desde node_modules
  // (Stagehand + Playwright tienen dependencias nativas/dinámicas)
  serverExternalPackages: [
    "@browserbasehq/stagehand",
    "@browserbasehq/sdk",
    "playwright",
    "playwright-core",
    "chromium-bidi",
    "mongodb",
  ],
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  // PROBLEMA: transpilePackages: ["@hack4her/agent"] hace que webpack siga
  // las imports DENTRO del agente y trate de bundlear Stagehand + Playwright,
  // ignorando serverExternalPackages. Playwright tiene requires dinámicos
  // (electron, fsevents, chromium-bidi) que webpack no puede resolver y
  // genera un build error fatal.
  //
  // SOLUCIÓN: webpack externals function que fuerza estos packages a quedar
  // como require() reales en runtime, no bundleados — Node los carga desde
  // node_modules en runtime.
  webpack: (config, { isServer }) => {
    if (!isServer) return config;

    const externalize = (request: string) =>
      request === "@browserbasehq/stagehand" ||
      request === "@browserbasehq/sdk" ||
      request === "playwright" ||
      request === "playwright-core" ||
      request === "mongodb" ||
      request === "aws4" ||
      request === "fsevents" ||
      request === "electron" ||
      request.startsWith("playwright-core/") ||
      request.startsWith("playwright/") ||
      request.startsWith("@browserbasehq/stagehand/") ||
      request.startsWith("chromium-bidi");

    const original = config.externals;
    const originalsArr = Array.isArray(original)
      ? original
      : original
        ? [original]
        : [];

    config.externals = [
      ...originalsArr,
      ({ request }: { request?: string }, callback: (err?: Error | null, result?: string) => void) => {
        if (request && externalize(request)) {
          return callback(null, `commonjs ${request}`);
        }
        callback();
      },
    ];

    return config;
  },
};

export default nextConfig;
