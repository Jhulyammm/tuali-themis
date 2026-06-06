/**
 * /inventario — lista de SKUs capturados.
 * Para validación side-by-side en el Paso 4 del demo.
 */

import { listSkus } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  const skus = await listSkus();

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-corp-blue mb-1">Inventario</h1>
      <p className="text-sm text-corp-gray mb-6">
        {skus.length} SKU{skus.length !== 1 ? "s" : ""} capturado
        {skus.length !== 1 ? "s" : ""}
      </p>

      {skus.length === 0 ? (
        <div className="bg-white border border-corp-border p-8 text-center text-corp-gray text-sm">
          No hay capturas todavía. Empieza en{" "}
          <a href="/captura" className="text-corp-blue underline">
            Captura SKU
          </a>
          .
        </div>
      ) : (
        <div className="bg-white border border-corp-border overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-corp-blue-light text-corp-blue text-left uppercase">
              <tr>
                <th className="px-3 py-2 font-bold">Código interno</th>
                <th className="px-3 py-2 font-bold">Denominación</th>
                <th className="px-3 py-2 font-bold">Fabricante</th>
                <th className="px-3 py-2 font-bold">Rubro</th>
                <th className="px-3 py-2 font-bold text-right">Precio neto</th>
                <th className="px-3 py-2 font-bold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {skus.map((s, i) => (
                <tr
                  key={s.id}
                  className={i % 2 === 0 ? "bg-white" : "bg-corp-gray-light"}
                >
                  <td className="px-3 py-2 font-mono">{s.data.codigo_interno}</td>
                  <td className="px-3 py-2">{s.data.denominacion_comercial}</td>
                  <td className="px-3 py-2">{s.data.fabricante}</td>
                  <td className="px-3 py-2">{s.data.rubro_contable}</td>
                  <td className="px-3 py-2 text-right font-mono">
                    ${s.data.precio_neto_sin_iva}
                  </td>
                  <td className="px-3 py-2">{s.data.estado_de_stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
