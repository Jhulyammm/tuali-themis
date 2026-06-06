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
    "playwright",
    "playwright-core",
    "chromium-bidi",
  ],
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
