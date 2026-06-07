/**
 * /api/mcp — Themis expuesto como Model Context Protocol server.
 *
 * Otras IAs (Claude Desktop, Cursor, IDEs con MCP support) pueden invocar
 * Themis como herramienta. Esto convierte a Themis en INFRAESTRUCTURA, no
 * en una app cerrada. Cualquier asistente IA puede:
 *   - listar tiendas que Themis atiende
 *   - aprender un nuevo proceso pegando una URL
 *   - ejecutar playbooks aprendidos
 *   - pedir recomendaciones de surtido contextualizadas
 *
 * Implementación: JSON-RPC 2.0 sobre HTTP POST (Streamable HTTP transport).
 * Spec: https://spec.modelcontextprotocol.io/specification/2024-11-05/basic/transports
 *
 * Tools expuestas:
 *   - themis.list_clients               → tiendas activas
 *   - themis.onboard_client(url)        → nueva tienda con una URL
 *   - themis.list_playbooks(client_id?) → playbooks aprendidos
 *   - themis.learn_from_url(url, hint?) → entrena un playbook fresh
 *   - themis.execute_playbook(id)       → reproduce un playbook
 *   - themis.get_recommendations(id)    → surtido contextual Gemini
 */

import { NextRequest, NextResponse } from "next/server";
import { listClients, listSavedPlaybooks } from "@hack4her/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// JSON-RPC types
// ============================================================

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

// ============================================================
// MCP tool manifest
// ============================================================

const SERVER_INFO = {
  name: "themis",
  version: "1.0.0",
  description:
    "Themis — agente cognitivo de Arca Continental / Tuali. Aprende procesos web por observación y los firma en Solana.",
};

const TOOLS = [
  {
    name: "themis.list_clients",
    description:
      "Lista todas las tiendas Tuali que Themis atiende (OXXO, Soriana, Costco, abarrotes y onboardeadas).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "themis.onboard_client",
    description:
      "Onboardea una nueva tienda con solo la URL del catálogo del proveedor. Themis detecta la marca y crea el cliente.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL del catálogo del proveedor" },
      },
      required: ["url"],
    },
  },
  {
    name: "themis.list_playbooks",
    description:
      "Lista los playbooks que Themis ha aprendido. Opcionalmente filtra por client_id.",
    inputSchema: {
      type: "object",
      properties: {
        client_id: { type: "string", description: "ID del cliente (opcional)" },
      },
    },
  },
  {
    name: "themis.learn_from_url",
    description:
      "Themis aprende un proceso desde una URL pública sin observación humana. Devuelve playbook con mappings + costo + Solana provenance.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL del sitio a aprender" },
        hint: {
          type: "string",
          description: "Pista en lenguaje natural sobre el proceso (opcional)",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "themis.execute_playbook",
    description:
      "Reproduce un playbook aprendido contra datos nuevos. Devuelve resultado con telemetría por step.",
    inputSchema: {
      type: "object",
      properties: {
        playbook_id: { type: "string" },
        parameters: { type: "object", additionalProperties: true },
      },
      required: ["playbook_id"],
    },
  },
  {
    name: "themis.get_recommendations",
    description:
      "Genera recomendaciones de surtido (Gemini + Deep Research) para una tienda específica, contextualizadas por zona y eventos.",
    inputSchema: {
      type: "object",
      properties: {
        client_id: { type: "string" },
      },
      required: ["client_id"],
    },
  },
];

// ============================================================
// Handlers
// ============================================================

async function handleInitialize() {
  return {
    protocolVersion: "2024-11-05",
    capabilities: {
      tools: { listChanged: false },
    },
    serverInfo: SERVER_INFO,
  };
}

async function handleListTools() {
  return { tools: TOOLS };
}

