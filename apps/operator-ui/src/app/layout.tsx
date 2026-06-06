import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Themis · Agente Cognitivo Verificable",
  description:
    "Themis aprende procesos web por observación, razona con contexto, recuerda y prueba en blockchain. Hack4Her 2026.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg-base text-text-primary min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
