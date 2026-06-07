/**
 * GET /api/erp-destino/skus — proxy a erp-destino con mock fallback.
 *
 * Devuelve los SKUs capturados en el ERP Tuali para validación side-by-side
 * en la página /validate. Si la URL del ERP no es alcanzable (típico en
 * prod sin app destino desplegada), devuelve dataset demo coherente con
 * el flujo Themis → ERP Tuali.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ERP_DESTINO_URL =
  process.env.NEXT_PUBLIC_ERP_DESTINO_URL ?? "http://localhost:3001";

// Shape que espera /validate: { id, created_at, data: Record<string,string> }
// Los campos del data matchean los destination_fields del DEMO_PLAYBOOK
// (denominacion_comercial, precio_neto_sin_iva, codigo_interno, etc).
const MOCK_SKUS = [
  {
    id: "sku-mock-001",
    created_at: new Date().toISOString(),
    data: {
      codigo_interno: "TUL-CC-355",
      denominacion_comercial: "Coca-Cola 355ml",
      precio_neto_sin_iva: "12.50",
      proveedor: "ARCA-CONTINENTAL",
      linea_producto: "REFRESCOS",
      presentacion: "355 ML",
      stock_inicial: "240",
    },
  },
  {
    id: "sku-mock-002",
    created_at: new Date(Date.now() - 60_000).toISOString(),
    data: {
      codigo_interno: "TUL-TC-600",
      denominacion_comercial: "Topo Chico Twist Limón 600ml",
      precio_neto_sin_iva: "14.66",
      proveedor: "ARCA-CONTINENTAL",
      linea_producto: "AGUAS MINERALES",
      presentacion: "600 ML",
      stock_inicial: "120",
    },
  },
  {
    id: "sku-mock-003",
    created_at: new Date(Date.now() - 120_000).toISOString(),
    data: {
      codigo_interno: "TUL-PW-500",
      denominacion_comercial: "Powerade Mountain Blast 500ml",
      precio_neto_sin_iva: "18.10",
      proveedor: "ARCA-CONTINENTAL",
      linea_producto: "ISOTONICOS",
      presentacion: "500 ML",
      stock_inicial: "90",
    },
  },
];

export async function GET() {
  try {
    const res = await fetch(`${ERP_DESTINO_URL}/api/skus`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });
    if (!res.ok) {
      return NextResponse.json({ skus: MOCK_SKUS, source: "mock" });
    }
    const data = (await res.json()) as { skus: unknown[] };
    return NextResponse.json({ ...data, source: "live" });
  } catch {
    // ERP no alcanzable — devolvemos mock para que la UI no se rompa.
    return NextResponse.json({ skus: MOCK_SKUS, source: "mock" });
  }
}
