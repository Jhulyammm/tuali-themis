/**
 * Themis — BrowserSessionManager (Capa 1) — STATELESS para serverless.
 *
 * IMPORTANTE: en Vercel/serverless cada lambda invocation es una instancia
 * separada. Memoria entre requests NO existe. Refactor a stateless:
 *
 *   - createSession(): crea sesión Browserbase, retorna handle SIN guardar
 *   - attachToSession(): instancia Stagehand re-conectada a una sesión existente
 *   - snapshot(): attach + scrape + retorna sin mantener nada
 *   - closeSession(): cierra vía Browserbase REST API
 *
 * El cliente mantiene los snapshots en su React state. El server es stateless.
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
  /** Texto resumido (labels visibles, headings) — contexto para Claude */
  observations: string[];
  /** Form field values visibles (input.value scraped) */
  field_values: Record<string, string>;
}

export interface SessionHandle {
  sessionId: string;
  debuggerUrl: string;
  startUrl: string;
  createdAt: string;
  /** El cliente acumula snapshots acá entre llamadas. Server no las guarda. */
  snapshots: BrowserSnapshot[];
}

export interface CreateSessionOpts {
  startUrl: string;
  remote?: boolean;
}

// ============================================================
// Stagehand factory — siempre reusable, opt-in al attach
// ============================================================

function buildStagehand(existingSessionId?: string): Stagehand {
  return new Stagehand({
    env: "BROWSERBASE",
    apiKey: process.env.BROWSERBASE_API_KEY,
    projectId: process.env.BROWSERBASE_PROJECT_ID,
    modelName: process.env.STAGEHAND_MODEL ?? "claude-haiku-4-5",
    modelClientOptions: { apiKey: process.env.ANTHROPIC_API_KEY },
    disablePino: true,
    // Si pasamos browserbaseSessionID, Stagehand se reconecta a esa sesión
    // en lugar de crear una nueva. Esto es clave para serverless.
    ...(existingSessionId ? { browserbaseSessionID: existingSessionId } : {}),
  });
}

// ============================================================
// Public API
// ============================================================

export async function createSession(
  opts: CreateSessionOpts,
): Promise<SessionHandle> {
  // CRÍTICO: creamos la sesión Browserbase directamente vía REST con
  // keepAlive=true. Si la creamos vía Stagehand sin keepAlive, cuando
  // stagehand.close() corre la sesión también se cierra y los subsequent
  // observe/finalize fallan con "session no longer alive".
  const apiKey = process.env.BROWSERBASE_API_KEY;
  const projectId = process.env.BROWSERBASE_PROJECT_ID;
  if (!apiKey || !projectId) {
    throw new Error("Missing BROWSERBASE_API_KEY o BROWSERBASE_PROJECT_ID");
  }

  const createRes = await fetch("https://api.browserbase.com/v1/sessions", {
    method: "POST",
    headers: {
      "x-bb-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      projectId,
      keepAlive: true,
      // Timeout default es 5 min — sobra para teach/execute
    }),
  });
  if (!createRes.ok) {
    const text = await createRes.text();
    throw new Error(
      `Browserbase create ${createRes.status}: ${text.slice(0, 200)}`,
    );
  }
  const sessionData = (await createRes.json()) as {
    id: string;
    connectUrl?: string;
  };
  const sessionId = sessionData.id;
  const debuggerUrl = await resolveDebuggerUrl(sessionId);

  // Si hay startUrl, instanciamos Stagehand attachado para navegar inicial,
  // después cerramos local. La sesión queda viva por keepAlive=true.
  if (opts.startUrl) {
    const stagehand = buildStagehand(sessionId);
    try {
      await stagehand.init();
      await stagehand.page.goto(opts.startUrl, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
    } catch (err) {
      console.warn(
        "[session-manager] initial goto failed:",
        (err as Error).message,
      );
    } finally {
      try {
        await stagehand.close();
      } catch {
        /* ignore */
      }
    }
  }

  console.log(`[session-manager] created sessionId=${sessionId} (keepAlive)`);

  return {
    sessionId,
    debuggerUrl,
    startUrl: opts.startUrl,
    createdAt: new Date().toISOString(),
    snapshots: [],
  };
}

