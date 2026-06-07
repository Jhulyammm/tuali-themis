/**
 * useContextualEvents — Capa 3 hook (eventos REALES vía grounding).
 *
 * Llama a /api/events con un zone_id y devuelve los eventos próximos reales,
 * las fuentes web que Gemini consultó (grounding) y el origen del dato.
 */

"use client";

import { useCallback, useState } from "react";
import type { ContextualEvent, ZoneContext } from "@hack4her/playbooks";

interface FetchArgs {
  zone?: ZoneContext;
  zone_id?: string;
  within_days?: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

interface EventsResult {
  zone: ZoneContext;
  events: ContextualEvent[];
  seasonal_context: string;
  sources: GroundingSource[];
  search_queries: string[];
  source_type: "live" | "calendar";
  generated_at: string;
}

interface UseContextualEventsReturn {
  fetch: (args: FetchArgs) => Promise<EventsResult | null>;
  events: ContextualEvent[];
  seasonalContext: string;
  sources: GroundingSource[];
  searchQueries: string[];
  sourceType: "live" | "calendar" | null;
  generatedAt: string | null;
  loading: boolean;
  error: string | null;
}

export function useContextualEvents(): UseContextualEventsReturn {
  const [events, setEvents] = useState<ContextualEvent[]>([]);
  const [seasonalContext, setSeasonalContext] = useState<string>("");
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [sourceType, setSourceType] = useState<"live" | "calendar" | null>(
    null,
  );
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async (args: FetchArgs) => {
    setLoading(true);
    setError(null);
    try {
      const res = await window.fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
      if (!res.ok) {
        const errBody = (await res.json()) as { error?: string };
        throw new Error(errBody.error ?? "Events failed");
      }
      const data = (await res.json()) as EventsResult;
      setEvents(data.events);
      setSeasonalContext(data.seasonal_context ?? "");
      setSources(data.sources ?? []);
      setSearchQueries(data.search_queries ?? []);
      setSourceType(data.source_type);
      setGeneratedAt(data.generated_at);
      return data;
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    fetch: fetchEvents,
    events,
    seasonalContext,
    sources,
    searchQueries,
    sourceType,
    generatedAt,
    loading,
    error,
  };
}
