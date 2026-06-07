import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Catálogo · Distribuidora del Norte",
  description: "Portal de proveedor CPG · Catálogo digital de productos",
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
          <VendorHeader />
          <main className="flex-1">{children}</main>
          <VendorFooter />
        </div>
      </body>
    </html>
  );
}

function VendorHeader() {
  return (
    <header className="bg-vendor-green text-white">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-vendor-accent flex items-center justify-center text-vendor-green font-bold text-sm">
            DN
          </div>
          <div>
            <div className="font-semibold text-base leading-tight">
              Distribuidora del Norte
            </div>
            <div className="text-[10px] uppercase tracking-wider opacity-80">
              Portal de Catálogo · Proveedor CPG
            </div>
          </div>
        </div>
        <div className="text-xs opacity-80">
          Sesión: ventas.mty@ddn.mx · Monterrey, NL
        </div>
      </div>
      <nav className="bg-vendor-green-hover px-6 py-1.5 flex items-center gap-1 text-sm">
        <a
          href="/"
          className="px-3 py-1 hover:bg-white/10 rounded-sm transition"
        >
          Catálogo
        </a>
        <a
          href="/pedidos"
          className="px-3 py-1 hover:bg-white/10 rounded-sm transition"
        >
          Pedidos
        </a>
        <a
          href="/pedidos/nuevo"
          className="px-3 py-1 hover:bg-white/10 rounded-sm transition"
        >
          Nuevo pedido
        </a>
        <span className="px-3 py-1 opacity-60 cursor-not-allowed" title="No disponible en demo">
          Estado de cuenta
        </span>
      </nav>
    </header>
  );
}

function VendorFooter() {
  return (
    <footer className="bg-vendor-gray-light text-vendor-gray text-[11px] px-6 py-2 border-t border-vendor-border flex items-center justify-between">
      <span>
        Distribuidora del Norte SA de CV · RFC DNN960531ABC ·
        Portal v3.2.1
      </span>
      <span>
        Soporte ventas: 81-8888-1234 · soporte@ddn.mx
      </span>
    </footer>
  );
}
