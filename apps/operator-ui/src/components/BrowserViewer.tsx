/**
 * BrowserViewer — vista del navegador EN VIVO controlado por Browserbase.
 *
 * Cuando hay debuggerUrl, embebe el iframe del debugger de Browserbase: un
 * browser real, interactivo, donde el operador puede hacer clic. Browserbase
 * hospeda su propio dominio para el debugger (no afectado por X-Frame-Options
 * del sitio destino), por eso es iframe-able sin tricks.
 *
 * Botones:
 *   - "Pantalla completa"  → expande el iframe a fullscreen del display
 *   - "Pop-up"             → abre el debugger en ventana nueva del SO (~1400x900)
 *   - "Abrir"              → abre el sitio origen en una pestaña aparte
 */

"use client";

import { useRef } from "react";
import {
  ExternalLink,
  MousePointer2,
  Power,
  Loader2,
  Maximize2,
  ExternalLinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BrowserViewerProps {
  url: string;
  status?: "idle" | "creating" | "observing" | "executing";
  className?: string;
  /** URL del debugger Browserbase a embeber; sin él se muestra placeholder. */
  debuggerUrl?: string;
  /**
   * Si true, en vez de Browserbase debugger embebemos directamente la `url`
   * en un iframe normal. Útil cuando la URL es nuestra (source-system,
   * erp-destino) — bypassa el problema de Browserbase cerrando sesiones
   * y le da al usuario un iframe interactivo confiable.
   */
  directEmbed?: boolean;
  /** Coordenadas del cursor autónomo si está ejecutando (overlay decorativo) */
  cursor?: { x: number; y: number } | null;
}

export function BrowserViewer({
  url,
  status = "idle",
  className,
  debuggerUrl,
  directEmbed,
  cursor,
}: BrowserViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const goFullscreen = () => {
    const el = iframeRef.current;
    if (!el) return;
    if (el.requestFullscreen) {
      void el.requestFullscreen();
    }
  };

  const popOut = () => {
    if (!debuggerUrl) return;
    window.open(
      debuggerUrl,
      "browserbase-popout",
      "width=1400,height=900,toolbar=no,menubar=no",
    );
  };

  return (
    <div
      className={cn(
        "relative bg-bg-elevated rounded-md overflow-hidden border border-default",
        "h-[640px] min-h-[480px]",
        className,
      )}
    >
      {/* URL bar simulada */}
      <div className="absolute inset-x-0 top-0 px-3 py-2 bg-bg-surface border-b border-subtle flex items-center gap-2 z-10">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-status-error/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-status-warning/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-status-success/60" />
        </div>
        <div className="flex-1 px-3 py-1 bg-bg-base rounded text-xs font-mono text-text-tertiary truncate flex items-center gap-2">
          {status !== "idle" && (
            <span
              className={cn(
                "inline-block w-2 h-2 rounded-full",
                status === "creating" && "bg-status-warning animate-pulse",
                status === "observing" && "bg-coral animate-pulse",
                status === "executing" && "bg-status-success animate-pulse",
              )}
            />
          )}
          {url}
        </div>
        {debuggerUrl && (
          <>
            <button
              type="button"
              onClick={goFullscreen}
              className="text-xs text-text-secondary hover:text-coral inline-flex items-center gap-1 transition-colors"
              title="Pantalla completa del iframe"
            >
              Pantalla completa <Maximize2 className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={popOut}
              className="text-xs text-text-secondary hover:text-coral inline-flex items-center gap-1 transition-colors"
              title="Abrir el navegador en ventana aparte"
            >
              Pop-up <ExternalLinkIcon className="w-3 h-3" />
            </button>
          </>
        )}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-text-secondary hover:text-coral inline-flex items-center gap-1 transition-colors"
          title="Abrir el sitio origen en pestaña aparte"
        >
          Abrir <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Body */}
      <div className="absolute inset-x-0 top-9 bottom-0 bg-white">
        {directEmbed && url ? (
          // Iframe DIRECTO al sitio — confiable, no depende de Browserbase
          <iframe
            ref={iframeRef}
            src={url}
            className="w-full h-full border-0 bg-white"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
            allow="clipboard-write; clipboard-read; fullscreen"
            title="Sistema A — iframe directo"
          />
        ) : debuggerUrl ? (
          <iframe
            ref={iframeRef}
            src={debuggerUrl}
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
            allow="clipboard-write; clipboard-read; fullscreen"
            title="Browserbase live session"
          />
        ) : (
          <EmptyState status={status} url={url} />
        )}

        {cursor && (
          <div
            className="absolute pointer-events-none transition-all duration-300 ease-spring"
            style={{
              left: `${cursor.x}%`,
              top: `${cursor.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="w-2 h-2 rounded-full bg-coral shadow-[0_0_16px_4px_hsl(var(--accent-coral-glow))]" />
            <MousePointer2 className="w-4 h-4 text-coral absolute -top-1 -left-1" />
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  status,
  url,
}: {
  status: BrowserViewerProps["status"];
  url: string;
}) {
  const isCreating = status === "creating";

  return (
    <div className="w-full h-full flex items-center justify-center bg-bg-elevated">
      <div className="text-center space-y-3 px-6 max-w-sm">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-bg-overlay">
          {isCreating ? (
            <Loader2 className="w-6 h-6 text-coral animate-spin" />
          ) : (
            <Power className="w-6 h-6 text-text-tertiary" />
          )}
        </div>
        <p className="text-sm font-medium text-text-primary">
          {isCreating
            ? "Iniciando navegador en Browserbase…"
            : "Navegador listo para arrancar"}
        </p>
        <p className="text-xs text-text-tertiary font-mono break-all">{url}</p>
        {!isCreating && (
          <p className="text-xs text-text-tertiary">
            Al iniciar, vas a ver un navegador real corriendo en Browserbase
            (visible y manejable desde acá).
          </p>
        )}
      </div>
    </div>
  );
}
