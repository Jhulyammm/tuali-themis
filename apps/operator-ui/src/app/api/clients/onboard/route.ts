/**
 * POST /api/clients/onboard — onboard de un cliente con SOLO una URL.
 *
 * Themis hace fetch HTTP, identifica la marca por title/og-tags/hostname,
 * infiere zona razonable y crea el cliente listo para aprender. El operador
 * de Tuali solo necesita pegar la URL del catálogo del cliente — el resto
 * lo hace Themis.
 *
 * Body: { url: string, zone_hint?: string, brand_hint?: string }
 * Returns: { client }
 */

import { NextRequest, NextResponse } from "next/server";
import { saveClient } from "@hack4her/db";
import type { Client, ZoneContext } from "@hack4her/playbooks";
import {
  badRequest,
  rateLimit,
  getClientIp,
  tooManyRequests,
  sanitizedError,
} from "@/lib/security";

export const runtime = "nodejs";
export const maxDuration = 30;

const URL_PATTERN = /^https?:\/\/[^\s<>"']+$/i;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(`onboard:${ip}`, 10, 60_000)) {
    return tooManyRequests("Demasiados onboards. Espera 1 minuto.");
  }

  let body: { url?: string; zone_hint?: string; brand_hint?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return badRequest("Invalid JSON");
  }

  if (!body.url || !URL_PATTERN.test(body.url)) {
    return badRequest("'url' inválida (http/https)");
  }

  try {
    const meta = await fetchPageMeta(body.url);
    const hostname = new URL(body.url).hostname;
    const brand = body.brand_hint ?? inferBrand(hostname, meta.title);
    const emoji = brandEmoji(brand);
    const zoneName = body.zone_hint ?? "Por definir";

    const zone: ZoneContext = {
      zone_id: slugify(brand + "-" + zoneName),
      zone_name: zoneName,
      city: "Monterrey",
      profile: "comercial",
      nearby_institutions: [],
    };

    const id = `${slugify(brand)}-${Date.now().toString(36)}`;
    const client: Client = {
      id,
      name: meta.title || `${brand} ${zoneName}`,
      brand,
      emoji,
      source_system_name: `Catálogo ${brand}`,
      source_system_url: body.url,
      destination_system_name: "ERP Tuali",
      destination_system_url: "https://erp.tuali.demo/" + id,
      zone,
      playbook_ids: [],
      baseline_skus: {},
      status: "onboarding",
      onboarded_at: new Date().toISOString(),
      onboarded_via: "url",
    };

    await saveClient(client);
    return NextResponse.json({
      client,
      detected: {
        title: meta.title,
        hostname,
        brand,
      },
    });
  } catch (err) {
    console.error("[/api/clients/onboard]", err);
    return NextResponse.json(sanitizedError(err, "Onboard failed"), {
      status: 500,
    });
  }
}

async function fetchPageMeta(url: string): Promise<{ title: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ThemisAgent/1.0)",
        Accept: "text/html",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return { title: "" };
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return { title: titleMatch?.[1]?.trim().slice(0, 100) ?? "" };
  } catch {
    return { title: "" };
  }
}

function inferBrand(hostname: string, title: string): string {
  const lower = (hostname + " " + title).toLowerCase();
  const brands: Array<[RegExp, string]> = [
    [/oxxo/, "OXXO"],
    [/soriana/, "Soriana"],
    [/costco/, "Costco"],
    [/walmart/, "Walmart"],
    [/chedraui/, "Chedraui"],
    [/7-?eleven|seven/, "7-Eleven"],
    [/superama/, "Superama"],
    [/heb\b/, "HEB"],
    [/sams/, "Sam's Club"],
    [/aurrer/, "Bodega Aurrera"],
    [/arca/, "Arca Continental"],
    [/coca|cola/, "Coca-Cola"],
  ];
  for (const [re, name] of brands) {
    if (re.test(lower)) return name;
  }
  // Fallback: primer segmento del hostname capitalizado
  const cleaned = hostname.replace(/^(www\.|m\.)/, "");
  const first = cleaned.split(".")[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function brandEmoji(brand: string): string {
  const b = brand.toLowerCase();
  if (b.includes("oxxo")) return "🛒";
  if (b.includes("soriana")) return "🏪";
  if (b.includes("costco") || b.includes("sam")) return "🛍️";
  if (b.includes("walmart") || b.includes("aurrera") || b.includes("heb")) return "🏬";
  if (b.includes("7-eleven") || b.includes("seven")) return "🌃";
  if (b.includes("chedraui") || b.includes("superama")) return "🛒";
  if (b.includes("arca") || b.includes("coca")) return "🥤";
  return "🏪";
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}
