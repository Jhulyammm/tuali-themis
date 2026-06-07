/**
 * /mcp — la página que demuestra que Themis es INFRAESTRUCTURA, no app.
 *
 * Cualquier IA (Claude Desktop, Cursor, MCP-compatible client) puede invocar
 * a Themis como herramienta. Esto convierte el demo en "look, otros agentes
 * pueden ya usar Themis para Arca Continental".
 */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Terminal,
  Copy,
  Check,
  Network,
  Sparkles,
  ExternalLink,
  Server,
  Play,
  Loader2,
  Zap,
} from "lucide-react";

interface ToolInfo {
  name: string;
  description: string;
}

interface ServerManifest {
  server: { name: string; version: string; description: string };
  tools: ToolInfo[];
  transport: string;
  spec: string;
}

export default function McpPage() {
  const [manifest, setManifest] = useState<ServerManifest | null>(null);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
    void (async () => {
      try {
        const res = await fetch("/api/mcp");
        if (res.ok) setManifest(await res.json());
      } catch {
        /* */
      }
    })();
  }, []);

  const copy = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const claudeDesktopConfig = JSON.stringify(
    {
      mcpServers: {
        themis: {
          url: `${origin}/api/mcp`,
          description: "Themis — agente Tuali / Arca Continental",
        },
      },
    },
    null,
    2,
  );

  const cursorConfig = JSON.stringify(
    {
      "mcp.servers": {
        themis: { url: `${origin}/api/mcp` },
      },
    },
    null,
    2,
  );

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-coral/30 bg-gradient-to-br from-coral/10 via-white to-white p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-coral grid place-items-center shadow-lg shadow-coral/30">
            <Network className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-coral text-white border-0 font-mono uppercase tracking-widest text-[10px]">
                Model Context Protocol
              </Badge>
              <span className="text-xs font-mono uppercase tracking-widest text-text-tertiary">
                Themis es infraestructura
              </span>
            </div>
            <h1 className="text-3xl font-bold text-text-primary leading-tight">
              Themis vive en tu IDE.
              <span className="text-coral"> Y en tu Claude Desktop.</span>
            </h1>
            <p className="text-sm text-text-secondary mt-2 max-w-2xl">
              Themis expone sus 6 capas como tools MCP. Cualquier asistente
              que soporte Model Context Protocol — Claude Desktop, Cursor,
              Zed — puede invocar a Themis para aprender procesos, ejecutar
              playbooks o pedir recomendaciones. Esto convierte a Themis en
              infraestructura cognitiva para Tuali, no en una app aislada.
            </p>
          </div>
        </div>
      </div>

      {/* Tools list */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 text-coral" />
            <p className="font-semibold text-text-primary">
              Tools expuestas {manifest && `· ${manifest.tools.length}`}
            </p>
            <Badge className="bg-status-success/10 text-status-success border-status-success/20 text-[10px]">
              Live
            </Badge>
          </div>
          {manifest ? (
            <div className="space-y-2">
              {manifest.tools.map((t) => (
                <div
                  key={t.name}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-coral/40 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-coral flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-semibold text-text-primary">
                      {t.name}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {t.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-tertiary italic">
              Cargando manifesto MCP...
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tester en vivo — la prueba de que MCP funciona */}
      <LiveTester origin={origin} />

      {/* Endpoint */}
      <Card className="border-coral/30">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-coral" />
            <p className="font-semibold text-text-primary">
              Endpoint MCP en vivo
            </p>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded-lg bg-bg-elevated border border-border font-mono text-sm text-text-primary truncate">
              {origin}/api/mcp
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copy(`${origin}/api/mcp`, "url")}
            >
              {copied === "url" ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-text-tertiary">
            Transport: <span className="font-mono">Streamable HTTP</span> ·
            Protocol: <span className="font-mono">JSON-RPC 2.0</span> · Spec
            version <span className="font-mono">2024-11-05</span>
          </p>
        </CardContent>
      </Card>

      {/* Claude Desktop config */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-text-primary">Claude Desktop</p>
              <span className="text-xs text-text-tertiary">
                ~/Library/Application Support/Claude/claude_desktop_config.json
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copy(claudeDesktopConfig, "claude")}
            >
              {copied === "claude" ? (
                <Check className="w-3.5 h-3.5 mr-1" />
              ) : (
                <Copy className="w-3.5 h-3.5 mr-1" />
              )}
              Copiar config
            </Button>
          </div>
          <pre className="bg-bg-elevated border border-border rounded-lg p-3 text-xs font-mono text-text-primary overflow-x-auto">
            {claudeDesktopConfig}
          </pre>
        </CardContent>
      </Card>

      {/* Cursor config */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-text-primary">Cursor IDE</p>
              <span className="text-xs text-text-tertiary">settings.json</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copy(cursorConfig, "cursor")}
            >
              {copied === "cursor" ? (
                <Check className="w-3.5 h-3.5 mr-1" />
              ) : (
                <Copy className="w-3.5 h-3.5 mr-1" />
              )}
              Copiar config
            </Button>
          </div>
          <pre className="bg-bg-elevated border border-border rounded-lg p-3 text-xs font-mono text-text-primary overflow-x-auto">
            {cursorConfig}
          </pre>
        </CardContent>
      </Card>

      {/* Example calls */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <p className="font-semibold text-text-primary">
            Ejemplo: pedirle a Claude que use Themis
          </p>
          <div className="space-y-3">
            <div className="bg-bg-elevated rounded-lg p-3 border border-border">
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary mb-1">
                Prompt al asistente
              </p>
              <p className="text-sm font-mono text-text-primary">
                &quot;Usa Themis para onboardear el catálogo de Walmart México y
                dame sus mappings hacia el ERP Tuali.&quot;
              </p>
            </div>
            <div className="bg-bg-elevated rounded-lg p-3 border border-border">
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary mb-1">
                Claude invoca
              </p>
              <code className="text-xs font-mono text-coral">
                themis.onboard_client(url=&quot;https://walmart.com.mx&quot;)
              </code>
              <br />
              <code className="text-xs font-mono text-coral">
                themis.learn_from_url(url=&quot;https://walmart.com.mx/catalogo&quot;)
              </code>
            </div>
          </div>
          <a
            href="https://spec.modelcontextprotocol.io"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-coral hover:underline mt-2"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Spec oficial Model Context Protocol</span>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// LiveTester — invoca tools MCP en tiempo real desde el navegador
// ============================================================

interface ToolPreset {
  label: string;
  description: string;
  toolName: string;
  args: Record<string, unknown>;
  approxMs: number;
}

const TOOL_PRESETS: ToolPreset[] = [
  {
    label: "Listar clientes Tuali",
    description: "Devuelve los 4 clientes activos (OXXO, Soriana, Costco, Don Beto) con stats reales.",
    toolName: "themis.list_clients",
    args: {},
    approxMs: 600,
  },
  {
    label: "Listar playbooks aprendidos",
    description: "Todos los playbooks en MongoDB con sus mappings y firmas Solana.",
    toolName: "themis.list_playbooks",
    args: {},
    approxMs: 800,
  },
  {
    label: "Playbooks de OXXO Tec",
    description: "Filtra por cliente. Demuestra que Themis es multi-tenant.",
    toolName: "themis.list_playbooks",
    args: { client_id: "oxxo-tec-mty" },
    approxMs: 800,
  },
  {
    label: "Onboardear 7-Eleven México",
    description: "Themis fetchea el sitio, infiere marca y crea cliente. ~5 segundos.",
    toolName: "themis.onboard_client",
    args: { url: "https://www.7-eleven.com.mx" },
    approxMs: 5500,
  },
  {
    label: "Recomendaciones para OXXO Tec",
    description: "Gemini Deep Research con grounding. Eventos reales. ~10 segundos.",
    toolName: "themis.get_recommendations",
    args: { client_id: "oxxo-tec-mty" },
    approxMs: 11000,
  },
];

function LiveTester({ origin }: { origin: string }) {
  const [activePreset, setActivePreset] = useState<ToolPreset>(TOOL_PRESETS[0]);
  const [request, setRequest] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const buildRpcPayload = (preset: ToolPreset) => ({
    jsonrpc: "2.0",
    id: Date.now(),
    method: "tools/call",
    params: { name: preset.toolName, arguments: preset.args },
  });

  const invoke = async (preset: ToolPreset) => {
    setActivePreset(preset);
    setError(null);
    setResponse("");
    setLatencyMs(null);
    const payload = buildRpcPayload(preset);
    setRequest(JSON.stringify(payload, null, 2));
    setLoading(true);
    const t0 = Date.now();
    try {
      const res = await fetch(`${origin}/api/mcp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setLatencyMs(Date.now() - t0);
      // El resultado del tool viene dentro de result.content[0].text (formato MCP).
      // Si es JSON adentro, lo pretty-printeamos para que se lea mejor.
      let pretty = JSON.stringify(data, null, 2);
      if (
        data?.result?.content &&
        Array.isArray(data.result.content) &&
        data.result.content[0]?.text
      ) {
        try {
          const inner = JSON.parse(data.result.content[0].text);
          pretty = JSON.stringify(
            { ...data, result: { ...data.result, parsed: inner } },
            null,
            2,
          );
        } catch {
          // ignore — el text no era JSON parseable
        }
      }
      setResponse(pretty);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-coral/40 bg-gradient-to-br from-coral/5 via-white to-white">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-coral" />
            <p className="font-semibold text-text-primary">
              Probar MCP en vivo
            </p>
            <Badge className="bg-coral/10 text-coral border-coral/20 text-[10px]">
              JSON-RPC real al endpoint público
            </Badge>
          </div>
          {latencyMs !== null && (
            <span className="text-[11px] font-mono text-text-tertiary">
              respondió en{" "}
              <span className="text-coral font-semibold">{latencyMs}ms</span>
            </span>
          )}
        </div>

        <p className="text-xs text-text-secondary">
          Cualquier asistente IA con MCP puede invocar estas tools. Acá las
          invocamos directo desde el navegador (cliente JS → POST JSON-RPC →
          servidor Themis) para que veas que el endpoint público está vivo y
          devuelve datos reales — no slideware.
        </p>

        {/* Presets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {TOOL_PRESETS.map((preset) => {
            const isActive = preset.label === activePreset.label;
            return (
              <button
                key={preset.label}
                onClick={() => void invoke(preset)}
                disabled={loading}
                className={`text-left p-3 rounded-lg border transition-all ${
                  isActive
                    ? "border-coral bg-coral/5"
                    : "border-border bg-white hover:border-coral/40 hover:bg-coral/5"
                } disabled:opacity-50`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-text-primary">
                    {preset.label}
                  </p>
                  {isActive && loading ? (
                    <Loader2 className="w-3.5 h-3.5 text-coral animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-text-tertiary" />
                  )}
                </div>
                <p className="text-[11px] text-text-secondary leading-snug">
                  {preset.description}
                </p>
                <p className="text-[10px] font-mono text-coral mt-1">
                  {preset.toolName}
                </p>
              </button>
            );
          })}
        </div>

        {/* Request / Response side-by-side */}
        {(request || response) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-3 border-t border-border">
            {/* Request */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary">
                  Request · JSON-RPC 2.0
                </p>
                <span className="text-[10px] font-mono text-text-tertiary">
                  POST /api/mcp
                </span>
              </div>
              <pre className="bg-bg-elevated border border-border rounded-lg p-3 text-[11px] font-mono text-text-primary overflow-x-auto max-h-72 leading-relaxed">
                {request}
              </pre>
            </div>

            {/* Response */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary">
                  Response
                </p>
                {loading && (
                  <span className="text-[10px] font-mono text-coral flex items-center gap-1">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    Themis está procesando...
                  </span>
                )}
                {!loading && latencyMs !== null && (
                  <span className="text-[10px] font-mono text-status-success">
                    ✓ 200 OK · {latencyMs}ms
                  </span>
                )}
              </div>
              <pre className="bg-bg-elevated border border-border rounded-lg p-3 text-[11px] font-mono text-text-primary overflow-x-auto max-h-72 leading-relaxed">
                {error ? `// error: ${error}` : response || "// Esperando invocación..."}
              </pre>
            </div>
          </div>
        )}

        {/* curl equivalente */}
        {request && (
          <details className="border-t border-border pt-3">
            <summary className="cursor-pointer text-[11px] font-mono text-text-tertiary hover:text-coral">
              Ver equivalente curl (terminal)
            </summary>
            <pre className="bg-bg-elevated border border-border rounded-lg p-3 text-[11px] font-mono text-text-primary overflow-x-auto mt-2 leading-relaxed">
              {`curl -X POST ${origin}/api/mcp \\
  -H "Content-Type: application/json" \\
  -d '${request.replace(/\n/g, "").replace(/\s+/g, " ")}'`}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