async function handleCallTool(
  name: string,
  args: Record<string, unknown>,
  origin: string,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  switch (name) {
    case "themis.list_clients": {
      const clients = await listClients();
      const simplified = clients.map((c) => ({
        id: c.id,
        name: c.name,
        brand: c.brand,
        zone: `${c.zone.zone_name}, ${c.zone.city}`,
        profile: c.zone.profile,
        playbooks: c.playbook_ids?.length ?? 0,
        runs: c.total_runs ?? 0,
        avg_seconds: c.avg_seconds,
      }));
      return text(JSON.stringify({ clients: simplified }, null, 2));
    }

    case "themis.onboard_client": {
      const url = String(args.url ?? "");
      if (!url) return text(JSON.stringify({ error: "url required" }));
      const res = await fetch(`${origin}/api/clients/onboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      return text(JSON.stringify(data, null, 2));
    }

    case "themis.list_playbooks": {
      const clientId = args.client_id as string | undefined;
      const all = await listSavedPlaybooks();
      const clients = clientId ? await listClients() : [];
      const client = clients.find((c) => c.id === clientId);
      const filtered = client
        ? all.filter((p) => (client.playbook_ids ?? []).includes(p.id))
        : all;
      const simplified = filtered.map((p) => ({
        id: p.id,
        name: p.name,
        intent: p.intent,
        source_url: p.source_url,
        destination_url: p.destination_url,
        mappings: p.mappings?.length ?? 0,
        steps: p.steps?.length ?? 0,
        provenance_tx: p.provenance?.tx_signature,
        signed_mappings: (p.mappings ?? []).filter((m) => m.signature).length,
      }));
      return text(JSON.stringify({ playbooks: simplified }, null, 2));
    }

    case "themis.learn_from_url": {
      const url = String(args.url ?? "");
      const hint = args.hint ? String(args.hint) : undefined;
      if (!url) return text(JSON.stringify({ error: "url required" }));
      const res = await fetch(`${origin}/api/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, hint }),
      });
      const data = await res.json();
      return text(JSON.stringify(data, null, 2));
    }

    case "themis.execute_playbook": {
      const playbookId = String(args.playbook_id ?? "");
      const all = await listSavedPlaybooks();
      const pb = all.find((p) => p.id === playbookId);
      if (!pb) return text(JSON.stringify({ error: "playbook not found" }));
      // No invocamos /api/execute (Browserbase) — devolvemos info estructurada
      // del playbook + un "execution plan" para que el caller decida.
      return text(
        JSON.stringify(
          {
            playbook: pb.name,
            steps_planned: pb.steps?.length ?? 0,
            mappings_count: pb.mappings?.length ?? 0,
            note: "Use the operator-ui /execute page to run this playbook in replay mode.",
          },
          null,
          2,
        ),
      );
    }

    case "themis.get_recommendations": {
      const clientId = String(args.client_id ?? "");
      const clients = await listClients();
      const client = clients.find((c) => c.id === clientId);
      if (!client)
        return text(JSON.stringify({ error: "client not found" }));
      const res = await fetch(`${origin}/api/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tendero_id: client.id,
          zone: client.zone,
          historical_baseline: client.baseline_skus,
        }),
      });
      const data = await res.json();
      return text(JSON.stringify(data, null, 2));
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function text(s: string) {
  return { content: [{ type: "text" as const, text: s }] };
}

// ============================================================
// Route
// ============================================================

export async function POST(request: NextRequest) {
  let body: JsonRpcRequest;
  try {
    body = (await request.json()) as JsonRpcRequest;
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } },
      { status: 400 },
    );
  }

  if (body.jsonrpc !== "2.0" || !body.method) {
    return NextResponse.json(
      { jsonrpc: "2.0", id: body.id ?? null, error: { code: -32600, message: "Invalid Request" } },
      { status: 400 },
    );
  }

  const origin = request.nextUrl.origin;
  const id = body.id ?? null;

  try {
    let result: unknown;
    switch (body.method) {
      case "initialize":
        result = await handleInitialize();
        break;
      case "tools/list":
        result = await handleListTools();
        break;
      case "tools/call": {
        const params = (body.params ?? {}) as { name?: string; arguments?: Record<string, unknown> };
        if (!params.name) throw new Error("Missing tool name");
        result = await handleCallTool(params.name, params.arguments ?? {}, origin);
        break;
      }
      case "ping":
        result = {};
        break;
      default:
        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: `Method not found: ${body.method}` },
          } satisfies JsonRpcResponse,
          { status: 200 },
        );
    }

    return NextResponse.json({ jsonrpc: "2.0", id, result } satisfies JsonRpcResponse);
  } catch (err) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32603,
          message: (err as Error).message.slice(0, 200),
        },
      } satisfies JsonRpcResponse,
      { status: 200 },
    );
  }
}

// GET: descubrimiento simple — devuelve el manifiesto público.
export async function GET() {
  return NextResponse.json({
    server: SERVER_INFO,
    tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
    transport: "Streamable HTTP — POST JSON-RPC 2.0",
    spec: "https://spec.modelcontextprotocol.io",
  });
}
