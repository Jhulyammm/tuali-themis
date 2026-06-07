/**
 * Página principal del Source System: Dashboard ejecutivo del portal proveedor.
 *
 * Reemplaza la antigua tabla de catálogo (movida a /catalogo). El home ahora
 * es lo que un comprador de Tuali/OXXO/Costco vería al loguearse: KPIs,
 * alertas de inventario, promociones, accesos rápidos y feed de actividad.
 *
 * Esto le da credibilidad al demo: el iframe que carga Themis en /teach
 * muestra un portal CPG que se siente REAL, no una demo de hackathon.
 */

import Link from "next/link";
import { CATALOG } from "@/data/catalog";

export default function DashboardPage() {
  const totalSkus = CATALOG.length;
  const enExistencia = CATALOG.filter((p) => p.disponibilidad === "En existencia").length;
  const porLlegar = CATALOG.filter((p) => p.disponibilidad === "Por llegar").length;
  const valorCatalogo = CATALOG.reduce((s, p) => s + p.precio_lista, 0);

  return (
    <div className="px-6 py-5 max-w-7xl mx-auto space-y-5">
      {/* Saludo + estado */}
      <div className="flex items-end justify-between gap-4 pb-3 border-b border-vendor-border">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-vendor-gray font-semibold">
            Portal de proveedor · Inicio
          </p>
          <h1 className="text-xl font-semibold text-vendor-green mt-0.5">
            Buenos días, OXXO Tec de Monterrey
          </h1>
          <p className="text-xs text-vendor-gray mt-0.5">
            Sesión iniciada · CD Monterrey-Norte ·{" "}
            <span className="font-mono">L-2026-W22</span> · Ciclo facturación
            mensual
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-vendor-gray">
            Próximo corte
          </p>
          <p className="text-sm font-semibold text-vendor-green font-mono">
            15-Jun-2026
          </p>
          <p className="text-[10px] text-vendor-gray">
            Saldo proyectado: $182,450.00
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Catálogo activo"
          value={totalSkus}
          sub={`${enExistencia} en stock · ${porLlegar} por llegar`}
          tone="green"
        />
        <KpiCard
          label="Pedidos del mes"
          value={47}
          sub="$284,920 · 12 pendientes embarque"
          tone="green"
        />
        <KpiCard
          label="Línea de crédito"
          value="$500K"
          sub="63% disponible · neto 30 días"
          tone="yellow"
        />
        <KpiCard
          label="Promociones activas"
          value={6}
          sub="Vigencia hasta 30-jun"
          tone="green"
        />
      </div>

      {/* Promoción destacada */}
      <div className="bg-gradient-to-r from-vendor-green to-emerald-700 text-white rounded-sm overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider opacity-80">
              Promoción del mes · vigencia hasta 30-jun
            </p>
            <p className="text-lg font-semibold mt-0.5">
              -8% en compra ≥ 200 cajas Coca-Cola FEMSA
            </p>
            <p className="text-xs opacity-80 mt-0.5">
              Aplica sobre SKU DDN-REFR-CCMEX-600 + variantes. No combinable
              con descuento por pronto pago.
            </p>
          </div>
          <Link
            href="/promociones"
            className="bg-white text-vendor-green px-4 py-2 text-xs font-semibold hover:bg-vendor-gray-light whitespace-nowrap"
          >
            Ver todas →
          </Link>
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Alertas de inventario */}
        <div className="lg:col-span-2 bg-white border border-vendor-border rounded-sm">
          <div className="px-4 py-2.5 border-b border-vendor-border flex items-center justify-between bg-vendor-gray-light">
            <p className="text-xs font-semibold text-vendor-green uppercase tracking-wide">
              Alertas de inventario
            </p>
            <span className="text-[10px] text-vendor-gray font-mono">
              actualizado hace 2 min
            </span>
          </div>
          <table>
            <thead>
              <tr>
                <th className="w-12">#</th>
                <th>Producto</th>
                <th>Tipo</th>
                <th className="text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              <AlertRow
                num="01"
                producto="Cerveza Indio Lager 355ml"
                sku="DDN-CERV-INDIO-355"
                tipo="bajo-stock"
                accion="Reabastecer en 5 días"
              />
              <AlertRow
                num="02"
                producto="Detergente Roma Polvo 1kg"
                sku="DDN-LIM-ROMAPL-1K"
                tipo="por-llegar"
                accion="Entrega prog. 12-jun"
              />
              <AlertRow
                num="03"
                producto="Tequila José Cuervo Especial Reposado 750ml"
                sku="DDN-TEQ-CUERREP-750"
                tipo="precio-cambio"
                accion="+3.5% desde 1-jul"
              />
              <AlertRow
                num="04"
                producto="Refresco Coca-Cola Mexicana 600ml"
                sku="DDN-REFR-CCMEX-600"
                tipo="promocion"
                accion="-8% si pides ≥200 cajas"
              />
              <AlertRow
                num="05"
                producto="Galletas Marías Gamesa Caja 6pz"
                sku="DDN-GLT-MARGAM-6PZ"
                tipo="bajo-stock"
                accion="Solo 18 cajas en CD Norte"
              />
            </tbody>
          </table>
        </div>

        {/* Actividad reciente */}
        <div className="bg-white border border-vendor-border rounded-sm">
          <div className="px-4 py-2.5 border-b border-vendor-border bg-vendor-gray-light">
            <p className="text-xs font-semibold text-vendor-green uppercase tracking-wide">
              Actividad reciente
            </p>
          </div>
          <div className="divide-y divide-vendor-border">
            <ActivityItem
              hora="09:14"
              texto="Pedido P-2026-0612 confirmado · $42,180"
              tipo="ok"
            />
            <ActivityItem
              hora="08:47"
              texto="Factura F-26-15482 enviada por correo"
              tipo="info"
            />
            <ActivityItem
              hora="07:30"
              texto="Embarque salió de CD Saltillo · ETA 11-jun"
              tipo="info"
            />
            <ActivityItem
              hora="Ayer"
              texto="Pago $98,500 acreditado · referencia 884215"
              tipo="ok"
            />
            <ActivityItem
              hora="Ayer"
              texto="Lista de precios Q3 publicada"
              tipo="warn"
            />
            <ActivityItem
              hora="2 días"
              texto="Devolución D-26-0089 procesada"
              tipo="info"
            />
          </div>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickAction
          title="Nuevo pedido"
          desc="Captura SKUs y embarca"
          href="/pedidos/nuevo"
        />
        <QuickAction
          title="Ver catálogo completo"
          desc={`${totalSkus} SKUs · 2026 Q2`}
          href="/catalogo"
        />
        <QuickAction
          title="Estado de cuenta"
          desc="Facturas, pagos, saldo"
          href="/estado-cuenta"
        />
        <QuickAction
          title="Promociones activas"
          desc="6 ofertas vigentes este mes"
          href="/promociones"
        />
      </div>

      {/* Resumen financiero */}
      <div className="bg-white border border-vendor-border rounded-sm">
        <div className="px-4 py-2.5 border-b border-vendor-border bg-vendor-gray-light flex items-center justify-between">
          <p className="text-xs font-semibold text-vendor-green uppercase tracking-wide">
            Resumen financiero · ciclo 2026 · CD Monterrey-Norte
          </p>
          <Link
            href="/estado-cuenta"
            className="text-[11px] text-vendor-green hover:underline"
          >
            ver detalle completo →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-vendor-border">
          <FinStat
            label="Compras YTD"
            value="$3,184,920.00"
            delta="+12.4% vs 2025"
            positive
          />
          <FinStat
            label="Saldo por pagar"
            value="$182,450.00"
            delta="vence 15-jun"
          />
          <FinStat
            label="Notas de crédito"
            value="$8,920.00"
            delta="aplicables al próximo corte"
            positive
          />
          <FinStat
            label="Ahorro por promo"
            value="$24,180.00"
            delta="YTD 2026"
            positive
          />
        </div>
      </div>

      {/* Footer informativo */}
      <div className="text-[11px] text-vendor-gray pt-2 border-t border-vendor-border">
        Datos correspondientes a inventario del CD Monterrey-Norte ·{" "}
        Atención a cuenta: <span className="font-mono">81-8888-1234</span> ·{" "}
        ejecutivo asignado: Luis Mendoza · Para confirmar disponibilidad
        regional o cambios de precio, contacta a tu ejecutivo.
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Sub-componentes
// ────────────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: number | string;
  sub: string;
  tone: "green" | "yellow" | "red";
}) {
  const accent =
    tone === "green"
      ? "border-l-vendor-green"
      : tone === "yellow"
        ? "border-l-yellow-500"
        : "border-l-red-500";
  return (
    <div
      className={`bg-white border border-vendor-border border-l-4 ${accent} px-4 py-3 rounded-sm`}
    >
      <p className="text-[10px] uppercase tracking-wider text-vendor-gray font-semibold">
        {label}
      </p>
      <p className="text-2xl font-bold font-mono text-vendor-green mt-1 leading-none">
        {value}
      </p>
      <p className="text-[11px] text-vendor-gray mt-1.5">{sub}</p>
    </div>
  );
}

