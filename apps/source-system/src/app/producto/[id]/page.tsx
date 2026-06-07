/**
 * Ficha de detalle del producto. Esta es la pantalla CRÍTICA del demo:
 * cuando Themis OBSERVA acá durante /teach, debe inferir que "Producto" mapea
 * a "Denominación comercial" del ERP, "SKU proveedor" a "Código interno", etc.
 *
 * Por eso los nombres de campo son intencionalmente diferentes.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { getProduct } from "@/data/catalog";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductoDetail({ params }: PageProps) {
  const { id } = await params;
  const p = getProduct(id);
  if (!p) notFound();

  return (
    <div className="px-6 py-5 max-w-5xl mx-auto">
      <nav className="text-xs text-vendor-gray mb-3">
        <Link href="/" className="hover:underline">
          Catálogo
        </Link>{" "}
        / <span className="text-vendor-green">{p.sku_proveedor}</span>
      </nav>

      <div className="border border-vendor-border bg-white">
        <div className="bg-vendor-gray-light px-4 py-2 border-b border-vendor-border flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold">{p.producto}</h1>
            <div className="text-xs text-vendor-gray mt-0.5">
              Ficha técnica · ID interno: {p.id}
            </div>
          </div>
          <button className="bg-vendor-green text-white px-3 py-1 text-xs hover:bg-vendor-green-hover">
            Solicitar cotización
          </button>
        </div>

        <div className="grid grid-cols-3 gap-0 border-b border-vendor-border">
          <div className="col-span-1 p-4 border-r border-vendor-border bg-vendor-gray-light/30">
            <div className="w-full aspect-square bg-white border border-vendor-border flex items-center justify-center text-vendor-gray text-xs">
              [ Imagen no disponible ]
              <br />
              {p.imagen_url}
            </div>
            <div className="mt-3 text-[11px] text-vendor-gray font-mono">
              {p.imagen_url}
            </div>
          </div>

          <div className="col-span-2 p-4 space-y-3">
            <FieldRow label="Producto" value={p.producto} />
            <FieldRow label="SKU proveedor" value={p.sku_proveedor} mono />
            <FieldRow label="Marca" value={p.marca} />
            <FieldRow
              label="Categoría comercial"
              value={p.categoria_comercial}
            />
            <FieldRow label="Presentación" value={p.presentacion} />
            <FieldRow
              label="Precio lista (con IVA)"
              value={`$${p.precio_lista.toFixed(2)} MXN`}
              mono
            />
            <FieldRow label="Lote" value={p.lote} mono />
            <FieldRow label="Disponibilidad" value={p.disponibilidad} />
          </div>
        </div>

        <div className="px-4 py-3 text-xs text-vendor-gray border-b border-vendor-border">
          <span className="font-semibold uppercase tracking-wider text-vendor-green block mb-1">
            Descripción
          </span>
          {p.descripcion}
        </div>

        <div className="px-4 py-2 bg-vendor-gray-light flex items-center justify-between text-[11px] text-vendor-gray">
          <span>Actualizado: 2026-05-21 09:14 · Por: sistemas@ddn.mx</span>
          <span>Política de devolución: 30 días con factura</span>
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
        data-field={label.toLowerCase().replace(/\s/g, "-")}
      >
        {value}
      </div>
    </div>
  );
}
