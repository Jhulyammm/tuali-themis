/**
 * GET /api/clients — lista de tiendas que Themis atiende.
 * POST /api/clients — onboard manual con datos completos.
 *
 * El multi-tenant es la unidad de negocio Tuali: OXXO, Soriana, Costco,
 * abarrotes. Cada uno tiene su catálogo, su ERP, su zona.
 */

import { NextRequest, NextResponse } from "next/server";
import { listClients, saveClient } from "@hack4her/db";
import type { Client } from "@hack4her/playbooks";
import {
  badRequest,
  rateLimit,
  getClientIp,
  tooManyRequests,
  sanitizedError,
} from "@/lib/security";

export const runtime = "nodejs";

export async function GET() {
  try {
    const clients = await listClients();
    return NextResponse.json({ clients });
  } catch (err) {
    console.error("[/api/clients GET]", err);
    return NextResponse.json(sanitizedError(err, "List clients failed"), {
      status: 500,
    });
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(`clients:${ip}`, 20, 60_000)) {
    return tooManyRequests("Demasiados clientes. Espera 1 minuto.");
  }

  let body: Partial<Client>;
  try {
    body = (await request.json()) as Partial<Client>;
  } catch {
    return badRequest("Invalid JSON");
  }

  if (!body.id || !body.name) {
    return badRequest("Se requiere 'id' y 'name'");
  }

  const client: Client = {
    id: body.id,
    name: body.name,
    brand: body.brand ?? body.name.split(" ")[0] ?? "Tuali",
    emoji: body.emoji ?? "🏪",
    source_system_name: body.source_system_name ?? "Catálogo proveedor",
    source_system_url: body.source_system_url ?? "",
    destination_system_name: body.destination_system_name ?? "ERP Tuali",
    destination_system_url: body.destination_system_url ?? "",
    zone: body.zone ?? {
      zone_id: body.id,
      zone_name: "Sin zona",
      city: "Monterrey",
      profile: "comercial",
    },
    playbook_ids: body.playbook_ids ?? [],
    baseline_skus: body.baseline_skus ?? {},
    status: body.status ?? "active",
    onboarded_at: body.onboarded_at ?? new Date().toISOString(),
    onboarded_via: body.onboarded_via ?? "manual",
    total_runs: body.total_runs,
    avg_seconds: body.avg_seconds,
  };

  try {
    await saveClient(client);
    return NextResponse.json({ client });
  } catch (err) {
    console.error("[/api/clients POST]", err);
    return NextResponse.json(sanitizedError(err, "Save client failed"), {
      status: 500,
    });
  }
}
