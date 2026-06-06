/**
 * BrowserViewer — placeholder visual para el navegador embebido.
 *
 * Muchos sitios reales (automationexercise.com, OXXO portal, etc.) bloquean
 * iframe embedding con X-Frame-Options. En lugar de mostrar un iframe roto,
 * mostramos un placeholder con link "Abrir en nueva pestaña" + screenshot.
 *
 * En el demo real, se usará Browserbase live view (server-side rendering del
 * navegador headless). Para mockups y desarrollo, este componente alcanza.
 *
 * TODO Marita: cuando Ale entregue mockup del navegador embedded, pulir esta UI.
 */

"use client";

import { ExternalLink, MousePointer2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrowserViewerProps {
  url: string;
  status?: "idle" | "observing" | "executing";
  className?: string;
  /** Si está disponible, muestra screenshot en lugar de placeholder */
  screenshotUrl?: string;
  /** Coordenadas del cursor autónomo si está ejecutando */
  cursor?: { x: number; y: number } | null;
}

export function BrowserViewer({
  url,
  status = "idle",
  className,
  screenshotUrl,
  cursor,
}: BrowserViewerProps) {
  return (
    <div
      className={cn(
        "relative aspect-[4/3] bg-bg-elevated rounded-md overflow-hidden border border-default",
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
        <div className="flex-1 px-3 py-1 bg-bg-base rounded text-xs font-mono text-text-tertiary truncate">
          {url}
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-text-secondary hover:text-coral inline-flex items-center gap-1 transition-colors"
        >
          Abrir <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Body */}
      <div className="absolute inset-x-0 top-9 bottom-0 flex items-center justify-center">
        {screenshotUrl ? (
          <img
            src={screenshotUrl}
            alt="Navegador"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <Placeholder status={status} url={url} />
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

function Placeholder({ status, url }: { status: BrowserViewerProps["status"]; url: string }) {
  const labels = {
    idle: "Esperando inicio",
    observing: "Observando interacciones del usuario",
    executing: "Themis controlando navegador",
  };
  const label = labels[status ?? "idle"];

  return (
    <div className="text-center space-y-3 px-6">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-bg-overlay">
        <MousePointer2 className="w-5 h-5 text-text-tertiary" />
      </div>
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="text-xs text-text-tertiary font-mono break-all">{url}</p>
      <p className="text-xs text-text-tertiary max-w-xs mx-auto">
        El sitio bloquea iframes. Para ver el flujo real, abre la URL en una pestaña aparte
        y reproduce el proceso desde ahí mientras Themis observa.
      </p>
    </div>
  );
}
