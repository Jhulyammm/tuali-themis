"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExecutionLog } from "@hack4her/playbooks";

interface StepLogProps {
  logs: ExecutionLog[];
  currentIndex?: number;
  className?: string;
}

export function StepLog({ logs, currentIndex, className }: StepLogProps) {
  const safeLogs = (logs ?? []).filter(
    (l): l is ExecutionLog => !!l && !!l.action,
  );

  if (safeLogs.length === 0) {
    return (
      <div className={cn("py-10 text-center text-text-tertiary text-sm", className)}>
        Clic en "Visual demo" para ver la ejecución.
      </div>
    );
  }

  return (
    <ol className={cn("space-y-2 max-h-[60vh] overflow-y-auto pr-1", className)}>
      <AnimatePresence initial={false}>
        {safeLogs.map((log, i) => (
          <StepRow key={i} log={log} index={i} isActive={i === currentIndex} />
        ))}
      </AnimatePresence>
    </ol>
  );
}

function StepRow({
  log,
  index,
  isActive,
}: {
  log: ExecutionLog;
  index: number;
  isActive: boolean;
}) {
  const adapted = !!log.adapted_to;
  const isAdapting = log.status === "adapting";
  const actionName = getActionLabel(log.action);

  return (
    <motion.li
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {isAdapting ? (
        /* ⚡ Self-healing wow moment */
        <motion.div
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(245,179,1,0.5)",
              "0 0 0 12px rgba(245,179,1,0)",
              "0 0 0 0 rgba(245,179,1,0)",
            ],
          }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="border-l-4 border-status-warning bg-status-warning-bg rounded-r-xl px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-status-warning animate-spin flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-status-warning" />
                <span className="text-sm font-semibold text-status-warning">
                  Auto-reparando
                </span>
              </div>
              <p className="mt-0.5 text-xs text-amber-700 animate-adapting">
                Detecté un cambio en el selector. Resolviendo con visión...
              </p>
            </div>
            <span className="font-mono text-xs text-status-warning tabular-nums">
              {log.duration_ms > 0 ? `${log.duration_ms}ms` : "..."}
            </span>
          </div>
        </motion.div>
      ) : (
        /* Normal step row */
        <div
          className={cn(
            "flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors",
            isActive && "bg-coral/5 border-l-2 border-coral",
            !isActive && "hover:bg-bg-elevated/60",
          )}
        >
          {/* Step number */}
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-bg-elevated flex items-center justify-center font-mono text-[10px] text-text-tertiary mt-0.5">
            {index + 1}
          </span>

          <StatusIcon status={log.status} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "text-sm",
                  log.status === "failed" && "text-status-error",
                  log.status === "succeeded" && "text-text-primary",
                )}
              >
                {actionName}
              </span>
              {adapted && (
                <span className="inline-flex items-center gap-0.5 bg-status-warning-bg text-status-warning text-[10px] font-semibold font-mono px-1.5 py-0.5 rounded-full border border-status-warning/30">
                  <Zap className="w-2.5 h-2.5" />
                  self-healed
                </span>
              )}
              <span className="ml-auto font-mono text-xs text-text-tertiary tabular-nums">
                {log.duration_ms > 0 ? `${log.duration_ms}ms` : ""}
              </span>
            </div>
            {adapted && log.adapted_from && log.adapted_to && (
              <p className="mt-1 text-xs text-text-secondary font-mono">
                <span className="text-text-tertiary">{log.adapted_from}</span>
                {" → "}
                <span className="text-status-success">{log.adapted_to}</span>
              </p>
            )}
            {log.error && (
              <p className="mt-1 text-xs text-status-error font-mono">{log.error}</p>
            )}
          </div>
        </div>
      )}
    </motion.li>
  );
}

function StatusIcon({ status }: { status: ExecutionLog["status"] }) {
  switch (status) {
    case "succeeded":
      return (
        <Check className="w-4 h-4 text-status-success mt-0.5 flex-shrink-0" />
      );
    case "failed":
      return (
        <X className="w-4 h-4 text-status-error mt-0.5 flex-shrink-0" />
      );
    case "retrying":
    case "adapting":
      return (
        <Loader2 className="w-4 h-4 text-status-warning animate-spin mt-0.5 flex-shrink-0" />
      );
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
