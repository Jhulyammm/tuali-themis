/**
 * /promociones — ofertas vigentes del proveedor.
 *
 * Catálogo de descuentos disponibles + condiciones, fechas de vigencia y
 * cómo aplicar. Esto es lo que un comprador de Tuali/OXXO realmente busca:
 * "qué oferta puedo aprovechar este mes para mi tiendita?".
 */

import Link from "next/link";

interface Promo {
  id: string;
  titulo: string;
  marca: string;
  descripcion: string;
  tipo: "descuento" | "bonificacion" | "rebate" | "muestra";
  porcentaje?: number;
  bonificacion?: string;
  condicion: string;
  vigencia_desde: string;
  vigencia_hasta: string;
  sku_aplicable: string;
  combinable: boolean;
  destacada?: boolean;
}

const PROMOS: Promo[] = [
  {
    id: "PROMO-26-Q2-001",
    titulo: "-8% en compra ≥ 200 cajas Coca-Cola FEMSA",
    marca: "Coca-Cola FEMSA",
    descripcion:
      "Aplica al SKU DDN-REFR-CCMEX-600 (Coca-Cola Mexicana 600ml) en presentación caja 24 piezas. Descuento neto sobre precio de lista.",
    tipo: "descuento",
    porcentaje: 8,
    condicion: "Compra mínima 200 cajas en una sola orden",
    vigencia_desde: "01-jun-2026",
    vigencia_hasta: "30-jun-2026",
    sku_aplicable: "DDN-REFR-CCMEX-600",
    combinable: false,
    destacada: true,
  },
  {
    id: "PROMO-26-Q2-002",
    titulo: "12+1 GRATIS en cervezas Cuauhtémoc Moctezuma",
    marca: "Cervecería Cuauhtémoc Moctezuma",
    descripcion:
      "Por cada 12 cajas de Cerveza Indio Lager 355ml, una caja adicional sin costo. Cargo de IVA aplica solo a las 12 cajas facturadas.",
    tipo: "bonificacion",
    bonificacion: "1 caja gratis",
    condicion: "Compra de 12 cajas. Acumulable hasta 60+5.",
    vigencia_desde: "15-may-2026",
    vigencia_hasta: "15-jul-2026",
    sku_aplicable: "DDN-CERV-INDIO-355",
    combinable: true,
  },
  {
    id: "PROMO-26-Q2-003",
    titulo: "Rebate 5% anual en Sabritas (PepsiCo)",
    marca: "Sabritas (PepsiCo)",
    descripcion:
      "Rebate trimestral sobre volumen acumulado de compras de SKUs Sabritas. Pagadero el primer día hábil del trimestre siguiente.",
    tipo: "rebate",
    porcentaje: 5,
    condicion: "Compra ≥ $80,000 trimestrales en SKUs Sabritas",
    vigencia_desde: "01-abr-2026",
    vigencia_hasta: "31-dic-2026",
    sku_aplicable: "DDN-BOT-SABORI-170 + variantes",
    combinable: true,
  },
  {
    id: "PROMO-26-Q2-004",
    titulo: "Muestra Café Nescafé Clásico 25g (gratis)",
    marca: "Nescafé (Nestlé)",
    descripcion:
      "Por cada caja de Nescafé Clásico 100g comprada, 4 sobres de muestra 25g para entregar al consumidor final. Material promocional incluido.",
    tipo: "muestra",
    bonificacion: "4 sobres muestra 25g",
    condicion: "1 caja Nescafé Clásico 100g",
    vigencia_desde: "01-jun-2026",
    vigencia_hasta: "31-jul-2026",
    sku_aplicable: "DDN-CAF-NESCLA-100",
    combinable: true,
  },
  {
    id: "PROMO-26-Q2-005",
    titulo: "-12% Tequila José Cuervo Especial Reposado",
    marca: "Casa Cuervo",
    descripcion:
      "Descuento por temporada en presentación 750ml. Aplica para licencias activas únicamente. No combinable con descuento por pronto pago.",
    tipo: "descuento",
    porcentaje: 12,
    condicion: "Pedido mínimo 24 botellas. Solo licencias vigentes.",
    vigencia_desde: "10-jun-2026",
    vigencia_hasta: "10-jul-2026",
    sku_aplicable: "DDN-TEQ-CUERREP-750",
    combinable: false,
  },
  {
    id: "PROMO-26-Q2-006",
    titulo: "Galletas Marías Gamesa — 2x1 en Caja 6pz",
    marca: "Gamesa (PepsiCo)",
    descripcion:
      "Promoción temporal por liquidación de lote L-2026-0410-GM. Compra una caja y recibe una segunda sin costo. Hasta agotar existencias.",
    tipo: "bonificacion",
    bonificacion: "1 caja gratis",
    condicion: "1 caja por cliente. Hasta agotar inventario.",
    vigencia_desde: "08-jun-2026",
    vigencia_hasta: "20-jun-2026",
    sku_aplicable: "DDN-GLT-MARGAM-6PZ",
    combinable: false,
  },
];

