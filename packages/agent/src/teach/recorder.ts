/**
 * Themis — Recorder (Capa 1 · DEPRECATED)
 *
 * El flujo actual de observación NO usa este recorder client-side. En su lugar
 * usa packages/agent/src/browser/session-manager.ts: la observación ocurre
 * server-side via Stagehand snapshots sobre la sesión Browserbase embebida.
 * Razón: capturar DOM events desde dentro de un iframe cross-origin no es
 * posible, mientras que Browserbase nos da acceso al page real desde el server.
 *
 * Se preserva este archivo por si en algún futuro se quiere narración + audio
 * en el lado del operador (Whisper transcription sigue funcionando en /api/whisper).
 */

import type {
  Recording,
  RecordingEvent,
  RecordingEventType,
} from "@hack4her/playbooks";

// ============================================================
// Config
// ============================================================

export interface RecorderConfig {
  /** URL of the source system (Sistema A) being observed */
  sourceUrl: string;
  /** URL of the destination system (Sistema B) being observed */
  destinationUrl?: string;
  /** Screenshot interval in ms; default 500 */
  screenshotIntervalMs?: number;
  /** Enable audio narration capture via Whisper; default true */
  audioEnabled?: boolean;
  /** Optional iframe ref to attach observers to (if recording embedded browser) */
  targetIframe?: HTMLIFrameElement;
  /** Callback fired on every new event captured (for live UI updates) */
  onEvent?: (event: RecordingEvent) => void;
}

// ============================================================
// Recorder
// ============================================================

export class Recorder {
  private events: RecordingEvent[] = [];
  private screenshotTimer?: ReturnType<typeof setInterval>;
  private mediaStream?: MediaStream;
  private audioRecorder?: MediaRecorder;
  private audioChunks: Blob[] = [];
  private startTime = 0;
  private domCleanup?: () => void;
  private config?: RecorderConfig;
  private isRecording = false;

  /** Start a new recording session. Resolves immediately; events stream via onEvent. */
  async start(config: RecorderConfig): Promise<void> {
    if (this.isRecording) throw new Error("Recorder already started");
    this.config = config;
    this.events = [];
    this.audioChunks = [];
    this.startTime = Date.now();
    this.isRecording = true;

    this.setupDomObserver();
    this.startScreenshotLoop(config.screenshotIntervalMs ?? 500);
    if (config.audioEnabled !== false) {
      await this.startAudioCapture();
    }
  }

  /** Stop the recording and return the assembled Recording object. */
  async stop(): Promise<Recording> {
    if (!this.isRecording) throw new Error("Recorder not started");
    this.isRecording = false;

    if (this.screenshotTimer) clearInterval(this.screenshotTimer);
    if (this.domCleanup) this.domCleanup();

    const audio_transcript = await this.stopAudioAndTranscribe();
    const duration_ms = Date.now() - this.startTime;

    const recording: Recording = {
      id: crypto.randomUUID(),
      events: [...this.events],
      audio_transcript,
      duration_ms,
      source_url: this.config?.sourceUrl,
      destination_url: this.config?.destinationUrl,
      created_at: new Date().toISOString(),
    };

    return recording;
  }

  // ============================================================
  // Internal: DOM observer
  // ============================================================

  private setupDomObserver(): void {
    const target =
      this.config?.targetIframe?.contentDocument ?? document;
    if (!target) return;

    const handleClick = (e: Event) => {
      if (!(e.target instanceof HTMLElement)) return;
      this.captureEvent("dom_event", {
        kind: "click",
        tag: e.target.tagName.toLowerCase(),
        text: e.target.textContent?.slice(0, 100),
        id: e.target.id || undefined,
        name: e.target.getAttribute("name") || undefined,
        testid: e.target.getAttribute("data-testid") || undefined,
        xpath: this.computeXPath(e.target),
      });
    };

    const handleInput = (e: Event) => {
      if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) return;
      this.captureEvent("dom_event", {
        kind: "fill",
        tag: e.target.tagName.toLowerCase(),
        name: e.target.getAttribute("name") || undefined,
        testid: e.target.getAttribute("data-testid") || undefined,
        value: e.target.value,
        xpath: this.computeXPath(e.target),
      });
    };

