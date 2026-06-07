/**
 * POST /api/skus — guardar una captura
 * GET  /api/skus — listar todas las capturas
 *
 * Storage: in-memory (suficiente para el demo).
 * Themis hace POST aquí cuando ejecuta el playbook.
 *
 * Seguridad:
 *  - rate limit per-IP (in-memory)
 *  - body size cap + field length caps (anti-pollution, anti-XSS storage)
 *  - errors sanitized
 */

import { NextRequest, NextResponse } from "next/server";
import { addSku, listSkus } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 32 * 1024;
const MAX_FIELD_LEN = 500;
const MAX_FIELDS = 30;

interface RateRec {
  count: number;
  resetAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __erp_skus_rate: Map<string, RateRec> | undefined;
}

function rateLimit(key: string, max: number, windowMs: number): boolean {
  if (!globalThis.__erp_skus_rate) globalThis.__erp_skus_rate = new Map();
  const store = globalThis.__erp_skus_rate;
  const now = Date.now();
  const rec = store.get(key);
  if (!rec || rec.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (rec.count >= max) return false;
  rec.count++;
  return true;
}

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xri = req.headers.get("x-real-ip");
  if (xri) return xri.trim();
  return "unknown";
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(`skus:${ip}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "Demasiados guardados, esperá 1 minuto" },
      { status: 429 },
    );
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json({ error: "Bad body" }, { status: 400 });
  }
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: `Body max ${MAX_BODY_BYTES} bytes` },
      { status: 413 },
    );
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return NextResponse.json(
      { error: "Body debe ser objeto plano" },
      { status: 400 },
    );
  }

  const keys = Object.keys(data);
  if (keys.length > MAX_FIELDS) {
    return NextResponse.json(
      { error: `Max ${MAX_FIELDS} campos por SKU` },
      { status: 400 },
    );
  }

  const clean: Record<string, string> = {};
  for (const k of keys) {
    const v = data[k];
    if (typeof v !== "string") continue;
    if (v.length > MAX_FIELD_LEN) {
      return NextResponse.json(
        { error: `Campo '${k}' max ${MAX_FIELD_LEN} chars` },
        { status: 400 },
      );
    }
    clean[k] = v;
  }

  if (!clean.denominacion_comercial || !clean.codigo_interno) {
    return NextResponse.json(
      { error: "denominacion_comercial y codigo_interno son requeridos" },
      { status: 400 },
    );
  }

  try {
    const record = await addSku(clean);
    return NextResponse.json({ ok: true, record });
  } catch (err) {
    console.error("[/api/skus] POST", err);
    const msg =
      process.env.NODE_ENV === "production"
        ? "Failed to save"
        : ((err as Error).message ?? "Failed to save").slice(0, 200);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const skus = await listSkus();
  return NextResponse.json({ skus });
}
