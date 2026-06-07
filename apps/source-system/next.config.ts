import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "5mb" },
  },
  // Cuando exponemos source-system vía túnel cloudflared, Next 15.5 alerta
  // por cross-origin a /_next/*. Permitimos cualquier subdominio trycloudflare
  // + el VULTR_HOST opcional para deploy en producción.
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "*.ngrok-free.app",
    "*.ngrok.io",
    ...(process.env.VULTR_HOST ? [process.env.VULTR_HOST] : []),
  ],
};

export default nextConfig;
