/**
 * useRecommendations — Capa 3 hook.
 *
 * Llama a /api/recommendations con contexto (tendero, zona, baseline)
 * y devuelve respuesta de Gemini + loading + error.
 */

"use client";

import { useCallback, useState } from "react";
import type {
  RecommendationsResponse,
  ContextualEvent,
  ZoneContext,
} from "@hack4her/playbooks";

interface FetchArgs {
  tendero_id: string;
  zone?: ZoneContext;
  zone_id?: string;
  historical_baseline: Record<string, number>;
  upcoming_events?: ContextualEvent[];
  seasonal_context?: string;
}

interface UseRecommendationsReturn {
  fetch: (args: FetchArgs) => Promise<RecommendationsResponse | null>;
  response: RecommendationsResponse | null;
  loading: boolean;
  error: string | null;
}

export function useRecommendations(): UseRecommendationsReturn {
  const [response, setResponse] = useState<RecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async (args: FetchArgs) => {
    setLoading(true);
    setError(null);
    try {
      const res = await window.fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
      if (!res.ok) {
        const errBody = (await res.json()) as { error?: string };
        throw new Error(errBody.error ?? "Recommendations failed");
      }
      const data = (await res.json()) as RecommendationsResponse;
      setResponse(data);
      return data;
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetch: fetchRecommendations, response, loading, error };
}
