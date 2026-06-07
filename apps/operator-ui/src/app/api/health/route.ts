/**
 * GET /api/health — pre-flight check de las 6 capas.
 *
 * Antes del demo, hits a este endpoint y te dice qué está LIVE / DEGRADED /
 * DOWN en menos de 5 segundos. Ideal para mostrar al jurado "Themis está
 * verde" antes del Acto 1.
 *
 * Returns:
 *   {
 *     overall: "healthy" | "degraded" | "down",
 *     latency_ms: number,
 *     checks: {
 *       capa1_claude:      "live" | "down",
 *       capa1_browserbase: "live" | "down",
 *       capa2_elevenlabs:  "live" | "down",
 *       capa2_whisper:     "live" | "down",
 *       capa3_gemini:      "live" | "down",
 *       capa4_mongodb:     "live" | "down",  ← test conexión real
 *       capa6_solana:      "live" | "down",
 *     },
 *     details: { ...mensajes de error por capa caída... }
 *   }
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

type Status = "live" | "down";

interface Check {
  name: string;
  status: Status;
  latency_ms: number;
  error?: string;
}

async function timed<T>(fn: () => Promise<T>): Promise<{ result: T; ms: number; err?: Error }> {
  const t0 = Date.now();
  try {
    const result = await fn();
    return { result, ms: Date.now() - t0 };
  } catch (err) {
    return { result: undefined as unknown as T, ms: Date.now() - t0, err: err as Error };
  }
}

async function checkAnthropic(): Promise<Check> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { name: "claude", status: "down", latency_ms: 0, error: "missing key" };
  const { result, ms, err } = await timed(async () => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 5,
        messages: [{ role: "user", content: "hi" }],
      }),
    });
    return res.ok;
  });
  return {
    name: "claude",
    status: result && !err ? "live" : "down",
    latency_ms: ms,
    error: err?.message?.slice(0, 100),
  };
}

async function checkBrowserbase(): Promise<Check> {
  const key = process.env.BROWSERBASE_API_KEY;
  const projectId = process.env.BROWSERBASE_PROJECT_ID;
  if (!key || !projectId) {
    return { name: "browserbase", status: "down", latency_ms: 0, error: "missing key" };
  }
  const { result, ms, err } = await timed(async () => {
    const res = await fetch("https://api.browserbase.com/v1/projects", {
      headers: { "x-bb-api-key": key },
    });
    return res.ok;
  });
  return {
    name: "browserbase",
    status: result && !err ? "live" : "down",
    latency_ms: ms,
    error: err?.message?.slice(0, 100),
  };
}

async function checkElevenLabs(): Promise<Check> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return { name: "elevenlabs", status: "down", latency_ms: 0, error: "missing key" };
  // /v1/voices lista voces — funciona con cualquier key válida y no consume créditos.
  // Algunas keys gratis NO tienen acceso a /v1/user.
  const { result, ms, err } = await timed(async () => {
    const res = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": key },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 80)}`);
    }
    return true;
  });
  return {
    name: "elevenlabs",
    status: result && !err ? "live" : "down",
    latency_ms: ms,
    error: err?.message?.slice(0, 100),
  };
}

async function checkWhisper(): Promise<Check> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { name: "whisper", status: "down", latency_ms: 0, error: "missing key" };
  const { result, ms, err } = await timed(async () => {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
    });
    return res.ok;
  });
  return {
    name: "whisper",
    status: result && !err ? "live" : "down",
    latency_ms: ms,
    error: err?.message?.slice(0, 100),
  };
}

async function checkGemini(): Promise<Check> {
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!key) return { name: "gemini", status: "down", latency_ms: 0, error: "missing key" };
  // El endpoint /v1beta/models lista modelos disponibles — no consume cuota.
  // No le pasamos modelo específico para evitar 404 si nombre cambia.
  const { result, ms, err } = await timed(async () => {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 80)}`);
    }
    return true;
  });
  return {
    name: "gemini",
    status: result && !err ? "live" : "down",
    latency_ms: ms,
    error: err?.message?.slice(0, 100),
  };
}

async function checkMongoDB(): Promise<Check> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return { name: "mongodb", status: "down", latency_ms: 0, error: "missing uri" };

  const { ms, err } = await timed(async () => {
    const { MongoClient } = await import("mongodb");
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
    try {
      await client.connect();
      await client.db("themis").command({ ping: 1 });
    } finally {
      await client.close();
    }
  });
  return {
    name: "mongodb",
    status: !err ? "live" : "down",
    latency_ms: ms,
    error: err?.message?.slice(0, 100),
  };
}

async function checkSolana(): Promise<Check> {
  const rpc = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  const pubKey = process.env.SOLANA_WALLET_PUBLIC_KEY;
  if (!pubKey) return { name: "solana", status: "down", latency_ms: 0, error: "missing wallet" };

  const { result, ms, err } = await timed(async () => {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [pubKey],
      }),
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { result?: { value?: number } };
    return (json.result?.value ?? 0) > 0;
  });
  return {
    name: "solana",
    status: result && !err ? "live" : "down",
    latency_ms: ms,
    error: err?.message?.slice(0, 100),
  };
}

export async function GET() {
  const t0 = Date.now();

  const [claude, bb, eleven, whisper, gemini, mongo, solana] = await Promise.all([
    checkAnthropic(),
    checkBrowserbase(),
    checkElevenLabs(),
    checkWhisper(),
    checkGemini(),
    checkMongoDB(),
    checkSolana(),
  ]);

  const allChecks = [claude, bb, eleven, whisper, gemini, mongo, solana];
  const downCount = allChecks.filter((c) => c.status === "down").length;
  const overall: "healthy" | "degraded" | "down" =
    downCount === 0 ? "healthy" : downCount <= 2 ? "degraded" : "down";

  return NextResponse.json({
    overall,
    latency_ms: Date.now() - t0,
    timestamp: new Date().toISOString(),
    checks: {
      capa1_claude: claude.status,
      capa1_browserbase: bb.status,
      capa2_elevenlabs: eleven.status,
      capa2_whisper: whisper.status,
      capa3_gemini: gemini.status,
      capa4_mongodb: mongo.status,
      capa6_solana: solana.status,
    },
    latencies: {
      claude: claude.latency_ms,
      browserbase: bb.latency_ms,
      elevenlabs: eleven.latency_ms,
      whisper: whisper.latency_ms,
      gemini: gemini.latency_ms,
      mongodb: mongo.latency_ms,
      solana: solana.latency_ms,
    },
    errors: allChecks
      .filter((c) => c.error)
      .reduce<Record<string, string>>((acc, c) => {
        acc[c.name] = c.error ?? "unknown";
        return acc;
      }, {}),
  });
}
