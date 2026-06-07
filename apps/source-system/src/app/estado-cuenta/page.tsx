/**
 * /estado-cuenta — facturas, pagos, saldos, líneas de crédito.
 *
 * Convertida de "no disponible" a página funcional para que el portal se
 * sienta completo y creíble en el demo.
 */

import Link from "next/link";

const FACTURAS = [
  {
    folio: "F-26-15482",
    fecha: "10-jun-2026",
    pedido: "P-2026-0612",
    importe: 42180.0,
    iva: 6748.8,
    total: 48928.8,
    estado: "Pendiente pago",
    vencimiento: "10-jul-2026",
  },
  {
    folio: "F-26-15301",
    fecha: "02-jun-2026",
    pedido: "P-2026-0598",
    importe: 87320.5,
    iva: 13971.28,
    total: 101291.78,
    estado: "Pagada",
    vencimiento: "02-jul-2026",
  },
  {
    folio: "F-26-15184",
    fecha: "24-may-2026",
    pedido: "P-2026-0571",
    importe: 32450.0,
    iva: 5192.0,
    total: 37642.0,
    estado: "Pagada",
    vencimiento: "24-jun-2026",
  },
  {
    folio: "F-26-15042",
    fecha: "15-may-2026",
    pedido: "P-2026-0552",
    importe: 198400.0,
    iva: 31744.0,
    total: 230144.0,
    estado: "Vencida",
    vencimiento: "15-jun-2026",
  },
  {
    folio: "F-26-14918",
    fecha: "05-may-2026",
    pedido: "P-2026-0529",
    importe: 64210.0,
    iva: 10273.6,
    total: 74483.6,
    estado: "Pagada",
    vencimiento: "05-jun-2026",
  },
];

const PAGOS = [
  {
    fecha: "08-jun-2026",
    referencia: "884215",
    metodo: "SPEI",
    importe: 98500.0,
    aplicado: "F-26-15184 + parcial F-26-15042",
  },
  {
    fecha: "01-jun-2026",
    referencia: "884189",
    metodo: "SPEI",
    importe: 75000.0,
    aplicado: "F-26-14918",
  },
  {
    fecha: "20-may-2026",
    referencia: "884104",
    metodo: "Cheque",
    importe: 50000.0,
    aplicado: "Parcial F-26-15042",
  },
];

