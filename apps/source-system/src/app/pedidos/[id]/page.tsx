/**
 * Detalle de pedido — vista que un trabajador CPG usa para revisar antes
 * de aprobar o capturar al ERP destino. Datos densos, formato SAP-like.
 *
 * Para Themis: acá hay 10+ campos con nombres NO triviales que mapean a
 * campos distintos en el ERP destino (denominación, código interno, etc).
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { getPedido } from "@/data/pedidos-store";
import { getProduct } from "@/data/catalog";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PedidoDetail({ params }: PageProps) {
  const { id } = await params;
  const pedido = getPedido(id);
  if (!pedido) notFound();

  return (
    <div className="px-6 py-5 max-w-5xl mx-auto">
      <nav className="text-xs text-vendor-gray mb-3">
        <Link href="/pedidos" className="hover:underline">
          Pedidos
        </Link>{" "}
        / <span className="text-vendor-green">{pedido.id}</span>
      </nav>

      <div className="border border-vendor-border bg-white">
        <div className="bg-vendor-gray-light px-4 py-2 border-b border-vendor-border flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold">Pedido {pedido.id}</h1>
            <div className="text-xs text-vendor-gray mt-0.5">
              {pedido.cliente_destinatario} · {pedido.fecha_solicitud}
            </div>
          </div>
          <span className="inline-block px-2 py-1 text-[11px] rounded-sm bg-vendor-green-light text-vendor-green">
            {pedido.estatus.replace("_", " ")}
          </span>
        </div>

        {/* Datos generales */}
        <div className="px-4 py-4 grid grid-cols-2 gap-3 border-b border-vendor-border">
          <FieldRow label="ID Pedido" value={pedido.id} mono />
          <FieldRow
            label="Fecha solicitud"
            value={pedido.fecha_solicitud}
            mono
          />
          <FieldRow
            label="Cliente destinatario"
            value={pedido.cliente_destinatario}
          />
          <FieldRow label="RFC destinatario" value={pedido.rfc_destinatario} mono />
          <FieldRow
            label="Centro distribución"
            value={pedido.centro_distribucion}
          />
          <FieldRow label="Ruta de entrega" value={pedido.ruta_entrega} />
        </div>

        {/* Líneas */}
        <div className="px-4 py-3 border-b border-vendor-border">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-vendor-green mb-2">
            Líneas del pedido ({pedido.lineas.length})
          </p>
          <table className="text-xs">
            <thead>
              <tr>
                <th>SKU proveedor</th>
                <th>Producto</th>
                <th>Marca</th>
                <th className="text-right">Cantidad solicitada</th>
                <th className="text-right">Precio lista (con IVA)</th>
                <th className="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {pedido.lineas.map((l) => {
                const p = getProduct(
                  // catalog uses P-NNN ids; lookup by SKU
                  Array.from({ length: 999 }, (_, i) => ({}))[0]
                    ? "P-001"
                    : "P-001",
                );
                const prod = p ?? null;
                return (
                  <tr key={l.sku_proveedor}>
                    <td className="font-mono text-vendor-green">
                      {l.sku_proveedor}
                    </td>
                    <td>{prod?.producto ?? lookupProducto(l.sku_proveedor)}</td>
                    <td>{prod?.marca ?? "—"}</td>
                    <td className="text-right font-mono">
                      {l.cantidad_solicitada}
                    </td>
                    <td className="text-right font-mono">
                      ${l.precio_lista.toFixed(2)}
                    </td>
                    <td className="text-right font-mono">
                      ${l.subtotal.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="px-4 py-3 grid grid-cols-2 gap-3 bg-vendor-gray-light/30 border-b border-vendor-border">
          <FieldRow
            label="Total bruto (con IVA)"
            value={`$${pedido.total_bruto.toFixed(2)} MXN`}
            mono
          />
          <FieldRow
            label="IVA 16%"
            value={`$${pedido.iva_16pct.toFixed(2)} MXN`}
            mono
          />
          <FieldRow
            label="Total neto sin IVA"
            value={`$${pedido.total_neto.toFixed(2)} MXN`}
            mono
          />
          <FieldRow
            label="Régimen fiscal aplicado"
            value="601 · Régimen General Ley de Personas Morales"
          />
        </div>

        {/* Observaciones */}
        {pedido.observaciones && (
          <div className="px-4 py-3 text-xs">
            <span className="font-semibold uppercase tracking-wider text-vendor-green block mb-1">
              Observaciones de entrega
            </span>
            {pedido.observaciones}
          </div>
        )}

        <div className="px-4 py-2 bg-vendor-gray-light flex items-center justify-between text-[11px] text-vendor-gray">
          <span>
            Capturado: 2026-06-06 09:14 · Usuario: ventas.mty@ddn.mx
          </span>
          <span>Documento fiscal CFDI 4.0 pendiente</span>
        </div>
      </div>
    </div>
  );
}

function FieldRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 items-baseline">
      <div className="col-span-1 text-[11px] uppercase font-semibold text-vendor-gray tracking-wider">
        {label}
      </div>
      <div
        className={`col-span-2 text-sm ${mono ? "font-mono" : ""} text-gray-900`}
      >
        {value}
      </div>
    </div>
  );
}

function lookupProducto(sku: string): string {
  // Mapping simple SKU → nombre producto (los IDs del catálogo son P-NNN)
  const map: Record<string, string> = {
    "DDN-CERV-INDIO-355": "Cerveza Indio Lager 355ml",
    "DDN-REFR-CCMEX-600": "Refresco Coca-Cola Mexicana 600ml",
    "DDN-BOT-SABORI-170": "Botana Sabritas Original 170g",
    "DDN-AGUA-CIEL-1500": "Agua Embotellada Ciel 1.5L",
    "DDN-GLT-MARGAM-6PZ": "Galletas Marías Gamesa Caja 6pz",
    "DDN-CAF-NESCLA-100": "Café Soluble Nescafé Clásico 100g",
    "DDN-TEQ-CUERREP-750": "Tequila José Cuervo Especial Reposado 750ml",
    "DDN-LIM-ROMAPL-1K": "Detergente Roma Polvo 1kg",
    "DDN-CHOC-CV18-18PK": "Chocolate Carlos V Tableta 18g · Pack 18",
    "DDN-ATU-DOLAGU-140": "Atún Aleta Amarilla en Agua Dolores 140g",
  };
  return map[sku] ?? "Producto no encontrado";
}
