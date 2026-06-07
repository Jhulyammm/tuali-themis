/**
 * POST /api/recall — Cross-cliente recall ("Ya vi esto antes")
 *
 * Antes de arrancar una observación, el frontend manda la URL y opcionalmente
 * el destination URL. El backend revisa Capa 4 (MongoDB / filesystem) y
 * devuelve mappings previos que matchearon dominio.
 *
 * WOW del demo: el jurado pasa una URL nueva, Themis responde "ya aprendí esto
 * en otra tienda — propongo estos 8 mapeos como base". Demuestra que la
 * memoria persiste entre clientes y NO arranca de cero.
 *
 * Body: { sourceUrl: string, destinationUrl?: string }
 * Returns: { found, suggestions: [{ playbook_id, playbook_name, mappings, created_at }] }
 */

import { NextRequest, NextResponse } from "next/server";
import { listSavedPlaybooks } from "@hack4her/db";
import type { Mapping } from "@hack4her/playbooks";
import {
  badRequest,
  rateLimit,
  getClientIp,
  tooManyRequests,
  sanitizedError,
} from "@/lib/security";

export const runtime = "nodejs";

interface RecallBody {
  sourceUrl: string;
  destinationUrl?: string;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(`recall:${ip}`, 30, 60_000)) {
    return tooManyRequests("Demasiados recalls.");
  }

  let body: RecallBody;
  try {
    body = (await request.json()) as RecallBody;
  } catch {
    return badRequest("Invalid JSON");
  }

  if (!body.sourceUrl || typeof body.sourceUrl !== "string") {
    return badRequest("'sourceUrl' es requerido");
  }

  const sourceHost = hostnameOf(body.sourceUrl);
  const destHost = body.destinationUrl ? hostnameOf(body.destinationUrl) : null;

  try {
    const all = await listSavedPlaybooks();

    interface Suggestion {
      playbook_id: string;
      playbook_name: string;
      source_url: string;
      destination_url: string;
      mappings: Mapping[];
      mapping_count: number;
      created_at: string;
      match_strength: number;
    }

    const suggestions: Suggestion[] = [];
    for (const pb of all) {
      const pbSourceHost = hostnameOf(pb.source_url ?? "");
      const pbDestHost = hostnameOf(pb.destination_url ?? "");
      if (!pbSourceHost) continue;

      let strength = 0;
      if (pbSourceHost === sourceHost) strength += 2;
      else if (pbSourceHost.endsWith(rootDomain(sourceHost))) strength += 1;

      if (destHost) {
        if (pbDestHost === destHost) strength += 2;
        else if (pbDestHost.endsWith(rootDomain(destHost))) strength += 1;
      }

      if (strength >= 1 && (pb.mappings?.length ?? 0) > 0) {
        suggestions.push({
          playbook_id: pb.id,
          playbook_name: pb.name,
          source_url: pb.source_url ?? "",
          destination_url: pb.destination_url ?? "",
          mappings: pb.mappings ?? [],
          mapping_count: pb.mappings?.length ?? 0,
          created_at: pb.created_at,
          match_strength: strength,
        });
      }
    }

    suggestions.sort((a, b) => {
      if (b.match_strength !== a.match_strength) {
        return b.match_strength - a.match_strength;
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return NextResponse.json({
      found: suggestions.length > 0,
      suggestions: suggestions.slice(0, 3),
    });
  } catch (err) {
    console.error("[/api/recall]", err);
    return NextResponse.json(sanitizedError(err, "Recall failed"), {
      status: 500,
    });
  }
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

// TLDs compuestos comunes — necesitan 3 partes para el dominio raíz real.
// Sin esta lista, `mercadolibre.com.mx` matchearía con `amazon.com.mx` por
// compartir solo `com.mx` y daría falsos positivos en el recall.
const COMPOUND_TLDS = new Set([
  "com.mx", "com.ar", "com.br", "com.co", "com.pe", "com.ve",
  "co.uk", "co.in", "co.jp", "co.kr",
  "com.au", "net.au", "org.au",
  "com.es", "es.com",
]);

function rootDomain(host: string): string {
  const parts = host.split(".");
  if (parts.length <= 2) return host;
  const lastTwo = parts.slice(-2).join(".");
  if (COMPOUND_TLDS.has(lastTwo) && parts.length >= 3) {
    return parts.slice(-3).join(".");
  }
  return lastTwo;
}