function AlertRow({
  num,
  producto,
  sku,
  tipo,
  accion,
}: {
  num: string;
  producto: string;
  sku: string;
  tipo: "bajo-stock" | "por-llegar" | "precio-cambio" | "promocion";
  accion: string;
}) {
  const tipoLabel =
    tipo === "bajo-stock"
      ? "Bajo stock"
      : tipo === "por-llegar"
        ? "Por llegar"
        : tipo === "precio-cambio"
          ? "Cambio de precio"
          : "Promoción";
  const tipoStyle =
    tipo === "bajo-stock"
      ? "bg-red-50 text-red-700"
      : tipo === "por-llegar"
        ? "bg-yellow-50 text-yellow-800"
        : tipo === "precio-cambio"
          ? "bg-orange-50 text-orange-700"
          : "bg-vendor-green-light text-vendor-green";
  return (
    <tr>
      <td className="font-mono text-vendor-gray">{num}</td>
      <td>
        <div className="leading-tight">
          <div className="font-medium">{producto}</div>
          <div className="font-mono text-[10px] text-vendor-gray">{sku}</div>
        </div>
      </td>
      <td>
        <span
          className={`inline-block px-2 py-0.5 text-[10px] rounded-sm ${tipoStyle}`}
        >
          {tipoLabel}
        </span>
      </td>
      <td className="text-right text-vendor-gray text-[11px]">{accion}</td>
    </tr>
  );
}

