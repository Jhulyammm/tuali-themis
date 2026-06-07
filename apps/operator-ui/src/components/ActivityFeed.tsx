/**
 * ActivityFeed — el feed de "lo que Themis está viendo" en tiempo real.
 *
 * Reemplaza el silencio incómodo entre voces scripted con eventos
 * granulares que el jurado puede leer. Cada evento aparece con un slide-in
 * desde la derecha y se va apilando arriba.
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Eye,
  Link as LinkIcon,
  Brain,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import type { ActivityEvent } from "@/app/teach/page";

interface Props {
  events: ActivityEvent[];
}

const TYPE_META: Record<
  ActivityEvent["type"],
  { icon: typeof Zap; label: string; color: string; bg: string }
> = {
  navigation: {
    icon: LinkIcon,
    label: "Navegación",
    color: "text-status-info",
    bg: "bg-status-info-bg",
  },
  observation: {
    icon: Eye,
    label: "Observación",
    color: "text-text-secondary",
    bg: "bg-bg-elevated",
  },
  mapping_new: {
    icon: Sparkles,
    label: "Mapeo nuevo",
    color: "text-coral",
    bg: "bg-coral/10",
  },
  transformation: {
    icon: Zap,
    label: "Transformación",
    color: "text-status-warning",
    bg: "bg-status-warning-bg",
  },
  thinking: {
    icon: Brain,
    label: "Pensando",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  system: {
    icon: AlertCircle,
    label: "Sistema",
    color: "text-text-tertiary",
    bg: "bg-bg-elevated",
  },
};

function relativeTime(ts: number): string {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 5) return "ahora";
  if (diff < 60) return `hace ${Math.floor(diff)}s`;
  return `hace ${Math.floor(diff / 60)}m`;
}

export function ActivityFeed({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="text-xs text-text-tertiary italic px-3 py-4 text-center">
        Esperando primeros eventos...
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
      <AnimatePresence initial={false}>
        {events.map((event) => {
          const meta = TYPE_META[event.type];
          const Icon = meta.icon;
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: 12, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex items-start gap-2 text-xs py-1.5 px-2 rounded-md hover:bg-bg-elevated/50 transition-colors"
            >
              <div
                className={`w-5 h-5 rounded-md grid place-items-center flex-shrink-0 ${meta.bg}`}
              >
                <Icon className={`w-3 h-3 ${meta.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-primary leading-tight">
                  {event.message}
                </p>
                <p className="text-[10px] text-text-tertiary font-mono mt-0.5">
                  {meta.label} · {relativeTime(event.timestamp_ms)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
