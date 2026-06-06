import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ERP Captura · Tuali",
  description: "Sistema interno de captura de SKUs · Tuali / Arca Continental",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <div className="min-h-screen flex flex-col">
          <CorpHeader />
          <main className="flex-1">{children}</main>
          <CorpFooter />
        </div>
      </body>
    </html>
  );
}

function CorpHeader() {
  return (
    <header className="bg-corp-blue text-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="font-bold text-lg">Tuali · ERP</div>
        <nav className="flex items-center gap-1 text-sm">
          <a href="/" className="px-3 py-1 hover:bg-corp-blue-hover rounded">
            Inicio
          </a>
          <a href="/captura" className="px-3 py-1 hover:bg-corp-blue-hover rounded">
            Captura SKU
          </a>
          <a href="/inventario" className="px-3 py-1 hover:bg-corp-blue-hover rounded">
            Inventario
          </a>
        </nav>
      </div>
      <div className="text-xs">maria.rodriguez · Querétaro · 2026-06-06</div>
    </header>
  );
}

function CorpFooter() {
  return (
    <footer className="bg-corp-gray-light text-corp-gray text-xs px-6 py-2 border-t border-corp-border">
      Sistema ERP Tuali v18.4.2 · Arca Continental ©2026 · Soporte ext. 4500
    </footer>
  );
}
