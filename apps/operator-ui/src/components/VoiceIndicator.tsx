/**
 * VoiceIndicator — Capa 2 · Voz activa
 *
 * Waveform animado cuando Themis está hablando (ElevenLabs) o cuando el
 * operador está narrando (Whisper).
 *
 * TODO Marita: aplicar mockup Figma #5 (Step log con voz activa).
 * Tip: barras verticales con pulse desincronizado para sentir "vivo".
 */

"use client";

import { motion } from "framer-motion";
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

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-mono",
        active ? "bg-bg-elevated" : "opacity-40",
        className,
      )}
    >
      <Icon className={cn("w-3.5 h-3.5", color)} />
      <Waveform active={active} />
      <span className="text-text-secondary">
        {source === "user" ? "Tú narrando..." : "Themis hablando..."}
      </span>
    </div>
  );
}

function Waveform({ active }: { active: boolean }) {
  const bars = [0, 0.15, 0.3, 0.45, 0.6, 0.75];
  return (
    <div className="flex items-center gap-0.5 h-3">
      {bars.map((delay, i) => (
        <motion.span
          key={i}
          className="w-0.5 bg-current rounded-full"
          animate={
            active
              ? {
                  height: ["20%", "100%", "40%", "80%", "30%"],
                }
              : { height: "20%" }
          }
          transition={{
            duration: 0.8,
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
