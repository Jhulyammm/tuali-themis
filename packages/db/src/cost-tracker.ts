/**
 * Themis — Cost Tracker (Capa de Transparencia)
 *
 * Calcula y reporta el costo REAL de cada playbook + ejecución en USD.
 * Esto es lo que diferencia a Themis cuando hablamos con jurado/CFO:
 *
 *   Trabajador humano:  $0.83 USD por captura (6 min × $8.30/h)
 *   Themis:             $0.058 USD por captura
 *   Ahorro:             93% por SKU procesado
 *
 * Precios (públicos al momento de hackathon — junio 2026):
 *   - Claude Haiku 4.5:   $1.00 / 1M input,  $5.00 / 1M output
 *   - Claude Sonnet 3.7:  $3.00 / 1M input,  $15.00 / 1M output
 *   - Gemini 2.0 Flash:   $0.10 / 1M input,  $0.40 / 1M output  (gratis hasta 15RPM)
 *   - ElevenLabs TTS:     ~$0.30 / 1k chars  (multilingual v2)
 *   - OpenAI Whisper:     $0.006 / minute
 *   - Browserbase:        $0.10 / minute de sesión
 *   - Solana devnet:      $0 (devnet free, ~5000 lamports/tx mainnet = $0.000001)
 */

export interface CostBreakdown {
  capa1_claude_usd: number;
  capa1_browserbase_usd: number;
  capa2_elevenlabs_usd: number;
  capa2_whisper_usd: number;
  capa3_gemini_usd: number;
  capa6_solana_usd: number;
  total_usd: number;
}

export interface LatencyBreakdown {
  total_ms: number;
  claude_ms: number;
  browserbase_ms: number;
  solana_ms: number;
  other_ms: number;
}

const PRICES = {
  // USD por TOKEN (no por 1M)
  claude_haiku_input: 1.0 / 1_000_000,
  claude_haiku_output: 5.0 / 1_000_000,
  claude_sonnet_input: 3.0 / 1_000_000,
  claude_sonnet_output: 15.0 / 1_000_000,
  gemini_flash_input: 0.1 / 1_000_000,
  gemini_flash_output: 0.4 / 1_000_000,

  // USD por CHAR (TTS) o segundo (Whisper)
  elevenlabs_per_char: 0.0003,
  whisper_per_second: 0.006 / 60,

  // USD por minuto Browserbase
  browserbase_per_minute: 0.1,

  // USD por tx Solana (devnet = 0)
  solana_per_tx: 0,
} as const;

/**
 * Calcula costo de un call a Claude.
 */
export function claudeCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const isSonnet = model.includes("sonnet");
  const inP = isSonnet ? PRICES.claude_sonnet_input : PRICES.claude_haiku_input;
  const outP = isSonnet
    ? PRICES.claude_sonnet_output
    : PRICES.claude_haiku_output;
  return inputTokens * inP + outputTokens * outP;
}

export function geminiCost(
  inputTokens: number,
  outputTokens: number,
): number {
  return (
    inputTokens * PRICES.gemini_flash_input +
    outputTokens * PRICES.gemini_flash_output
  );
}

export function elevenLabsCost(chars: number): number {
  return chars * PRICES.elevenlabs_per_char;
}

export function whisperCost(seconds: number): number {
  return seconds * PRICES.whisper_per_second;
}

export function browserbaseCost(ms: number): number {
  return (ms / 1000 / 60) * PRICES.browserbase_per_minute;
}

export function solanaCost(txCount: number): number {
  return txCount * PRICES.solana_per_tx;
}

/**
 * Compara contra el costo humano para mostrar el ahorro.
 * Default: $8.30 USD/h (sueldo capturista nivel medio Méxio 2026).
 */
export function humanCost(
  durationSeconds: number,
  hourlyUSD = 8.3,
): number {
  return (durationSeconds / 3600) * hourlyUSD;
}

/**
 * Para una ejecución típica (6 min manual), calcula cuánto ahorra Themis.
 */
export function calculateROI(
  themisCost: number,
  manualMinutes = 6,
): { manualCost: number; savings: number; multiplier: number } {
  const manualCost = humanCost(manualMinutes * 60);
  const savings = manualCost - themisCost;
  const multiplier = manualCost / Math.max(themisCost, 0.0001);
  return { manualCost, savings, multiplier };
}

/**
 * Empty breakdown to start aggregating.
 */
export function emptyBreakdown(): CostBreakdown {
  return {
    capa1_claude_usd: 0,
    capa1_browserbase_usd: 0,
    capa2_elevenlabs_usd: 0,
    capa2_whisper_usd: 0,
    capa3_gemini_usd: 0,
    capa6_solana_usd: 0,
    total_usd: 0,
  };
}

export function sumBreakdown(b: CostBreakdown): number {
  return (
    b.capa1_claude_usd +
    b.capa1_browserbase_usd +
    b.capa2_elevenlabs_usd +
    b.capa2_whisper_usd +
    b.capa3_gemini_usd +
    b.capa6_solana_usd
  );
}
