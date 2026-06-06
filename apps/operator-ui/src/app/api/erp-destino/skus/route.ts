/**
 * GET /api/erp-destino/skus — proxy a erp-destino para evitar CORS.
 *
 * Devuelve los SKUs capturados en Sistema B para validación side-by-side
 * en la página /validate.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ERP_DESTINO_URL =
  process.env.NEXT_PUBLIC_ERP_DESTINO_URL ?? "http://localhost:3001";

export async function GET() {
  try {
    const res = await fetch(`${ERP_DESTINO_URL}/api/skus`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `erp-destino respondió ${res.status}` },
        { status: 502 },
      );
    }
    const data = (await res.json()) as { skus: unknown[] };
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      {
        error: `No pude conectar a erp-destino. ¿Está corriendo en ${ERP_DESTINO_URL}?`,
        detail: (err as Error).message,
      },
      { status: 502 },
    );
  }
}
