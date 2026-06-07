/**
 * Themis — BrowserSessionManager (Capa 1)
 *
 * Pool de sesiones Browserbase vivas. La UI nunca ve Stagehand directo;
 * pide createSession() y recibe { sessionId, debuggerUrl } para embeber en
 * iframe. Mismo manager se usa para observación (humano dentro del iframe)
 * y ejecución autónoma (Themis maneja el browser visible).
 *
 * Singleton sobre globalThis para sobrevivir hot-reload de Next dev.
 *
 * Owner: Jhulyam
 */

import { Stagehand } from "@browserbasehq/stagehand";

// ============================================================
// Types
// ============================================================

export interface BrowserSnapshot {
  taken_at: string;
  url: string;
  title: string;
  /** Texto resumido de page.observe() — qué elementos hay en pantalla */
  observations: string[];
  /** Form field values visibles (input.value scraped). Útil para inferir mappings. */
  field_values: Record<string, string>;
}

export interface SessionHandle {
  sessionId: string;
  debuggerUrl: string;
  startUrl: string;
  createdAt: string;
  snapshots: BrowserSnapshot[];
}

interface InternalSession {
  stagehand: Stagehand;
  handle: SessionHandle;
}

// ============================================================
// Singleton pool (sobrevive hot-reload)
// ============================================================

declare global {
  // eslint-disable-next-line no-var
  var __themis_browser_sessions: Map<string, InternalSession> | undefined;
}

function pool(): Map<string, InternalSession> {
  if (!globalThis.__themis_browser_sessions) {
    globalThis.__themis_browser_sessions = new Map();
  }
  return globalThis.__themis_browser_sessions;
}

// ============================================================
// Public API
// ============================================================

export interface CreateSessionOpts {
  startUrl: string;
  /** Hint para el demo. Si es true, se ejecuta en BROWSERBASE; si false, LOCAL (debug). */
  remote?: boolean;
}

export async function createSession(
  opts: CreateSessionOpts,
): Promise<SessionHandle> {
  const stagehand = new Stagehand({
    env: opts.remote === false ? "LOCAL" : "BROWSERBASE",
    apiKey: process.env.BROWSERBASE_API_KEY,
    projectId: process.env.BROWSERBASE_PROJECT_ID,
    // Stagehand v2.5 acepta estos model names para Claude:
    //   claude-3-7-sonnet-latest    ← alias NO existe en Anthropic → 404
    //   claude-3-7-sonnet-20250219  ← requiere acceso a sonnet 3.7 en la cuenta
    //   claude-haiku-4-5            ← MÁS BARATO + accesible a casi toda cuenta
    // Usamos haiku-4-5 porque la cuenta no tiene acceso a sonnet-3.7 y porque
    // observe() son llamadas frecuentes (~1.5s) — mejor un modelo rápido y barato.
    modelName: process.env.STAGEHAND_MODEL ?? "claude-haiku-4-5",
    modelClientOptions: { apiKey: process.env.ANTHROPIC_API_KEY },
    // disablePino: en Vercel serverless, pino-pretty no está disponible y
    // Stagehand crashea con "unable to determine transport target". Lo
    // deshabilitamos entero — los logs igual van a Vercel runtime logs.
    disablePino: true,
  });

  const init = await stagehand.init();
  const sessionId = stagehand.browserbaseSessionID ?? init.sessionId;
  if (!sessionId) {
    await stagehand.close();
    throw new Error("Stagehand init did not return a sessionId");
  }

  const debuggerUrl = await resolveDebuggerUrl(sessionId, init.debugUrl);

  if (opts.startUrl) {
    try {
      await stagehand.page.goto(opts.startUrl, { waitUntil: "domcontentloaded" });
    } catch (err) {
      console.warn("[session-manager] goto error:", (err as Error).message);
    }
  }

  const handle: SessionHandle = {
    sessionId,
    debuggerUrl,
    startUrl: opts.startUrl,
    createdAt: new Date().toISOString(),
    snapshots: [],
  };

  pool().set(sessionId, { stagehand, handle });

  console.log(`[session-manager] created sessionId=${sessionId}`);
  return handle;
}

export function getHandle(sessionId: string): SessionHandle | null {
  return pool().get(sessionId)?.handle ?? null;
}

export function getStagehand(sessionId: string): Stagehand | null {
  return pool().get(sessionId)?.stagehand ?? null;
}

