/**
 * GET /api/browser/infer-mappings?sessionId=X — Claude infiere mappings de
 * los snapshots acumulados hasta ahora.
 *
 * Cacheamos por (sessionId, snapshotCount): si el cliente vuelve a pollear
 * antes de que aparezcan nuevos snapshots, devolvemos el resultado anterior
 * sin volver a llamar a Claude. Esto protege los tokens/min del free tier.
 */

import { NextRequest, NextResponse } from "next/server";
import { getHandle } from "@hack4her/agent/browser";
import {
  inferPartialMappings,
  partialToMapping,
} from "@hack4her/agent/playbook/live";
import {
  rateLimit,
  getClientIp,
  badRequest,
  tooManyRequests,
  sanitizedError,
} from "@/lib/security";
import type { Mapping } from "@hack4her/playbooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

interface CacheEntry {
  snapshotCount: number;
  mappings: Mapping[];
  computedAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __themis_infer_cache: Map<string, CacheEntry> | undefined;
}

function cache(): Map<string, CacheEntry> {
  if (!globalThis.__themis_infer_cache) {
    globalThis.__themis_infer_cache = new Map();
  }
  return globalThis.__themis_infer_cache;
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(`infer:${ip}`, 30, 60_000)) {
    return tooManyRequests("Demasiadas inferencias. Esperá unos segundos.");
  }

  const sessionId = request.nextUrl.searchParams.get("sessionId");
  if (!sessionId || !SESSION_ID_PATTERN.test(sessionId)) {
    return badRequest("'sessionId' inválido");
  }

  const handle = getHandle(sessionId);
  if (!handle) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (handle.snapshots.length < 2) {
    return NextResponse.json({
      mappings: [],
      count: 0,
      snapshots: handle.snapshots.length,
      cached: false,
    });
  }

  // CACHE: si snapshot count no cambió desde la última inferencia,
  // devolvemos cache sin tocar Claude.
  const cached = cache().get(sessionId);
  if (cached && cached.snapshotCount === handle.snapshots.length) {
    return NextResponse.json({
      mappings: cached.mappings,
      count: cached.mappings.length,
      snapshots: handle.snapshots.length,
      cached: true,
      computed_at: cached.computedAt,
    });
  }

  try {
    const partials = await inferPartialMappings(handle.snapshots);
    const mappings = partials.map(partialToMapping);

    cache().set(sessionId, {
      snapshotCount: handle.snapshots.length,
      mappings,
      computedAt: Date.now(),
    });

    return NextResponse.json({
      mappings,
      count: mappings.length,
      snapshots: handle.snapshots.length,
      cached: false,
    });
  } catch (err) {
    const msg = (err as Error).message ?? "";
    // Si Anthropic 429, devolvemos el cache previo (si existe) en lugar de 500
    if (msg.includes("429") || msg.includes("rate_limit")) {
      if (cached) {
        return NextResponse.json({
          mappings: cached.mappings,
          count: cached.mappings.length,
          snapshots: handle.snapshots.length,
          cached: true,
          rate_limited: true,
        });
      }
      return NextResponse.json(
        { mappings: [], count: 0, rate_limited: true, snapshots: handle.snapshots.length },
        { status: 200 },
      );
    }
    console.error("[/api/browser/infer-mappings]", err);
    return NextResponse.json(sanitizedError(err, "Inference failed"), {
      status: 500,
    });
  }
}
