/**
 * Themis — security helpers para API routes públicas.
 *
 * Demo en Vultr HTTP sin auth → tres mitigaciones:
 *  1. SSRF allowlist (URLs que Stagehand puede abrir)
 *  2. Body size caps (proteger billing de Claude/ElevenLabs/Browserbase)
 *  3. Rate limit en memoria por IP (best-effort, no es production grade)
 *
 * Para producción real: NextAuth + Redis rate-limit + WAF.
 * Acá optimizamos para demo: cero fricción para el jurado, máximo blast-radius
 * limitado si alguien ve el log y empieza a abusar.
 */

import { NextResponse } from "next/server";

// ============================================================
// SSRF allowlist para Browserbase startUrl
// ============================================================

/**
 * Hosts que Stagehand puede abrir. Cualquier URL fuera de esta lista
 * se rechaza con 400, previniendo SSRF a metadata services / internal IPs.
 *
 * Configurable via env var SSRF_ALLOWED_HOSTS (comma-separated).
 * Default razonable: el source-system (env var) + automationexercise como fallback.
 */
export function allowedSourceHosts(): Set<string> {
  const hosts = new Set<string>();

  const fromEnv = process.env.SSRF_ALLOWED_HOSTS;
  if (fromEnv) {
    fromEnv.split(",").forEach((h) => {
      const trimmed = h.trim();
      if (trimmed) hosts.add(trimmed.toLowerCase());
    });
  }

  const sourceUrl = process.env.NEXT_PUBLIC_SOURCE_SYSTEM_URL;
  if (sourceUrl) {
    try {
      hosts.add(new URL(sourceUrl).host.toLowerCase());
    } catch {
      /* ignore */
    }
  }

  const erpUrl = process.env.NEXT_PUBLIC_ERP_DESTINO_URL;
  if (erpUrl) {
    try {
      hosts.add(new URL(erpUrl).host.toLowerCase());
    } catch {
      /* ignore */
    }
  }

  // fallback público conocido — sitio de tests que ya usábamos antes
  hosts.add("automationexercise.com");
  hosts.add("www.automationexercise.com");

  return hosts;
}

/**
 * Bloquea explícitamente IPs internas / metadata services / file:// /
 * private CIDRs. Defensive — incluso si alguien agrega un host raro al
 * allowlist, esto detiene los peores casos.
 */
