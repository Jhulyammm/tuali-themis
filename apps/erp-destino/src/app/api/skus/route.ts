/**
 * POST /api/skus — guardar una captura
 * GET  /api/skus — listar todas las capturas
 *
 * Storage: in-memory (suficiente para el demo).
 * Themis hace POST aquí cuando ejecuta el playbook.
 */

import { NextRequest, NextResponse } from "next/server";
import { addSku, listSkus } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as Record<string, string>;

    // Validación mínima
    if (!data.denominacion_comercial || !data.codigo_interno) {
      return NextResponse.json(
        { error: "denominacion_comercial y codigo_interno son requeridos" },
        { status: 400 },
      );
    }

    const record = await addSku(data);
    return NextResponse.json({ ok: true, record });
  } catch (err) {
    console.error("[/api/skus] POST", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to save" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const skus = await listSkus();
  return NextResponse.json({ skus });
}