export default function EstadoCuentaPage() {
  const totalPendiente = FACTURAS.filter(
    (f) => f.estado !== "Pagada",
  ).reduce((s, f) => s + f.total, 0);
  const totalVencido = FACTURAS.filter((f) => f.estado === "Vencida").reduce(
    (s, f) => s + f.total,
    0,
  );

  return (
    <div className="px-6 py-5 max-w-7xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <div className="text-[11px] text-vendor-gray font-mono">
        <Link href="/" className="hover:underline">
          Inicio
        </Link>{" "}
        / Estado de cuenta
      </div>

      <div className="flex items-end justify-between border-b border-vendor-border pb-3">
        <div>
          <h1 className="text-xl font-semibold text-vendor-green">
            Estado de cuenta · ciclo 2026
          </h1>
          <p className="text-xs text-vendor-gray mt-0.5">
            Cliente: <span className="font-mono">OXXO-TEC-MTY-08841</span> ·
            Ejecutivo: Luis Mendoza · Plazo: neto 30 días · Línea de crédito
            autorizada: $500,000.00
          </p>
        </div>
        <button className="bg-vendor-green text-white px-4 py-2 text-xs hover:bg-vendor-green-hover">
          Descargar PDF
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <SummaryCard
          label="Saldo total pendiente"
          value={`$${totalPendiente.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`}
          tone={totalVencido > 0 ? "red" : "green"}
          sub={`${FACTURAS.filter((f) => f.estado !== "Pagada").length} facturas activas`}
        />
        <SummaryCard
          label="Importe vencido"
          value={`$${totalVencido.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`}
          tone={totalVencido > 0 ? "red" : "green"}
          sub={totalVencido > 0 ? "Requiere atención" : "Sin atrasos"}
        />
        <SummaryCard
          label="Línea disponible"
          value="$317,550.00"
          tone="green"
          sub="63.5% del límite autorizado"
        />
        <SummaryCard
          label="Próximo corte"
          value="15-jun"
          tone="yellow"
          sub="Corte automatizado al cierre"
        />
      </div>

      {/* Facturas */}
      <div className="bg-white border border-vendor-border rounded-sm">
        <div className="px-4 py-2.5 border-b border-vendor-border bg-vendor-gray-light flex items-center justify-between">
          <p className="text-xs font-semibold text-vendor-green uppercase tracking-wide">
            Facturas
          </p>
          <div className="flex items-center gap-2 text-[11px]">
            <button className="text-vendor-green hover:underline">Todas</button>
            <span className="text-vendor-gray">·</span>
            <button className="text-vendor-gray hover:text-vendor-green">
              Pendientes
            </button>
            <span className="text-vendor-gray">·</span>
            <button className="text-vendor-gray hover:text-vendor-green">
              Vencidas
            </button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Folio</th>
              <th>Fecha</th>
              <th>Pedido</th>
              <th className="text-right">Subtotal</th>
              <th className="text-right">IVA 16%</th>
              <th className="text-right">Total</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {FACTURAS.map((f) => (
              <tr key={f.folio}>
                <td className="font-mono text-vendor-green">{f.folio}</td>
                <td className="text-vendor-gray">{f.fecha}</td>
                <td className="font-mono text-[11px] text-vendor-gray">
                  {f.pedido}
                </td>
                <td className="text-right font-mono">
                  ${f.importe.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </td>
                <td className="text-right font-mono text-vendor-gray">
                  ${f.iva.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </td>
                <td className="text-right font-mono font-semibold">
                  ${f.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </td>
                <td className="text-vendor-gray font-mono text-[11px]">
                  {f.vencimiento}
                </td>
                <td>
                  <EstadoBadge estado={f.estado} />
                </td>
                <td className="text-right">
                  <button className="text-[11px] text-vendor-green hover:underline">
                    descargar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-vendor-border rounded-sm">
          <div className="px-4 py-2.5 border-b border-vendor-border bg-vendor-gray-light">
            <p className="text-xs font-semibold text-vendor-green uppercase tracking-wide">
              Pagos recientes
            </p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Referencia</th>
                <th>Método</th>
                <th className="text-right">Importe</th>
              </tr>
            </thead>
            <tbody>
              {PAGOS.map((p) => (
                <tr key={p.referencia}>
                  <td className="text-vendor-gray">{p.fecha}</td>
                  <td className="font-mono text-vendor-green">{p.referencia}</td>
                  <td>{p.metodo}</td>
                  <td className="text-right font-mono">
                    ${p.importe.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 text-[11px] text-vendor-gray border-t border-vendor-border">
            Para registrar un nuevo pago envía comprobante a{" "}
            <span className="font-mono text-vendor-green">cobranza@ddn.mx</span>{" "}
            con tu folio de pedido.
          </div>
        </div>

        {/* Datos bancarios */}
        <div className="bg-white border border-vendor-border rounded-sm">
          <div className="px-4 py-2.5 border-b border-vendor-border bg-vendor-gray-light">
            <p className="text-xs font-semibold text-vendor-green uppercase tracking-wide">
              Datos para pago
            </p>
          </div>
          <div className="p-4 space-y-2 text-xs">
            <BankRow label="Razón social" value="Distribuidora del Norte SA de CV" />
            <BankRow label="RFC" value="DNN960531ABC" />
            <BankRow label="Banco" value="BBVA México" />
            <BankRow label="CLABE" value="012 320 00478215632 3" mono />
            <BankRow label="Cuenta" value="0047821563" mono />
            <BankRow label="Convenio CIE" value="847123" mono />
            <div className="mt-3 pt-3 border-t border-vendor-border text-[11px] text-vendor-gray">
              <strong className="text-vendor-green">Importante:</strong>{" "}
              incluye SIEMPRE el número de pedido o folio de factura en la
              referencia del SPEI. Pagos sin referencia tardan hasta 5 días
              hábiles en aplicarse.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: string;
  tone: "green" | "yellow" | "red";
  sub: string;
}) {
  const accent =
    tone === "green"
      ? "border-l-vendor-green text-vendor-green"
      : tone === "yellow"
        ? "border-l-yellow-500 text-yellow-700"
        : "border-l-red-500 text-red-700";
  return (
    <div
      className={`bg-white border border-vendor-border border-l-4 ${accent.split(" ")[0]} px-4 py-3 rounded-sm`}
    >
      <p className="text-[10px] uppercase tracking-wider text-vendor-gray font-semibold">
        {label}
      </p>
      <p className={`text-xl font-bold font-mono mt-1 ${accent.split(" ")[1]}`}>
        {value}
      </p>
      <p className="text-[11px] text-vendor-gray mt-1">{sub}</p>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const style =
    estado === "Pagada"
      ? "bg-vendor-green-light text-vendor-green"
      : estado === "Vencida"
        ? "bg-red-50 text-red-700"
        : "bg-yellow-50 text-yellow-800";
  return (
    <span className={`inline-block px-2 py-0.5 text-[10px] rounded-sm ${style}`}>
      {estado}
    </span>
  );
}

function BankRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-vendor-gray">{label}</span>
      <span
        className={`text-right text-vendor-green ${mono ? "font-mono" : "font-medium"}`}
      >
        {value}
      </span>
    </div>
  );
}
