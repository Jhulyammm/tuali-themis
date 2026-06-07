/**
 * Lista de pedidos del proveedor. Vista típica de portal CPG.
 *
 * Combina pedidos seed del servidor con pedidos recientes en localStorage
 * (los que el usuario crea en esta sesión via /pedidos/nuevo). El store
 * server-side se reinicia entre invocaciones de lambda en Vercel — por eso
 * el localStorage refleja "lo que acabo de hacer".
 */

import Link from "next/link";
import { listPedidos } from "@/data/pedidos-store";
import { RecentPedidosClient } from "./RecentPedidosClient";

export const dynamic = "force-dynamic";

export default function PedidosListPage() {
  const pedidos = listPedidos();

  return (
    <div className="px-6 py-5 max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-4 border-b border-vendor-border pb-3">
        <div>
          <h1 className="text-xl font-semibold text-vendor-green">
            Pedidos · CD Monterrey-Norte
          </h1>
          <p className="text-xs text-vendor-gray mt-0.5">
            {pedidos.length} pedidos · Último corte 2026-06-06 09:00 · Próximo
            cierre 18:00
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/pedidos/nuevo"
            className="bg-vendor-green text-white px-3 py-1 text-xs hover:bg-vendor-green-hover"
          >
            + Nuevo pedido
          </Link>
          <button className="border border-vendor-border px-3 py-1 text-xs text-vendor-gray hover:bg-vendor-gray-light">
            Exportar XLS
          </button>
        </div>
      </div>

      {/* Pedidos recientes (cliente — localStorage) */}
      <RecentPedidosClient />

      {/* Pedidos del servidor (seeds permanentes) */}
      <table>
        <thead>
          <tr>
            <th>ID Pedido</th>
            <th>Cliente destinatario</th>
            <th>RFC</th>
            <th>Fecha solicitud</th>
            <th>Ruta</th>
            <th>Estatus</th>
            <th className="text-right">Total neto sin IVA</th>
            <th>Líneas</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((p) => (
            <tr key={p.id}>
              <td className="font-mono text-vendor-green">{p.id}</td>
              <td>{p.cliente_destinatario}</td>
              <td className="font-mono text-xs">{p.rfc_destinatario}</td>
              <td className="font-mono text-xs">{p.fecha_solicitud}</td>
              <td className="text-vendor-gray text-xs">{p.ruta_entrega}</td>
              <td>
                <EstatusBadge value={p.estatus} />
              </td>
              <td className="text-right font-mono">
                ${p.total_neto.toFixed(2)}
              </td>
              <td className="text-center font-mono text-xs">
                {p.lineas.length}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EstatusBadge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    borrador: "bg-vendor-gray-light text-vendor-gray",
    confirmado: "bg-vendor-green-light text-vendor-green",
    en_ruta: "bg-yellow-50 text-yellow-800",
    entregado: "bg-blue-50 text-blue-700",
  };
  const cls = styles[value] ?? styles.borrador;
  return (
    <span className={`inline-block px-2 py-0.5 text-[11px] rounded-sm ${cls}`}>
      {value.replace("_", " ")}
    </span>
  );
}
