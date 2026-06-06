/**
 * Themis · Setup Solana wallet (devnet)
 *
 * Genera un nuevo keypair, pide SOL al faucet de devnet, y escribe la secret
 * key en .env.local. Para Capa 6 (on-chain provenance).
 *
 * Run: pnpm setup:solana
 *
 * Owner: Jhulyam
 */

import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";
import { appendFile, readFile } from "node:fs/promises";
import path from "node:path";

const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const AIRDROP_AMOUNT_SOL = 2;
const MAX_AIRDROP_RETRIES = 3;

async function main(): Promise<void> {
  console.log("\n🌌  Themis · Setup Solana wallet (devnet)\n");

  // ----- 1. Generar wallet -----
  const keypair = Keypair.generate();
  const publicKey = keypair.publicKey.toBase58();
  const secretKeyBase58 = bs58.encode(keypair.secretKey);

  console.log("✅  Wallet generada");
  console.log(`    Public key:  ${publicKey}`);
  console.log(
    `    Explorer:    https://explorer.solana.com/address/${publicKey}?cluster=devnet\n`,
  );

  // ----- 2. Conectar a devnet + faucet -----
  const connection = new Connection(RPC_URL, "confirmed");

  console.log(`💸  Pidiendo ${AIRDROP_AMOUNT_SOL} SOL al faucet de devnet...`);
  let airdropSuccess = false;

  for (let attempt = 1; attempt <= MAX_AIRDROP_RETRIES; attempt++) {
    try {
      const signature = await connection.requestAirdrop(
        keypair.publicKey,
        AIRDROP_AMOUNT_SOL * LAMPORTS_PER_SOL,
      );

      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        {
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        "confirmed",
      );

      const balance = await connection.getBalance(keypair.publicKey);
      console.log(
        `✅  Balance: ${(balance / LAMPORTS_PER_SOL).toFixed(2)} SOL`,
      );
      console.log(
        `    Airdrop tx:  https://explorer.solana.com/tx/${signature}?cluster=devnet\n`,
      );
      airdropSuccess = true;
      break;
    } catch (err) {
      const msg = (err as Error).message;
      console.warn(`⚠️   Intento ${attempt}/${MAX_AIRDROP_RETRIES} falló: ${msg}`);
      if (attempt < MAX_AIRDROP_RETRIES) {
        await sleep(2000);
      }
    }
  }

  if (!airdropSuccess) {
    console.log("\n⚠️   El faucet RPC falló (probablemente rate-limited).");
    console.log("    Alternativa: ve a https://faucet.solana.com");
    console.log(`    Pega esta address: ${publicKey}\n`);
  }

  // ----- 3. Escribir credenciales a .env.local -----
  const envPath = path.join(process.cwd(), ".env.local");
  let existing = "";
  try {
    existing = await readFile(envPath, "utf-8");
  } catch {
    // file doesn't exist yet — first setup
  }

  if (existing.includes("SOLANA_WALLET_SECRET_KEY")) {
    console.log(
      "⚠️   .env.local ya tiene SOLANA_WALLET_SECRET_KEY — NO se sobrescribe.",
    );
    console.log(
      "    Si quieres regenerar, borra esas líneas manualmente y re-corre el script.\n",
    );
    console.log("📋  Credenciales NUEVAS (no guardadas):");
    console.log(`    SOLANA_WALLET_SECRET_KEY=${secretKeyBase58}`);
    console.log(`    SOLANA_WALLET_PUBLIC_KEY=${publicKey}\n`);
    return;
  }

  const block = [
    "",
    "# ============================================================",
    "# Solana wallet (autogenerado por scripts/setup-solana-wallet.ts)",
    "# DO NOT COMMIT — este archivo está en .gitignore",
    "# ============================================================",
    `SOLANA_RPC_URL=${RPC_URL}`,
    `SOLANA_WALLET_SECRET_KEY=${secretKeyBase58}`,
    `SOLANA_WALLET_PUBLIC_KEY=${publicKey}`,
    "",
  ].join("\n");

  await appendFile(envPath, block);
  console.log(`✅  Credenciales escritas en ${envPath}\n`);

  console.log("🎉  Wallet lista. Themis puede registrar mapeos on-chain.\n");
  console.log("    Siguiente paso: que apps/operator-ui consuma estas env vars.");
  console.log(
    "    Verifica el balance: corre `pnpm setup:solana` de nuevo para ver tu wallet existente.\n",
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((err) => {
  console.error("\n❌  Setup falló:", err);
  process.exit(1);
});
