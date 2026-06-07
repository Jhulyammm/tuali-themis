import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "5mb" },
  },
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.vercel.app",
  ],
  // Headers que permiten que el operator-ui embeba este sitio en un iframe.
  // Sin esto, X-Frame-Options o Content-Security-Policy podrían bloquearlo.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Permitir embed desde cualquier subdominio vercel.app (operator-ui)
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self' https://*.vercel.app http://localhost:*",
          },
          // Vercel a veces inyecta X-Frame-Options: DENY por default — overrideamos
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
