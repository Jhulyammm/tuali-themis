/**
 * /captura — el form donde Themis escribe.
 *
 * Sistema B del demo. 11 campos con nombres distintos a los del origen
 * (automationexercise.com) — eso prueba aprendizaje real (no hardcoding).
 *
 * Mapeos no-obvios:
 *   Product Name   → Denominación comercial
 *   Brand          → Fabricante
 *   Price          → Precio neto sin IVA (transformación: /1.16)
 *   Category       → Rubro contable
 *   Availability   → Estado de stock
 *   Condition      → Estado del producto
 */

"use client";

import { useState, useEffect } from "react";

interface SkuRecord {
  denominacion_comercial: string;
  fabricante: string;
  precio_neto_sin_iva: string;
  rubro_contable: string;
  subrubro: string;
  codigo_interno: string;
  estado_de_stock: string;
  estado_del_producto: string;
  regimen_fiscal: string;
  url_de_referencia: string;
  cantidad_sugerida: string;
}

const EMPTY: SkuRecord = {
  denominacion_comercial: "",
  fabricante: "",
  precio_neto_sin_iva: "",
  rubro_contable: "",
  subrubro: "",
  codigo_interno: "",
  estado_de_stock: "Disponible",
  estado_del_producto: "Nuevo",
  regimen_fiscal: "601",
  url_de_referencia: "",
  cantidad_sugerida: "",
};

export default function CapturaPage() {
  const [form, setForm] = useState<SkuRecord>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Auto-genera código interno si está vacío
  useEffect(() => {
    if (!form.codigo_interno) {
      setForm((f) => ({
        ...f,
        codigo_interno: `SKU-${Math.floor(Math.random() * 99999)
          .toString()
          .padStart(5, "0")}`,
      }));
    }
  }, [form.codigo_interno]);

  const setField = <K extends keyof SkuRecord>(key: K, value: SkuRecord[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/skus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Error al guardar");
      }

      setMessage("✅ Captura guardada correctamente");
      setForm({ ...EMPTY, codigo_interno: "" });
    } catch (err) {
      setMessage(`❌ ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-bold text-corp-blue mb-1">Captura de SKU</h1>
      <p className="text-sm text-corp-gray mb-6">
        Captura los datos del producto leídos del portal del cliente.
      </p>

      <form onSubmit={handleSubmit} className="bg-white border border-corp-border p-5 space-y-4">
        <FieldsetSection title="Identificación del producto">
          <FormField label="Denominación comercial" required>
            <input
              type="text"
              value={form.denominacion_comercial}
              onChange={(e) => setField("denominacion_comercial", e.target.value)}
              data-testid="denominacion-input"
              required
            />
          </FormField>
          <FormField label="Fabricante" required>
            <input
              type="text"
              value={form.fabricante}
              onChange={(e) => setField("fabricante", e.target.value)}
              data-testid="fabricante-input"
              required
            />
          </FormField>
          <FormField label="Código interno (autogenerado)">
            <input
              type="text"
              value={form.codigo_interno}
              onChange={(e) => setField("codigo_interno", e.target.value)}
              data-testid="codigo-interno-input"
              className="font-mono text-xs"
              readOnly
            />
          </FormField>
          <FormField label="URL de referencia">
            <input
              type="url"
              value={form.url_de_referencia}
              onChange={(e) => setField("url_de_referencia", e.target.value)}
              data-testid="url-referencia-input"
              placeholder="https://..."
            />
          </FormField>
        </FieldsetSection>

        <FieldsetSection title="Datos comerciales">
          <FormField label="Precio neto sin IVA (MXN)" required>
            <input
              type="number"
              step="0.01"
              value={form.precio_neto_sin_iva}
              onChange={(e) => setField("precio_neto_sin_iva", e.target.value)}
              data-testid="precio-neto-input"
              required
            />
          </FormField>
          <FormField label="Rubro contable" required>
            <select
              value={form.rubro_contable}
              onChange={(e) => setField("rubro_contable", e.target.value)}
              data-testid="rubro-contable-select"
              required
            >
              <option value="">— Seleccionar —</option>
              <option value="Textiles">Textiles</option>
              <option value="Alimentos">Alimentos</option>
              <option value="Bebidas">Bebidas</option>
              <option value="Limpieza">Limpieza</option>
              <option value="Electronica">Electrónica</option>
              <option value="Cuidado-personal">Cuidado personal</option>
            </select>
          </FormField>
          <FormField label="Subrubro">
            <input
              type="text"
              value={form.subrubro}
              onChange={(e) => setField("subrubro", e.target.value)}
              data-testid="subrubro-input"
            />
          </FormField>
          <FormField label="Régimen fiscal">
            <select
              value={form.regimen_fiscal}
              onChange={(e) => setField("regimen_fiscal", e.target.value)}
              data-testid="regimen-fiscal-select"
            >
              <option value="601">601 - General Personas Morales</option>
              <option value="603">603 - Sin fines de lucro</option>
              <option value="612">612 - Personas físicas con act. emp.</option>
            </select>
          </FormField>
        </FieldsetSection>

        <FieldsetSection title="Estado y cantidad">
          <FormField label="Estado de stock">
            <select
              value={form.estado_de_stock}
              onChange={(e) => setField("estado_de_stock", e.target.value)}
              data-testid="estado-stock-select"
            >
              <option value="Disponible">Disponible</option>
              <option value="Agotado">Agotado</option>
              <option value="Por-confirmar">Por confirmar</option>
            </select>
          </FormField>
          <FormField label="Estado del producto">
            <select
              value={form.estado_del_producto}
              onChange={(e) => setField("estado_del_producto", e.target.value)}
              data-testid="estado-producto-select"
            >
              <option value="Nuevo">Nuevo</option>
              <option value="Reacondicionado">Reacondicionado</option>
              <option value="Descontinuado">Descontinuado</option>
            </select>
          </FormField>
          <FormField label="Cantidad sugerida">
            <input
              type="number"
              value={form.cantidad_sugerida}
              onChange={(e) => setField("cantidad_sugerida", e.target.value)}
              data-testid="cantidad-sugerida-input"
            />
          </FormField>
        </FieldsetSection>

        {message && (
          <div
            className={
              message.startsWith("✅")
                ? "bg-green-50 border border-green-200 text-green-800 p-2 text-sm"
                : "bg-red-50 border border-red-200 text-red-800 p-2 text-sm"
            }
          >
            {message}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-corp-border">
          <button
            type="submit"
            disabled={submitting}
            className="bg-corp-blue text-white px-5 py-2 text-sm font-semibold hover:bg-corp-blue-hover disabled:opacity-50"
            data-testid="guardar-button"
          >
            {submitting ? "Guardando..." : "Guardar SKU"}
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...EMPTY, codigo_interno: "" })}
            className="border border-corp-border text-corp-gray px-5 py-2 text-sm hover:bg-corp-gray-light"
          >
            Limpiar
          </button>
        </div>
      </form>
    </div>
  );
}

function FieldsetSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-t border-corp-border pt-3">
      <legend className="text-xs font-bold uppercase tracking-wider text-corp-blue px-2 -ml-2">
        {title}
      </legend>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">{children}</div>
    </fieldset>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label>
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>
      <div className="w-full [&>input]:w-full [&>select]:w-full">{children}</div>
    </div>
  );
}
