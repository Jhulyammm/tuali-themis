/**
 * Página principal del Source System: catálogo de productos del proveedor.
 * Tabla densa estilo ERP/portal mayorista. Click en SKU → ficha de detalle.
 */

import Link from "next/link";
import { CATALOG } from "@/data/catalog";

export default function CatalogPage() {
  return (
    <div className="px-6 py-5 max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-4 border-b border-vendor-border pb-3">
        <div>
          <h1 className="text-xl font-semibold text-vendor-green">
            Catálogo de productos · 2026 Q2
          </h1>
          <p className="text-xs text-vendor-gray mt-0.5">
            {CATALOG.length} SKUs disponibles · Precios sujetos a cambio sin
            previo aviso · IVA incluido
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <input
            type="text"
            placeholder="Buscar producto o SKU…"
            className="w-64"
          />
          <button className="bg-vendor-green text-white px-3 py-1 text-xs hover:bg-vendor-green-hover">
            Buscar
          </button>
          <button className="border border-vendor-border px-3 py-1 text-xs text-vendor-gray hover:bg-vendor-gray-light">
            Exportar XLS
          </button>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>SKU proveedor</th>
            <th>Producto</th>
            <th>Marca</th>
            <th>Categoría comercial</th>
            <th className="text-right">Precio lista</th>
            <th>Disponibilidad</th>
            <th>Lote</th>
          </tr>
        </thead>
        <tbody>
          {CATALOG.map((p) => (
            <tr key={p.id}>
              <td className="font-mono text-vendor-green">
                <Link href={`/producto/${p.id}`} className="hover:underline">
                  {p.sku_proveedor}
                </Link>
              </td>
              <td>
                <Link href={`/producto/${p.id}`} className="hover:underline">
                  {p.producto}
                </Link>
              </td>
              <td>{p.marca}</td>
              <td className="text-vendor-gray">{p.categoria_comercial}</td>
              <td className="text-right font-mono">
                ${p.precio_lista.toFixed(2)}
              </td>
              <td>
                <DisponibilidadBadge value={p.disponibilidad} />
              </td>
              <td className="font-mono text-xs text-vendor-gray">{p.lote}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 text-[11px] text-vendor-gray">
        Datos correspondientes a inventario del CD Monterrey-Norte. Para
        confirmar disponibilidad regional contacta a tu ejecutivo de cuenta.
      </div>
    </div>
  );
}

function DisponibilidadBadge({ value }: { value: string }) {
  const styles =
    value === "En existencia"
      ? "bg-vendor-green-light text-vendor-green"
      : value === "Por llegar"
        ? "bg-yellow-50 text-yellow-800"
        : "bg-red-50 text-red-700";
  return (
    <span className={`inline-block px-2 py-0.5 text-[11px] rounded-sm ${styles}`}>
      {value}
    </span>
  );
}