export default function PromocionesPage() {
  const destacadas = PROMOS.filter((p) => p.destacada);
  const resto = PROMOS.filter((p) => !p.destacada);

  return (
    <div className="px-6 py-5 max-w-7xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <div className="text-[11px] text-vendor-gray font-mono">
        <Link href="/" className="hover:underline">
          Inicio
        </Link>{" "}
        / Promociones
      </div>

      <div className="flex items-end justify-between border-b border-vendor-border pb-3">
        <div>
          <h1 className="text-xl font-semibold text-vendor-green">
            Promociones activas · junio 2026
          </h1>
          <p className="text-xs text-vendor-gray mt-0.5">
            {PROMOS.length} ofertas vigentes · Para aplicar, captura el código
            de promoción en{" "}
            <Link
              href="/pedidos/nuevo"
              className="text-vendor-green hover:underline"
            >
              Nuevo pedido
            </Link>{" "}
            o avisa a tu ejecutivo.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <select className="border border-vendor-border px-3 py-1 text-xs bg-white">
            <option>Todas las marcas</option>
            <option>Coca-Cola FEMSA</option>
            <option>PepsiCo</option>
            <option>Cervecería Cuauhtémoc Moctezuma</option>
            <option>Nestlé</option>
          </select>
          <select className="border border-vendor-border px-3 py-1 text-xs bg-white">
            <option>Todos los tipos</option>
            <option>Descuento</option>
            <option>Bonificación</option>
            <option>Rebate</option>
            <option>Muestra</option>
          </select>
        </div>
      </div>

      {/* Destacadas */}
      {destacadas.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-vendor-gray font-semibold mb-2">
            Destacadas del mes
          </p>
          <div className="grid grid-cols-1 gap-3">
            {destacadas.map((p) => (
              <PromoCard key={p.id} promo={p} featured />
            ))}
          </div>
        </div>
      )}

      {/* Resto */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-vendor-gray font-semibold mb-2">
          Todas las ofertas vigentes
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {resto.map((p) => (
            <PromoCard key={p.id} promo={p} />
          ))}
        </div>
      </div>

      {/* Condiciones generales */}
      <div className="bg-vendor-gray-light border border-vendor-border rounded-sm p-4 text-[11px] text-vendor-gray space-y-1">
        <p className="font-semibold text-vendor-green mb-1">
          Condiciones generales aplicables
        </p>
        <p>
          • Las promociones aplican únicamente a clientes con cuenta activa y
          línea de crédito vigente.
        </p>
        <p>
          • Las bonificaciones se entregan en el mismo embarque del pedido base.
        </p>
        <p>
          • Rebates trimestrales se calculan sobre facturas pagadas en tiempo.
        </p>
        <p>
          • Distribuidora del Norte se reserva el derecho de modificar o
          cancelar promociones sin previo aviso.
        </p>
        <p>
          • Para aclaraciones contacta a tu ejecutivo de cuenta o llama al{" "}
          <span className="font-mono text-vendor-green">81-8888-1234</span>.
        </p>
      </div>
    </div>
  );
}

function PromoCard({ promo, featured }: { promo: Promo; featured?: boolean }) {
  const tipoLabel = {
    descuento: "Descuento %",
    bonificacion: "Bonificación",
    rebate: "Rebate anual",
    muestra: "Muestra gratis",
  }[promo.tipo];

  const tipoColor = {
    descuento: "bg-vendor-green text-white",
    bonificacion: "bg-blue-600 text-white",
    rebate: "bg-purple-600 text-white",
    muestra: "bg-orange-500 text-white",
  }[promo.tipo];

  return (
    <div
      className={`bg-white border rounded-sm overflow-hidden ${
        featured ? "border-vendor-green border-2" : "border-vendor-border"
      }`}
    >
      <div className={`px-4 py-2 text-[10px] uppercase tracking-wider font-semibold ${tipoColor}`}>
        {tipoLabel} · {promo.id}
      </div>
      <div className="p-4 space-y-2">
        <div>
          <h3 className="font-semibold text-vendor-green leading-tight">
            {promo.titulo}
          </h3>
          <p className="text-[11px] text-vendor-gray mt-0.5">{promo.marca}</p>
        </div>
        <p className="text-xs text-vendor-gray leading-relaxed">
          {promo.descripcion}
        </p>
        <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-vendor-border">
          <div>
            <p className="text-vendor-gray">Condición</p>
            <p className="text-vendor-green font-medium leading-tight">
              {promo.condicion}
            </p>
          </div>
          <div>
            <p className="text-vendor-gray">SKU aplicable</p>
            <p className="text-vendor-green font-mono leading-tight">
              {promo.sku_aplicable}
            </p>
          </div>
          <div>
            <p className="text-vendor-gray">Vigencia</p>
            <p className="text-vendor-green leading-tight">
              {promo.vigencia_desde} → {promo.vigencia_hasta}
            </p>
          </div>
          <div>
            <p className="text-vendor-gray">Combinable</p>
            <p
              className={`leading-tight font-medium ${
                promo.combinable ? "text-vendor-green" : "text-red-700"
              }`}
            >
              {promo.combinable ? "Sí" : "No"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
