"use client";

import { useState } from "react";

const TESTS: { name: string; endpoint: string; method: "GET" | "POST"; body?: unknown }[] = [
  {
    name: "Capa 3: Gemini recommendations",
    endpoint: "/api/recommendations",
    method: "POST",
    body: {
      tendero_id: "test",
      zone_id: "Monterrey-Norte",
      historical_baseline: { "Indio 355ml": 100 },
    },
  },
  {
    name: "Capa 2: ElevenLabs voice",
    endpoint: "/api/voice",
    method: "POST",
    body: { text: "Hola, soy Themis" },
  },
  {
    name: "Capa 6: Solana health (wallet + balance)",
    endpoint: "/api/solana/health",
    method: "GET",
  },
];

export function CheckEnv() {
  const [results, setResults] = useState<
    Record<string, { ok: boolean; status: number; body: string } | null>
  >({});
  const [testing, setTesting] = useState(false);

  const runAll = async () => {
    setTesting(true);
    setResults({});
    for (const t of TESTS) {
      try {
        const res = await fetch(t.endpoint, {
          method: t.method,
          headers: t.body ? { "Content-Type": "application/json" } : undefined,
          body: t.body ? JSON.stringify(t.body) : undefined,
        });
        const text = await res.text();
        setResults((r) => ({
          ...r,
          [t.name]: {
            ok: res.ok,
            status: res.status,
            body: text.slice(0, 200),
          },
        }));
      } catch (err) {
        setResults((r) => ({
          ...r,
          [t.name]: { ok: false, status: 0, body: (err as Error).message },
        }));
      }
    }
    setTesting(false);
  };

  return (
    <div className="rounded-lg border border-default p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Tests en vivo de endpoints</p>
        <button
          onClick={runAll}
          disabled={testing}
          className="px-3 py-1.5 text-xs rounded bg-coral text-white hover:bg-coral/90 disabled:opacity-50"
        >
          {testing ? "Probando..." : "Probar endpoints"}
        </button>
      </div>

      <div className="space-y-2">
        {TESTS.map((t) => {
          const r = results[t.name];
          return (
            <div
              key={t.name}
              className="flex items-start justify-between gap-3 py-2 border-b border-subtle last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm">{t.name}</p>
                <p className="text-xs font-mono text-text-tertiary">
                  {t.method} {t.endpoint}
                </p>
              </div>
              <div className="text-right">
                {!r ? (
                  <span className="text-xs text-text-tertiary">—</span>
                ) : r.ok ? (
                  <span className="text-xs text-status-success font-mono">
                    ✓ {r.status}
                  </span>
                ) : (
                  <div className="text-xs space-y-1">
                    <span className="text-status-error font-mono">
                      ✗ {r.status}
                    </span>
                    <p className="text-text-tertiary max-w-xs truncate">
                      {r.body}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
