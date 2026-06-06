"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mic, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceIndicatorProps {
  active: boolean;
  source: "user" | "agent";
  className?: string;
}

export function VoiceIndicator({ active, source, className }: VoiceIndicatorProps) {
  const Icon = source === "user" ? Mic : Volume2;
  const color = source === "user" ? "text-status-info" : "text-coral";
  const bgColor = source === "user" ? "bg-status-info-bg border-status-info/20" : "bg-red-50 border-coral/20";

  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          key="active"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono border",
            bgColor,
            className,
          )}
        >
          <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", color)} />
          <Waveform active color={source === "user" ? "#2563EB" : "#C8102E"} />
          <span className={cn("font-medium", color)}>
            {source === "user" ? "Tú narrando" : "Themis hablando"}
          </span>
        </motion.div>
      ) : (
        <motion.div
          key="inactive"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono border border-border bg-white text-text-tertiary",
            className,
          )}
        >
          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
          <Waveform active={false} color="#9CA3AF" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Waveform({ active, color }: { active: boolean; color: string }) {
  const bars = [0, 0.15, 0.3, 0.45, 0.6, 0.75];

  return (
    <div className="flex items-center gap-[2px] h-3.5">
      {bars.map((delay, i) => (
        <motion.span
          key={i}
          className="w-[2px] rounded-full"
          style={{ backgroundColor: color }}
          animate={
            active
              ? { height: ["30%", "100%", "50%", "85%", "35%"] }
              : { height: "25%" }
          }
          transition={{
            duration: 0.75,
            repeat: active ? Infinity : 0,
            delay,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
