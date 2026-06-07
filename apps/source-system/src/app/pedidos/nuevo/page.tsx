"use client";

/**
 * Wizard de nuevo pedido — flujo multi-step que simula proceso real.
 * Esto es lo que Themis va a OBSERVAR + APRENDER durante /teach:
 *
 *   Paso 1: Cliente destinatario (nombre, RFC, dirección)
 *   Paso 2: Productos (selección + cantidades)
 *   Paso 3: Logística (CD, ruta, fecha)
 *   Paso 4: Confirmación + guardar
 *
 * Para el demo, este flujo genera ~5-8 snapshots distintos con campos no-obvios.
 * Claude infiere mappings a medida que el usuario llena cada paso.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATALOG } from "@/data/catalog";

interface NewLine {
  sku_proveedor: string;
  cantidad_solicitada: number;
}

export default function NuevoPedidoPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Paso 1
  const [cliente, setCliente] = useState("OXXO Tec Sur");
  const [rfc, setRfc] = useState("CTV051028N42");
  const [direccion, setDireccion] = useState(
    "Av. Eugenio Garza Sada 2501, Tecnológico, 64849 Monterrey, NL",
  );

  // Paso 2
  const [lineas, setLineas] = useState<NewLine[]>([
    { sku_proveedor: "DDN-CERV-INDIO-355", cantidad_solicitada: 24 },
  ]);

  // Paso 3
  const [cd, setCd] = useState("CD Monterrey-Norte");
  const [ruta, setRuta] = useState("Ruta NL-08 · Lunes/Miércoles");
  const [fecha, setFecha] = useState("2026-06-08");
  const [observaciones, setObservaciones] = useState("");

  const totals = (() => {
    const total_bruto = lineas.reduce((sum, l) => {
      const p = CATALOG.find((c) => c.sku_proveedor === l.sku_proveedor);
      return sum + (p ? p.precio_lista * l.cantidad_solicitada : 0);
    }, 0);
    const iva_16pct = +(total_bruto * 0.16 / 1.16).toFixed(2);
    const total_neto = +(total_bruto - iva_16pct).toFixed(2);
    return { total_bruto: +total_bruto.toFixed(2), iva_16pct, total_neto };
  })();

  const handleSubmit = async () => {
    const body = {
      cliente_destinatario: cliente,
      rfc_destinatario: rfc,
      direccion_entrega: direccion,
      lineas: lineas.map((l) => {
        const p = CATALOG.find((c) => c.sku_proveedor === l.sku_proveedor)!;
        return {
          sku_proveedor: l.sku_proveedor,
          cantidad_solicitada: l.cantidad_solicitada,
          precio_lista: p.precio_lista,
          subtotal: +(p.precio_lista * l.cantidad_solicitada).toFixed(2),
        };
      }),
      centro_distribucion: cd,
      ruta_entrega: ruta,
      fecha_solicitud: fecha,
      observaciones,
      ...totals,
    };

    const res = await fetch("/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const { pedido } = (await res.json()) as { pedido: { id: string } };
      router.push(`/pedidos/${pedido.id}`);
    }
  };

  return (
    <div className="px-6 py-5 max-w-5xl mx-auto">
      <div className="flex items-end justify-between mb-4 border-b border-vendor-border pb-3">
        <div>
          <h1 className="text-xl font-semibold text-vendor-green">
            Nuevo pedido
          </h1>
          <p className="text-xs text-vendor-gray mt-0.5">
            Paso {step} de 4 ·{" "}
            {step === 1
              ? "Datos del cliente"
              : step === 2
                ? "Productos"
                : step === 3
                  ? "Logística"
                  : "Confirmación"}
          </p>
        </div>
        <a
          href="/pedidos"
          className="text-xs text-vendor-gray hover:text-vendor-green hover:underline"
        >
          ← Cancelar
        </a>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-6 text-[11px]">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`flex-1 h-1 rounded-sm ${
              n <= step ? "bg-vendor-green" : "bg-vendor-gray-light"
            }`}
          />
        ))}
      </div>

      <div className="border border-vendor-border bg-white p-5 space-y-4">
        {step === 1 && (
          <Step1
            cliente={cliente}
            setCliente={setCliente}
            rfc={rfc}
            setRfc={setRfc}
            direccion={direccion}
            setDireccion={setDireccion}
          />
        )}
        {step === 2 && (
          <Step2 lineas={lineas} setLineas={setLineas} totals={totals} />
        )}
        {step === 3 && (
          <Step3
            cd={cd}
            setCd={setCd}
            ruta={ruta}
            setRuta={setRuta}
            fecha={fecha}
            setFecha={setFecha}
            observaciones={observaciones}
            setObservaciones={setObservaciones}
          />
        )}
        {step === 4 && (
          <Step4
            cliente={cliente}
            rfc={rfc}
            direccion={direccion}
            lineas={lineas}
            cd={cd}
            ruta={ruta}
            fecha={fecha}
            observaciones={observaciones}
            totals={totals}
          />
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
          disabled={step === 1}
          className="text-xs px-4 py-2 border border-vendor-border text-vendor-gray hover:bg-vendor-gray-light disabled:opacity-30"
        >
          ← Anterior
        </button>
        {step < 4 ? (
          <button
            onClick={() => setStep((s) => (s + 1) as 2 | 3 | 4)}
            className="text-xs px-4 py-2 bg-vendor-green text-white hover:bg-vendor-green-hover"
          >
            Siguiente →
          </button>
        ) : (
          <button
            onClick={() => void handleSubmit()}
            className="text-xs px-4 py-2 bg-vendor-green text-white hover:bg-vendor-green-hover"
          >
            ✓ Guardar pedido
          </button>
        )}
      </div>
    </div>
  );
}

function Step1({
  cliente,
  setCliente,
  rfc,
  setRfc,
  direccion,
  setDireccion,
}: {
  cliente: string;
  setCliente: (v: string) => void;
  rfc: string;
  setRfc: (v: string) => void;
  direccion: string;
  setDireccion: (v: string) => void;
}) {
  return (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-vendor-green mb-2">
        Datos del cliente destinatario
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label>Cliente destinatario</label>
          <input
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <label>RFC destinatario</label>
          <input
            value={rfc}
            onChange={(e) => setRfc(e.target.value)}
            className="w-full font-mono"
          />
        </div>
        <div className="col-span-2">
          <label>Dirección de entrega</label>
          <input
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            className="w-full"
          />
        </div>
      </div>
    </>
  );
}

function Step2({
  lineas,
  setLineas,
  totals,
}: {
  lineas: NewLine[];
  setLineas: (l: NewLine[]) => void;
  totals: { total_bruto: number; iva_16pct: number; total_neto: number };
}) {
  const addLine = () => {
    setLineas([
      ...lineas,
      { sku_proveedor: CATALOG[0].sku_proveedor, cantidad_solicitada: 12 },
    ]);
  };
  const removeLine = (i: number) =>
    setLineas(lineas.filter((_, idx) => idx !== i));

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-vendor-green">
          Líneas del pedido
        </p>
        <button
          onClick={addLine}
          className="text-xs px-3 py-1 border border-vendor-green text-vendor-green hover:bg-vendor-green-light"
        >
          + Agregar línea
        </button>
      </div>

      <table className="text-xs">
        <thead>
          <tr>
            <th>SKU proveedor</th>
            <th className="text-right">Cantidad solicitada</th>
            <th className="text-right">Precio lista</th>
            <th className="text-right">Subtotal</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {lineas.map((l, i) => {
            const p = CATALOG.find((c) => c.sku_proveedor === l.sku_proveedor);
            const subtotal = p ? p.precio_lista * l.cantidad_solicitada : 0;
            return (
              <tr key={i}>
                <td>
                  <select
                    value={l.sku_proveedor}
                    onChange={(e) =>
                      setLineas(
                        lineas.map((x, idx) =>
                          idx === i
                            ? { ...x, sku_proveedor: e.target.value }
                            : x,
                        ),
                      )
                    }
                    className="w-full font-mono"
                  >
                    {CATALOG.map((c) => (
                      <option key={c.id} value={c.sku_proveedor}>
                        {c.sku_proveedor} · {c.producto.slice(0, 35)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="text-right">
                  <input
                    type="number"
                    value={l.cantidad_solicitada}
                    onChange={(e) =>
                      setLineas(
                        lineas.map((x, idx) =>
                          idx === i
                            ? { ...x, cantidad_solicitada: +e.target.value }
                            : x,
                        ),
                      )
                    }
                    className="w-20 text-right font-mono"
                    min={1}
                  />
                </td>
                <td className="text-right font-mono">
                  ${p?.precio_lista.toFixed(2) ?? "0.00"}
                </td>
                <td className="text-right font-mono">${subtotal.toFixed(2)}</td>
                <td>
                  <button
                    onClick={() => removeLine(i)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="border-t border-vendor-border pt-3 grid grid-cols-3 gap-3 text-xs">
        <div className="text-right">
          <p className="text-vendor-gray uppercase">Total bruto</p>
          <p className="font-mono font-semibold">${totals.total_bruto.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="text-vendor-gray uppercase">IVA 16%</p>
          <p className="font-mono font-semibold">${totals.iva_16pct.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="text-vendor-gray uppercase">Total neto sin IVA</p>
          <p className="font-mono font-semibold text-vendor-green">
            ${totals.total_neto.toFixed(2)}
          </p>
        </div>
      </div>
    </>
  );
}

function Step3({
  cd,
  setCd,
  ruta,
  setRuta,
  fecha,
  setFecha,
  observaciones,
  setObservaciones,
}: {
  cd: string;
  setCd: (v: string) => void;
  ruta: string;
  setRuta: (v: string) => void;
  fecha: string;
  setFecha: (v: string) => void;
  observaciones: string;
  setObservaciones: (v: string) => void;
}) {
  return (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-vendor-green mb-2">
        Logística de entrega
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label>Centro de distribución</label>
          <select
            value={cd}
            onChange={(e) => setCd(e.target.value)}
            className="w-full"
          >
            <option>CD Monterrey-Norte</option>
            <option>CD Monterrey-Sur</option>
            <option>CD Saltillo</option>
            <option>CD Guadalajara-Norte</option>
          </select>
        </div>
        <div>
          <label>Ruta de entrega</label>
          <select
            value={ruta}
            onChange={(e) => setRuta(e.target.value)}
            className="w-full"
          >
            <option>Ruta NL-08 · Lunes/Miércoles</option>
            <option>Ruta NL-12 · Martes/Jueves</option>
            <option>Ruta NL-15 · Viernes</option>
          </select>
        </div>
        <div>
          <label>Fecha solicitud entrega</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full font-mono"
          />
        </div>
        <div>
          <label>Régimen fiscal</label>
          <input
            value="601 · Régimen General Ley de Personas Morales"
            disabled
            className="w-full font-mono opacity-70"
          />
        </div>
        <div className="col-span-2">
          <label>Observaciones de entrega</label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Horarios, accesos, contacto..."
            className="w-full"
            rows={3}
          />
        </div>
      </div>
    </>
  );
}

function Step4({
  cliente,
  rfc,
  direccion,
  lineas,
  cd,
  ruta,
  fecha,
  observaciones,
  totals,
}: {
  cliente: string;
  rfc: string;
  direccion: string;
  lineas: NewLine[];
  cd: string;
  ruta: string;
  fecha: string;
  observaciones: string;
  totals: { total_bruto: number; iva_16pct: number; total_neto: number };
}) {
  return (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-vendor-green mb-3">
        Confirmación
      </p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Field label="Cliente destinatario" value={cliente} />
        <Field label="RFC destinatario" value={rfc} mono />
        <Field label="Dirección entrega" value={direccion} wide />
        <Field label="Centro distribución" value={cd} />
        <Field label="Ruta entrega" value={ruta} />
        <Field label="Fecha entrega" value={fecha} mono />
        <Field
          label="Total neto sin IVA"
          value={`$${totals.total_neto.toFixed(2)} MXN`}
          mono
          wide
        />
      </div>
      <div className="mt-3 pt-3 border-t border-vendor-border text-xs">
        <p className="font-semibold text-vendor-green mb-1">
          {lineas.length} líneas
        </p>
        <ul className="text-vendor-gray font-mono space-y-0.5">
          {lineas.map((l, i) => (
            <li key={i}>
              {l.sku_proveedor} × {l.cantidad_solicitada}
            </li>
          ))}
        </ul>
      </div>
      {observaciones && (
        <p className="mt-3 text-xs text-vendor-gray italic">
          &ldquo;{observaciones}&rdquo;
        </p>
      )}
    </>
  );
}

function Field({
  label,
  value,
  mono = false,
  wide = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <p className="text-[11px] uppercase font-semibold text-vendor-gray tracking-wider">
        {label}
      </p>
      <p className={mono ? "font-mono" : ""}>{value}</p>
    </div>
  );
}
