/**
 * /api/solana/verify — verifica que un tx hash existe en Solana devnet
 * y contiene el hash del playbook esperado.
 *
 * Import directo del módulo blockchain para evitar cargar Stagehand.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSolanaClientFromEnv } from "@hack4her/agent/blockchain";
import type { SolanaProvenance } from "@hack4her/playbooks";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const provenance = (await request.json()) as SolanaProvenance;
    const client = createSolanaClientFromEnv();
    const verified = await client.verifyPlaybook(provenance);

    return NextResponse.json({
      verified,
      explorer_url: provenance.explorer_url,
    });
  } catch (err) {
    console.error("[/api/solana/verify]", err);
    return NextResponse.json(
      { error: (err as Error).message || "Verification failed" },
      { status: 500 },
    );
  }
}
