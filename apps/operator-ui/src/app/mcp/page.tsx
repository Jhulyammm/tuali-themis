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
