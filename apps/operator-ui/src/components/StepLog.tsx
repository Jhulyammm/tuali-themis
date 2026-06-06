/**
 * StepLog — Capa 1 · Modo Ejecutar
 *
 * Lista vertical de pasos siendo ejecutados por Themis.
 * Estado "adapting ⚡" cuando un selector falló y se está usando vision fallback.
 *
 * TODO Marita: aplicar mockup Figma #5 (Step log con voz activa).
 * Tip: el paso actual tiene border-left coral 2px + pulse sutil.
 * El icono ⚡ es PERMANENTE después de un self-healing — es la insignia.
 */

"use client";

import { motion } from "framer-motion";
import { Check, X, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExecutionLog } from "@hack4her/playbooks";

interface StepLogProps {
  logs: ExecutionLog[];
  currentIndex?: number;
  className?: string;
}

export function StepLog({ logs, currentIndex, className }: StepLogProps) {
  // Defensa contra entries vacías
  const safeLogs = (logs ?? []).filter(
    (l): l is ExecutionLog => !!l && !!l.action,
  );

  return (
    <ol className={cn("space-y-1.5", className)}>
      {safeLogs.map((log, i) => (
        <StepRow key={i} log={log} isActive={i === currentIndex} />
      ))}
    </ol>
  );
}

function StepRow({ log, isActive }: { log: ExecutionLog; isActive: boolean }) {
  const adapted = !!log.adapted_to;
  const actionName = getActionLabel(log.action);

  return (
    <motion.li
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex items-start gap-3 px-3 py-2 rounded transition-colors",
        isActive && "border-l-2 border-coral bg-coral/5",
      )}
    >
      <StatusIcon status={log.status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm">
          <span className={cn(log.status === "failed" && "text-status-error")}>
            {actionName}
          </span>
          {adapted && (
            <Zap className="w-3.5 h-3.5 text-status-warning" aria-label="Self-healed" />
          )}
          <span className="ml-auto font-mono text-xs text-text-tertiary tabular-nums">
            {log.duration_ms}ms
          </span>
        </div>
        {log.status === "adapting" && (
          <p className="mt-1 text-xs text-status-warning animate-adapting">
            Detecté un cambio. Resolviendo con visión...
          </p>
        )}
        {adapted && log.adapted_from && log.adapted_to && (
          <p className="mt-1 text-xs text-text-secondary">
            Adaptó: <span className="font-mono">{log.adapted_from}</span> →{" "}
            <span className="font-mono">{log.adapted_to}</span>
          </p>
        )}
        {log.error && (
          <p className="mt-1 text-xs text-status-error font-mono">{log.error}</p>
        )}
      </div>
    </motion.li>
  );
}

function StatusIcon({ status }: { status: ExecutionLog["status"] }) {
  switch (status) {
    case "succeeded":
      return <Check className="w-4 h-4 text-status-success mt-0.5" />;
    case "failed":
      return <X className="w-4 h-4 text-status-error mt-0.5" />;
    case "retrying":
    case "adapting":
      return <Loader2 className="w-4 h-4 text-status-warning animate-spin mt-0.5" />;
  }
}

function getActionLabel(action: ExecutionLog["action"]): string {
  switch (action.action) {
    case "navigate":
      return `Navegar a ${action.target}`;
    case "click":
      return `Click en ${action.selector_intent}`;
    case "fill":
      return `Capturar "${action.value}" en ${action.selector_intent}`;
    case "extract":
      return `Leer ${action.selector_intent}`;
    case "extract_list":
      return `Leer lista de ${action.selector_intent}`;
    case "switch_system":
      return `Cambiar a sistema ${action.target}`;
    case "select":
      return `Seleccionar "${action.value}"`;
    case "wait_for":
      return `Esperar ${action.selector_intent}`;
    case "for_each":
      return `Por cada ${action.input_var}`;
    case "if":
      return `Si ${action.condition}`;
  }
}