/**
 * Toma una snapshot del estado actual de la sesión Browserbase remota.
 * Crea una instancia EFÍMERA de Stagehand attachada a la sesión existente.
 */
export async function snapshot(sessionId: string): Promise<BrowserSnapshot> {
  if (!isValidSessionId(sessionId)) {
    throw new Error("Invalid sessionId format");
  }

  // Verificar que la sesión BROWSERBASE sigue viva antes de attach
  const alive = await isSessionAlive(sessionId);
  if (!alive) {
    throw new Error("Browserbase session no longer alive");
  }

  const stagehand = buildStagehand(sessionId);

  try {
    await stagehand.init();
    const page = stagehand.page;
    const url = page.url();
    const title = await page.title().catch(() => "");

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

        const texts: string[] = [];
        document
          .querySelectorAll("label, h1, h2, h3, th, button")
          .forEach((el) => {
            const t = (el.textContent ?? "").trim();
            if (t && t.length < 80) texts.push(t);
          });

        return { fields: out, texts: texts.slice(0, 24) };
      });
      field_values = scraped.fields;
      visible_text = scraped.texts;
    } catch {
      /* página todavía cargando o cross-origin — skip */
    }

    return {
      taken_at: new Date().toISOString(),
      url,
      title,
      observations: visible_text,
      field_values,
    };
  } finally {
    try {
      await stagehand.close();
    } catch {
      /* ignore */
    }
  }
}

/**
 * Cierra la sesión Browserbase vía REST API. No depende de memoria local.
 */
export async function closeSession(sessionId: string): Promise<void> {
  if (!isValidSessionId(sessionId)) return;

  const apiKey = process.env.BROWSERBASE_API_KEY;
  const projectId = process.env.BROWSERBASE_PROJECT_ID;
  if (!apiKey || !projectId) return;

  try {
    await fetch(
      `https://api.browserbase.com/v1/sessions/${sessionId}`,
      {
        method: "POST",
        headers: {
          "x-bb-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId, status: "REQUEST_RELEASE" }),
      },
    );
    console.log(`[session-manager] closed sessionId=${sessionId}`);
  } catch (err) {
    console.warn(
      "[session-manager] close error:",
      (err as Error).message,
    );
  }
}

/**
 * Para que execute() pueda re-usar una sesión observe. Stateless — el caller
 * pasa el sessionId; aquí solo construimos la Stagehand attachada.
 */
export function attachStagehand(sessionId: string): Stagehand {
  return buildStagehand(sessionId);
}

// ============================================================
// Helpers
// ============================================================

const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

function isValidSessionId(sessionId: string): boolean {
  return SESSION_ID_PATTERN.test(sessionId);
}

async function isSessionAlive(sessionId: string): Promise<boolean> {
  const apiKey = process.env.BROWSERBASE_API_KEY;
  if (!apiKey) return false;
  try {
    const res = await fetch(
      `https://api.browserbase.com/v1/sessions/${sessionId}`,
      { headers: { "x-bb-api-key": apiKey } },
    );
    if (!res.ok) return false;
    const json = (await res.json()) as { status?: string };
    // RUNNING o PENDING ambos están "vivos" — la sesión se puede usar.
    // COMPLETED / TIMED_OUT / ERROR = muerta.
    return json.status === "RUNNING" || json.status === "PENDING";
  } catch {
    // Si el check mismo falla (network blip), asumimos viva — el attach
    // siguiente fallará si realmente está muerta.
    return true;
  }
}

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
  const json = (await res.json()) as {
    debuggerUrl?: string;
    debuggerFullscreenUrl?: string;
  };
  return json.debuggerFullscreenUrl ?? json.debuggerUrl ?? "";
}

// ============================================================
// Deprecated (mantenidos para no romper imports — todos no-op)
// ============================================================

/** @deprecated Stateless ahora — el cliente mantiene el handle. */
export function getHandle(_sessionId: string): SessionHandle | null {
  return null;
}

/** @deprecated Stateless ahora. Use attachStagehand() para una instancia efímera. */
export function getStagehand(_sessionId: string): Stagehand | null {
  return null;
}

/** @deprecated Stateless ahora. */
export function listSessions(): SessionHandle[] {
  return [];
}
