/**
 * useActiveClient — cliente Tuali actualmente seleccionado.
 *
 * El cliente activo determina qué playbooks, recomendaciones y métricas
 * se muestran. Persistido en localStorage para sobrevivir refresh.
 *
 * Cargado desde /api/clients (preseed + onboarded). Si no hay cliente
 * activo guardado, default al primero (OXXO Tec).
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import type { Client } from "@hack4her/playbooks";

const STORAGE_KEY = "themis.activeClientId";

interface UseActiveClientReturn {
  clients: Client[];
  activeClient: Client | null;
  setActiveClient: (clientId: string) => void;
  refresh: () => Promise<void>;
  loading: boolean;
}

export function useActiveClient(): UseActiveClientReturn {
  const [clients, setClients] = useState<Client[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/clients");
      if (!res.ok) return;
      const data = (await res.json()) as { clients: Client[] };
      setClients(data.clients ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setActiveId(saved);
    void refresh();
  }, [refresh]);

  // Si no hay cliente activo guardado o el guardado no existe, usa el primero
  useEffect(() => {
    if (clients.length === 0) return;
    const exists = activeId && clients.some((c) => c.id === activeId);
    if (!exists) {
      setActiveId(clients[0].id);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, clients[0].id);
      }
    }
  }, [clients, activeId]);

  const setActiveClient = useCallback((clientId: string) => {
    setActiveId(clientId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, clientId);
    }
    // Notifica a otros tabs/componentes
    window.dispatchEvent(new CustomEvent("themis:client-changed", { detail: clientId }));
  }, []);

  // Sync entre tabs y componentes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: Event) => {
      if (e instanceof CustomEvent && typeof e.detail === "string") {
        setActiveId(e.detail);
      }
    };
    const storageHandler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setActiveId(e.newValue);
      }
    };
    window.addEventListener("themis:client-changed", handler);
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener("themis:client-changed", handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  const activeClient = clients.find((c) => c.id === activeId) ?? null;

  return { clients, activeClient, setActiveClient, refresh, loading };
}
