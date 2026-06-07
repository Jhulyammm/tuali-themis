/**
 * GET /api/status — health check agregado de todas las capas.
 * Sirve a /produccion (vista del jurado: "todo verde").
 */

import { NextResponse } from "next/server";
import { createSolanaClientFromEnv } from "@hack4her/agent/blockchain";
import { getStoreStatus, getExecutionsStatus } from "@hack4her/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface StatusReport {
  generated_at: string;
  capa1_agent: {
    anthropic: "configured" | "missing";
    browserbase: "configured" | "missing";
  };
  capa2_voice: {
    elevenlabs: "configured" | "missing";
    openai_whisper: "configured" | "missing";
  };
  capa3_cognitive: {
    gemini: "configured" | "missing";
    fallback_claude: "configured" | "missing";
  };
  capa4_memory: {
    playbooks_backend: "mongodb" | "filesystem";
    playbooks_count: number;
    executions_backend: "mongodb" | "filesystem";
    executions_count: number;
    self_heal_count: number;
  };
  capa5_infra: {
    operator_url: string;
    erp_destino_url: string;
    source_system_url: string;
    deploy_target: "localhost" | "tunnel" | "vultr";
  };
  capa6_solana: {
    network: "devnet" | "mainnet-beta";
    wallet_address: string | null;
    balance_sol: number | null;
    rpc: string;
    error?: string;
  };
}

function detectDeployTarget(): "localhost" | "tunnel" | "vultr" {
  const url = process.env.NEXT_PUBLIC_SOURCE_SYSTEM_URL ?? "";
  if (url.includes("trycloudflare.com") || url.includes("ngrok")) return "tunnel";
  if (url.startsWith("http://") && !url.includes("localhost")) return "vultr";
  return "localhost";
}

export async function GET() {
  const report: StatusReport = {
    generated_at: new Date().toISOString(),
    capa1_agent: {
      anthropic: process.env.ANTHROPIC_API_KEY ? "configured" : "missing",
      browserbase:
        process.env.BROWSERBASE_API_KEY && process.env.BROWSERBASE_PROJECT_ID
          ? "configured"
          : "missing",
    },
    capa2_voice: {
      elevenlabs: process.env.ELEVENLABS_API_KEY ? "configured" : "missing",
      openai_whisper: process.env.OPENAI_API_KEY ? "configured" : "missing",
    },
    capa3_cognitive: {
      gemini:
        process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
          ? "configured"
          : "missing",
      fallback_claude: process.env.ANTHROPIC_API_KEY ? "configured" : "missing",
    },
    capa4_memory: {
      playbooks_backend: "filesystem",
      playbooks_count: 0,
      executions_backend: "filesystem",
      executions_count: 0,
      self_heal_count: 0,
    },
    capa5_infra: {
      operator_url:
        process.env.NEXT_PUBLIC_OPERATOR_URL ?? "http://localhost:3000",
      erp_destino_url:
        process.env.NEXT_PUBLIC_ERP_DESTINO_URL ?? "http://localhost:3001",
      source_system_url:
        process.env.NEXT_PUBLIC_SOURCE_SYSTEM_URL ?? "http://localhost:3002",
      deploy_target: detectDeployTarget(),
    },
    capa6_solana: {
      network: "devnet",
      wallet_address: null,
      balance_sol: null,
      rpc: process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
    },
  };

  // Capa 4 — playbooks
  try {
    const s = await getStoreStatus();
    report.capa4_memory.playbooks_backend = s.backend;
    report.capa4_memory.playbooks_count = s.count;
  } catch (err) {
    console.warn("[status] playbooks store:", (err as Error).message);
  }

  // Capa 4 — executions + self-heals
  try {
    const s = await getExecutionsStatus();
    report.capa4_memory.executions_backend = s.backend;
    report.capa4_memory.executions_count = s.count;
    report.capa4_memory.self_heal_count = s.selfHealCount;
  } catch (err) {
    console.warn("[status] executions store:", (err as Error).message);
  }

  // Capa 6 — Solana
  try {
    const solana = createSolanaClientFromEnv();
    report.capa6_solana.wallet_address = solana.walletAddress();
    const lamports = await solana.balance();
    report.capa6_solana.balance_sol = lamports / 1_000_000_000;
  } catch (err) {
    report.capa6_solana.error = (err as Error).message.slice(0, 200);
  }

  return NextResponse.json(report);
}
