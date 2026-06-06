"use client";

import { useState, useEffect } from "react";
import { ExternalLink, MousePointer2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrowserViewerProps {
  url: string;
  status?: "idle" | "observing" | "executing";
  className?: string;
  screenshotUrl?: string;
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
        "relative aspect-[4/3] bg-bg-elevated rounded-xl overflow-hidden border border-border",
        status === "observing" && "ring-2 ring-status-warning ring-offset-1",
        className,
      )}
    >
      {/* Simulated browser chrome */}
      <div className="absolute inset-x-0 top-0 px-3 py-2 bg-white border-b border-border flex items-center gap-2 z-10">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 px-3 py-1 bg-bg-elevated rounded-md text-xs font-mono text-text-tertiary truncate border border-border">
          {url}
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-text-secondary hover:text-coral inline-flex items-center gap-1 transition-colors flex-shrink-0"
        >
          Abrir <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Status badge when observing */}
      {status === "observing" && (
        <div className="absolute top-10 right-2 z-20 flex items-center gap-1.5 bg-status-warning-bg text-status-warning text-[10px] font-mono font-semibold px-2 py-1 rounded-full border border-status-warning/30">
          <span className="w-1.5 h-1.5 rounded-full bg-status-warning animate-pulse" />
          OBSERVANDO
        </div>
      )}

      {/* Body */}
      <div className="absolute inset-x-0 top-9 bottom-0 overflow-hidden">
        {screenshotUrl ? (
          <img
            src={screenshotUrl}
            alt="Navegador"
            className="max-w-full max-h-full object-contain"
          />
        ) : status === "observing" ? (
          <LegacyERPMockup />
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

/* ——— Legacy ERP mockup — mostrado cuando status="observing" ——— */

const LEGACY_FIELDS = [
  { label: "Product Name", value: "Blue Top", id: "name" },
  { label: "Price", value: "Rs. 500", id: "price" },
  { label: "Brand", value: "H&M", id: "brand" },
  { label: "Category", value: "Women > Tops", id: "category" },
  { label: "Availability", value: "In Stock", id: "stock" },
  { label: "Product Code", value: "EX-001-BT", id: "code" },
];

function LegacyERPMockup() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setActiveIdx((i) => (i + 1) % LEGACY_FIELDS.length),
      1800,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="w-full h-full overflow-auto text-[11px]"
      style={{ fontFamily: "Tahoma, Geneva, 'MS Sans Serif', sans-serif", background: "#fff" }}
    >
      {/* Legacy toolbar */}
      <div style={{ background: "#ECE9D8", borderBottom: "1px solid #ACA899", padding: "3px 6px", display: "flex", gap: 4 }}>
        {["File", "View", "Products", "Help"].map((m) => (
          <span key={m} style={{ padding: "1px 6px", cursor: "default", color: "#000" }}>{m}</span>
        ))}
      </div>

      {/* Page body */}
      <div style={{ padding: "8px" }}>
        {/* Section header */}
        <div style={{ background: "#D4E3FA", border: "1px solid #7599C0", padding: "3px 6px", fontWeight: "bold", marginBottom: "6px", color: "#003366" }}>
          Product Details — automationexercise.com
        </div>

        {/* Fields table */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {LEGACY_FIELDS.map((f, i) => (
              <tr
                key={f.id}
                style={{
                  background: i === activeIdx ? "#FEF6E0" : i % 2 === 0 ? "#F5F5F5" : "#fff",
                  outline: i === activeIdx ? "1px solid #F5B301" : "1px solid transparent",
                  transition: "background 0.25s",
                }}
              >
                <td style={{ padding: "4px 8px", fontWeight: 600, color: "#333", width: "40%", borderRight: "1px solid #ddd" }}>
                  {f.label}
                </td>
                <td style={{ padding: "4px 8px", color: i === activeIdx ? "#B45309" : "#111", fontWeight: i === activeIdx ? 600 : 400 }}>
                  {f.value}
                  {i === activeIdx && (
                    <span style={{ marginLeft: 6, color: "#C8102E", fontSize: 10, fontWeight: 700 }}>
                      ← Themis
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Status bar */}
        <div style={{ marginTop: 8, padding: "3px 6px", background: "#ECE9D8", border: "1px solid #ACA899", color: "#444", display: "flex", justifyContent: "space-between" }}>
          <span>Leyendo: {LEGACY_FIELDS[activeIdx].label}</span>
          <span style={{ color: "#C8102E", fontWeight: 600 }}>● Themis observando</span>
        </div>
      </div>
    </div>
  );
}

/* ——— Placeholder estático (idle / executing) ——— */

function Placeholder({
  status,
  url,
}: {
  status: BrowserViewerProps["status"];
  url: string;
}) {
  return (
    <div className="text-center space-y-3 px-6 flex flex-col items-center justify-center h-full">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-bg-elevated">
        {status === "executing" ? (
          <MousePointer2 className="w-5 h-5 text-coral animate-pulse" />
        ) : (
          <Eye className="w-5 h-5 text-text-tertiary" />
        )}
      </div>
      <p className="text-sm text-text-secondary">
        {status === "executing" ? "Themis controlando navegador" : "Listo para observar"}
      </p>
      <p className="text-xs text-text-tertiary font-mono break-all">{url}</p>
      {status === "idle" && (
        <p className="text-xs text-text-tertiary max-w-xs">
          Haz clic en "Visual demo" para ver a Themis observando un proceso en tiempo real.
        </p>
      )}
    </div>
  );
}
