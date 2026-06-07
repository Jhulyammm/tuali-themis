/**
 * POST /api/browser/infer-mappings — Claude infiere mappings desde los
 * snapshots que el CLIENTE envía en el body.
 *
 * STATELESS: el cliente acumula snapshots en su React state y los manda en
 * cada llamada. Esto se rompe en serverless si dependemos de memoria server.
 *
 * Body: { snapshots: BrowserSnapshot[] }
 * Returns: { mappings: Mapping[], count, cached?, rate_limited? }
 */

import { NextRequest, NextResponse } from "next/server";
import type { BrowserSnapshot } from "@hack4her/agent/browser";
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
export const maxDuration = 30;

interface CacheEntry {
  fingerprint: string;
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

/**
 * Fingerprint barato basado en URLs + field count.
 * Si dos llamadas tienen el mismo fingerprint, no rehacer la inferencia.
 */
function fingerprintOf(snapshots: BrowserSnapshot[]): string {
  return snapshots
    .map((s) => `${s.url}|${Object.keys(s.field_values).length}`)
    .join("::");
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(`infer:${ip}`, 30, 60_000)) {
    return tooManyRequests("Demasiadas inferencias. Espera unos segundos.");
  }

  let body: { snapshots?: BrowserSnapshot[] };
  try {
    body = (await request.json()) as { snapshots?: BrowserSnapshot[] };
  } catch {
    return badRequest("Invalid JSON");
  }

  const snapshots = Array.isArray(body.snapshots) ? body.snapshots : [];
  if (snapshots.length < 2) {
    return NextResponse.json({
      mappings: [],
      count: 0,
      snapshots: snapshots.length,
      cached: false,
    });
  }

  // Cap defensivo — si el cliente manda 1000 snapshots, ignoramos
  if (snapshots.length > 50) snapshots.splice(0, snapshots.length - 50);

  const fingerprint = fingerprintOf(snapshots);
  const cacheKey = `${ip}::${fingerprint.slice(0, 200)}`;
  const cached = cache().get(cacheKey);
  if (cached && cached.fingerprint === fingerprint) {
    return NextResponse.json({
      mappings: cached.mappings,
      count: cached.mappings.length,
      snapshots: snapshots.length,
      cached: true,
      computed_at: cached.computedAt,
    });
  }

  try {
    const partials = await inferPartialMappings(snapshots);
    const mappings = partials.map(partialToMapping);

    cache().set(cacheKey, {
      fingerprint,
      mappings,
      computedAt: Date.now(),
    });

    return NextResponse.json({
      mappings,
      count: mappings.length,
      snapshots: snapshots.length,
      cached: false,
    });
  } catch (err) {
    const msg = (err as Error).message ?? "";
    if (msg.includes("429") || msg.includes("rate_limit")) {
      if (cached) {
        return NextResponse.json({
          mappings: cached.mappings,
          count: cached.mappings.length,
          snapshots: snapshots.length,
          cached: true,
          rate_limited: true,
        });
      }
      return NextResponse.json(
        {
          mappings: [],
          count: 0,
          rate_limited: true,
          snapshots: snapshots.length,
        },
        { status: 200 },
      );
    }
    console.error("[/api/browser/infer-mappings]", err);
    return NextResponse.json(sanitizedError(err, "Inference failed"), {
      status: 500,
    });
  }
}