export function isBlockedHost(host: string): boolean {
  const lower = host.toLowerCase();
  if (lower === "localhost" || lower === "127.0.0.1" || lower === "0.0.0.0") return true;
  if (lower === "169.254.169.254") return true; // cloud metadata (AWS/GCP/Azure)
  if (lower.endsWith(".internal")) return true;
  if (lower.endsWith(".local")) return true;
  if (lower.startsWith("10.")) return true;
  if (lower.startsWith("192.168.")) return true;
  if (lower.startsWith("172.")) {
    const parts = lower.split(".");
    const second = parseInt(parts[1] ?? "0", 10);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

/**
 * Valida un startUrl arbitrario.
 *
 * MODO UNIVERSAL (default): permite cualquier URL pública HTTP/HTTPS que
 * no esté en el blocklist (metadata services, private CIDRs, localhost).
 * Esto habilita el demo "pegá tu URL, Themis aprende" — el use case real
 * del producto. La seguridad la da el blocklist + Browserbase corriendo
 * el browser remoto (no en nuestra red).
 *
 * MODO ESTRICTO: si SSRF_STRICT_MODE=true, fuerza allowlist tradicional.
 * Útil para deploy expuesto sin auth.
 */
export function validateStartUrl(
  rawUrl: string,
): { ok: true; url: URL } | { ok: false; reason: string } {
  // Normaliza: trim espacios, agrega https:// si no tiene protocolo, valida
  // hostname sin paths sueltos. Esto evita rechazos sospechosos por env vars
  // mal pegadas en Vercel ("arcacontal.com" en vez de "https://arcacontal.com").
  const normalized = (rawUrl ?? "").trim();
  if (normalized.length === 0) {
    return { ok: false, reason: "URL vacía" };
  }
  const withProtocol = /^https?:\/\//i.test(normalized)
    ? normalized
    : `https://${normalized}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return {
      ok: false,
      reason: `URL malformada: '${rawUrl.slice(0, 100)}'`,
    };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: "Only http(s) URLs allowed" };
  }

  if (isBlockedHost(parsed.host)) {
    return {
      ok: false,
      reason: `Host '${parsed.host}' bloqueado (private IP / metadata / loopback)`,
    };
  }

  // Modo estricto opt-in
  if (process.env.SSRF_STRICT_MODE === "true") {
    const allowed = allowedSourceHosts();
    if (!allowed.has(parsed.host.toLowerCase())) {
      return {
        ok: false,
        reason: `Host '${parsed.host}' no está en SSRF_ALLOWED_HOSTS (modo estricto)`,
      };
    }
  }

  return { ok: true, url: parsed };
}

// ============================================================
// Body size caps — protege billing de LLMs / TTS / Whisper
// ============================================================

export const LIMITS = {
  voice_text_chars: 1500,
  recording_json_bytes: 256 * 1024, // 256KB de Recording JSON
  playbook_json_bytes: 128 * 1024, // 128KB de Playbook
  whisper_audio_bytes: 4 * 1024 * 1024, // 4MB audio (≤30s razonable)
  recommendation_chars: 8 * 1024,
};

export function jsonTooBig(
  body: string,
  maxBytes: number,
): { tooBig: boolean; size: number } {
  const size = new TextEncoder().encode(body).length;
  return { tooBig: size > maxBytes, size };
}

// ============================================================
// In-memory rate limit (best-effort)
// ============================================================

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __themis_rate_limits: Map<string, RateLimitRecord> | undefined;
}

function rateLimitStore(): Map<string, RateLimitRecord> {
  if (!globalThis.__themis_rate_limits) {
    globalThis.__themis_rate_limits = new Map();
  }
  return globalThis.__themis_rate_limits;
}

/**
 * Checa rate limit per (clave, ventana). Devuelve true si está OK,
 * false si excedió. Best-effort — se resetea al restart del server.
 *
 * No es perfecto (in-memory), pero protege del happy-path abuse durante demo.
 *
 * Ejemplo:
 *   if (!rateLimit("voice:" + ip, 30, 60_000)) return tooManyRequests();
 */
export function rateLimit(
  key: string,
  maxPerWindow: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const store = rateLimitStore();
  const rec = store.get(key);
  if (!rec || rec.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (rec.count >= maxPerWindow) return false;
  rec.count++;
  return true;
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xri = req.headers.get("x-real-ip");
  if (xri) return xri.trim();
  return "unknown";
}

// ============================================================
// Error sanitization — no leak de stack / paths internos
// ============================================================

const IS_PROD = process.env.NODE_ENV === "production";

/**
 * Para devolver en respuestas 500. En prod oculta detalles, en dev
 * incluye message para debugging.
 */
export function sanitizedError(
  err: unknown,
  fallback = "Internal error",
): { error: string } {
  const msg = (err as Error)?.message ?? fallback;
  if (IS_PROD) return { error: fallback };
  // En dev: truncamos a 200 chars y removemos paths absolutos comunes
  const truncated = String(msg)
    .replace(/[A-Za-z]:\\[^\s]+/g, "[path]") // Windows abs paths
    .replace(/\/Users\/[^\s/]+/g, "/Users/[user]")
    .replace(/\/home\/[^\s/]+/g, "/home/[user]")
    .slice(0, 300);
  return { error: truncated };
}

// ============================================================
// JSON response helpers
// ============================================================

export function badRequest(reason: string): NextResponse {
  return NextResponse.json({ error: reason }, { status: 400 });
}

export function tooLarge(reason: string): NextResponse {
  return NextResponse.json({ error: reason }, { status: 413 });
}

export function tooManyRequests(reason = "Rate limit exceeded"): NextResponse {
  return NextResponse.json({ error: reason }, { status: 429 });
}
