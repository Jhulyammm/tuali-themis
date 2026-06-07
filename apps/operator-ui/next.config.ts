import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
