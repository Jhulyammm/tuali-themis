/**
 * GET /api/solana/health — verifica que el wallet de Themis está vivo en devnet.
 *
 * Devuelve address + balance + slot actual. Usado por diagnostics para confirmar
 * que la Capa 6 está conectada (sin necesitar un tx_signature real).
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const secretKey = process.env.SOLANA_WALLET_SECRET_KEY;
    const publicKey = process.env.SOLANA_WALLET_PUBLIC_KEY;
    if (!secretKey || !publicKey) {
      return NextResponse.json(
        { error: "Solana wallet not configured. Run pnpm setup:solana." },
        { status: 500 },
      );
    }

    const web3 = await import("@solana/web3.js");
    const conn = new web3.Connection(
      process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
      "confirmed",
    );
    const pubKey = new web3.PublicKey(publicKey);
    const balance = await conn.getBalance(pubKey);
    const slot = await conn.getSlot("confirmed");

    return NextResponse.json({
      ok: true,
      address: publicKey,
      balance_sol: balance / web3.LAMPORTS_PER_SOL,
      slot,
      explorer_url: `https://explorer.solana.com/address/${publicKey}?cluster=devnet`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
