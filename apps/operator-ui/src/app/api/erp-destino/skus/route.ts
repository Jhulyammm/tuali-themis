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

const MOCK_SKUS = [
  {
    codigo_interno: "TUL-001",
    denominacion_comercial: "Coca-Cola 600ml PET",
    precio_neto_sin_iva: 12.50,
    proveedor: "Arca Continental",
    capturado_por: "Themis (replay)",
    timestamp: new Date().toISOString(),
  },
  {
    codigo_interno: "TUL-002",
    denominacion_comercial: "Topo Chico Twist Limón 600ml",
    precio_neto_sin_iva: 14.66,
    proveedor: "Arca Continental",
    capturado_por: "Themis (replay)",
    timestamp: new Date().toISOString(),
  },
  {
    codigo_interno: "TUL-003",
    denominacion_comercial: "Powerade Mountain Blast 500ml",
    precio_neto_sin_iva: 18.10,
    proveedor: "Arca Continental",
    capturado_por: "Themis (replay)",
    timestamp: new Date().toISOString(),
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
