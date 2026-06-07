/**
 * RecentPedidosClient — pedidos creados en ESTA sesión (localStorage).
 *
 * El store del servidor (globalThis) no sobrevive entre invocaciones de
 * lambda en Vercel. Para que el usuario VEA su pedido recién creado en la
 * lista, lo guardamos client-side en localStorage cuando completa el wizard.
 *
 * Esta sección aparece arriba del listado server-rendered con un badge
 * "nuevo en esta sesión" para diferenciar.
 */

"use client";

import { useEffect, useState } from "react";

interface RecentPedido {
  id: string;
  cliente_destinatario: string;
  rfc_destinatario: string;
  fecha_solicitud: string;
  centro_distribucion: string;
  ruta_entrega: string;
  estatus: string;
  total_neto: number;
  lineas: Array<{ sku_proveedor: string; cantidad_solicitada: number }>;
  observaciones: string;
  _created_at: string;
}

export function RecentPedidosClient() {
  const [recents, setRecents] = useState<RecentPedido[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem("ddn.pedidos.recent");
      if (raw) {
        const parsed = JSON.parse(raw) as RecentPedido[];
        setRecents(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  if (!mounted || recents.length === 0) return null;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-vendor-green">
          Pedidos recientes · esta sesión ({recents.length})
        </p>
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("ddn.pedidos.recent");
            setRecents([]);
          }}
          className="text-[10px] text-vendor-gray hover:text-vendor-green hover:underline"
        >
          Limpiar
        </button>
      </div>
      <div className="border border-vendor-green border-l-4 bg-vendor-green-light/40 rounded-sm overflow-hidden">
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
            {recents.map((p) => (
              <tr key={p.id}>
                <td className="font-mono text-vendor-green font-semibold">
                  {p.id}
                  <span className="ml-2 inline-block px-1.5 py-0.5 text-[9px] bg-vendor-green text-white rounded-sm">
                    NUEVO
                  </span>
                </td>
                <td>{p.cliente_destinatario}</td>
                <td className="font-mono text-xs">{p.rfc_destinatario}</td>
                <td className="font-mono text-xs">{p.fecha_solicitud}</td>
                <td className="text-vendor-gray text-xs">{p.ruta_entrega}</td>
                <td>
                  <span className="inline-block px-2 py-0.5 text-[11px] rounded-sm bg-vendor-green-light text-vendor-green">
                    {p.estatus}
                  </span>
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
    </div>
  );
}