export async function snapshot(sessionId: string): Promise<BrowserSnapshot> {
  const entry = pool().get(sessionId);
  if (!entry) throw new Error(`Session ${sessionId} not found`);
  const { stagehand, handle } = entry;

  const page = stagehand.page;
  const url = page.url();
  const title = await page.title().catch(() => "");

  // NOTA: NO usamos stagehand.page.observe() porque:
  //   1. Cada call cuesta tokens Claude (10K/min free tier se acaba rápido)
  //   2. Stagehand v2.5 tiene race condition con CDP que tira "DOM.disable"
  //   3. Los field_values via page.evaluate() son suficientes para inferencia
  // Si en el futuro querés activarlo, exportá ENABLE_STAGEHAND_OBSERVE=true.
  let observations: string[] = [];
  if (process.env.ENABLE_STAGEHAND_OBSERVE === "true") {
    try {
      const obs = await stagehand.page.observe();
      observations = obs.slice(0, 8).map((o: { description: string }) => o.description);
    } catch {
      // ignore — fall through con observations vacío
    }
  }

  let field_values: Record<string, string> = {};
  let visible_text: string[] = [];
  try {
    const scraped = await page.evaluate(() => {
      const out: Record<string, string> = {};
      const inputs = document.querySelectorAll<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >("input, textarea, select");
      inputs.forEach((el) => {
        const name =
          el.getAttribute("name") ||
          el.id ||
          el.getAttribute("placeholder") ||
          "";
        const val = (el as HTMLInputElement).value ?? "";
        if (name && val) out[name] = String(val).slice(0, 150);
      });

      // Capturamos labels visibles + headings → suficiente para que Claude
      // infiera el shape de los campos sin necesidad de stagehand.observe()
      const texts: string[] = [];
      document
        .querySelectorAll("label, h1, h2, h3, th")
        .forEach((el) => {
          const t = (el.textContent ?? "").trim();
          if (t && t.length < 80) texts.push(t);
        });

      return { fields: out, texts: texts.slice(0, 20) };
    });
    field_values = scraped.fields;
    visible_text = scraped.texts;
  } catch {
    // página todavía no lista o cross-origin issue — skip silencioso
  }

  // Si no usamos observe(), pasamos los textos visibles como "observations"
  // para que Claude tenga contexto útil
  if (observations.length === 0) observations = visible_text;

  const snap: BrowserSnapshot = {
    taken_at: new Date().toISOString(),
    url,
    title,
    observations,
    field_values,
  };

  // Only push if URL changed or substantial difference — keeps snapshots distinct
  const last = handle.snapshots[handle.snapshots.length - 1];
  if (!last || last.url !== snap.url || JSON.stringify(last.field_values) !== JSON.stringify(snap.field_values)) {
    handle.snapshots.push(snap);
  } else {
    // refresh observations only
    last.observations = snap.observations;
    last.taken_at = snap.taken_at;
  }

  return snap;
}

export async function closeSession(sessionId: string): Promise<void> {
  const entry = pool().get(sessionId);
  if (!entry) return;
  try {
    await entry.stagehand.close();
  } catch (err) {
    console.warn(
      "[session-manager] close error:",
      (err as Error).message,
    );
  } finally {
    pool().delete(sessionId);
    console.log(`[session-manager] closed sessionId=${sessionId}`);
  }
}

export function listSessions(): SessionHandle[] {
  return [...pool().values()].map((e) => e.handle);
}

// ============================================================
// Helpers
// ============================================================

/**
 * Resuelve el debuggerUrl (URL del live view iframe-able).
 * Stagehand init() ya devuelve uno, pero a veces es undefined; en ese caso
 * llamamos directo al REST de Browserbase: GET /v1/sessions/:id/debug.
 */
async function resolveDebuggerUrl(
  sessionId: string,
  fallback?: string,
): Promise<string> {
  if (fallback) return fallback;
  const apiKey = process.env.BROWSERBASE_API_KEY;
  if (!apiKey) throw new Error("Missing BROWSERBASE_API_KEY");

  const res = await fetch(
    `https://api.browserbase.com/v1/sessions/${sessionId}/debug`,
    { headers: { "x-bb-api-key": apiKey } },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Browserbase debug API ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { debuggerUrl?: string; debuggerFullscreenUrl?: string };
  return json.debuggerFullscreenUrl ?? json.debuggerUrl ?? "";
}