function ActivityItem({
  hora,
  texto,
  tipo,
}: {
  hora: string;
  texto: string;
  tipo: "ok" | "warn" | "info";
}) {
  const dot =
    tipo === "ok"
      ? "bg-vendor-green"
      : tipo === "warn"
        ? "bg-yellow-500"
        : "bg-blue-500";
  return (
    <div className="px-4 py-2 flex items-start gap-3">
      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 ${dot}`} />
      <div className="flex-1 leading-tight">
        <p className="text-xs text-vendor-green">{texto}</p>
        <p className="text-[10px] text-vendor-gray font-mono mt-0.5">{hora}</p>
      </div>
    </div>
  );
}

function QuickAction({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white border border-vendor-border rounded-sm px-4 py-3 hover:border-vendor-green transition-colors group"
    >
      <p className="text-sm font-semibold text-vendor-green group-hover:underline">
        {title} →
      </p>
      <p className="text-[11px] text-vendor-gray mt-0.5">{desc}</p>
    </Link>
  );
}

function FinStat({
  label,
  value,
  delta,
  positive,
}: {
  label: string;
  value: string;
  delta: string;
  positive?: boolean;
}) {
  return (
    <div className="px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-vendor-gray font-semibold">
        {label}
      </p>
      <p className="text-lg font-bold font-mono text-vendor-green mt-1">
        {value}
      </p>
      <p
        className={`text-[11px] mt-0.5 ${positive ? "text-vendor-green" : "text-vendor-gray"}`}
      >
        {delta}
      </p>
    </div>
  );
}