    const handleNavigation = () => {
      this.captureEvent("dom_event", {
        kind: "navigate",
        url: (target as Document).location?.href,
      });
    };

    target.addEventListener("click", handleClick, true);
    target.addEventListener("input", handleInput, true);
    target.addEventListener?.("popstate" as keyof DocumentEventMap, handleNavigation as EventListener);

    this.domCleanup = () => {
      target.removeEventListener("click", handleClick, true);
      target.removeEventListener("input", handleInput, true);
      target.removeEventListener?.("popstate" as keyof DocumentEventMap, handleNavigation as EventListener);
    };
  }

  // ============================================================
  // Internal: Screenshots
  // ============================================================

  private startScreenshotLoop(intervalMs: number): void {
    // TODO Jhulyam: integrar con html2canvas o screen capture API.
    // Por ahora solo registra timestamp; el binario va aparte a Supabase Storage.
    this.screenshotTimer = setInterval(() => {
      if (!this.isRecording) return;
      this.captureEvent("screenshot", {
        // Replace with actual screenshot URL once uploaded
        placeholder: true,
        timestamp: Date.now(),
      });
    }, intervalMs);
  }

  // ============================================================
  // Internal: Audio + Whisper
  // ============================================================

  private async startAudioCapture(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      this.audioRecorder = new MediaRecorder(this.mediaStream);
      this.audioRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };
      this.audioRecorder.start(5000); // chunk every 5s
    } catch (err) {
      console.warn("[Recorder] Audio not available:", err);
    }
  }

  private async stopAudioAndTranscribe(): Promise<string | undefined> {
    if (!this.audioRecorder) return undefined;
    return new Promise((resolve) => {
      this.audioRecorder!.onstop = async () => {
        const blob = new Blob(this.audioChunks, { type: "audio/webm" });
        this.mediaStream?.getTracks().forEach((t) => t.stop());
        const transcript = await this.transcribeViaWhisper(blob);
        resolve(transcript);
      };
      this.audioRecorder!.stop();
    });
  }

  private async transcribeViaWhisper(blob: Blob): Promise<string> {
    // Calls our /api/whisper route which proxies to OpenAI Whisper.
    // Server-side route handles the API key (never exposed to client).
    const form = new FormData();
    form.append("file", blob, "narration.webm");
    try {
      const res = await fetch("/api/whisper", { method: "POST", body: form });
      if (!res.ok) return "";
      const json = (await res.json()) as { text?: string };
      return json.text ?? "";
    } catch (err) {
      console.warn("[Recorder] Whisper failed:", err);
      return "";
    }
  }

  // ============================================================
  // Helpers
  // ============================================================

  private captureEvent(type: RecordingEventType, data: unknown): void {
    const event: RecordingEvent = {
      timestamp_ms: Date.now() - this.startTime,
      type,
      data,
    };
    this.events.push(event);
    this.config?.onEvent?.(event);
  }

  private computeXPath(el: HTMLElement): string {
    if (el.id) return `//*[@id="${el.id}"]`;
    const parts: string[] = [];
    let node: HTMLElement | null = el;
    while (node && node.nodeType === 1 && node.parentElement) {
      let i = 1;
      let sib = node.previousElementSibling;
      while (sib) {
        if (sib.tagName === node.tagName) i++;
        sib = sib.previousElementSibling;
      }
      parts.unshift(`${node.tagName.toLowerCase()}[${i}]`);
      node = node.parentElement;
    }
    return "/" + parts.join("/");
  }
}

// ============================================================
// Convenience standalone helper
// ============================================================

/**
 * One-shot recording helper for simple cases.
 * For most use cases, instantiate Recorder directly to get streaming events.
 */
export async function recordOnce(
  config: RecorderConfig,
  durationMs: number,
): Promise<Recording> {
  const recorder = new Recorder();
  await recorder.start(config);
  await new Promise((r) => setTimeout(r, durationMs));
  return recorder.stop();
}
