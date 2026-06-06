/**
 * SolanaBadge — Capa 6 ⭐
 *
 * Muestra "Verified on Solana ✓ tx: 5KJ..." con link a Solana Explorer.
 * Este es el momento NUCLEAR contra la pregunta-killer del jurado.
 *
 * TODO Marita: aplicar mockup Figma #6 (Memory Graph + Solana Badge).
 * Tip: shield icon + monospace font para el tx hash. Animación de aparición fade+scale.
 */

"use client";

import { Shield, ExternalLink } from "lucide-react";
import { cn, truncateHash } from "@/lib/utils";
import type { SolanaProvenance } from "@hack4her/playbooks";

interface SolanaBadgeProps {
  provenance: SolanaProvenance;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function SolanaBadge({ provenance, className, size = "md" }: SolanaBadgeProps) {
  const sizes = {
    sm: "text-xs px-2 py-1 gap-1.5",
    md: "text-sm px-3 py-1.5 gap-2",
    lg: "text-base px-4 py-2 gap-2.5",
  };

  return (
    <a
      href={provenance.explorer_url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center rounded-md border border-status-info/30 bg-status-info/10 text-status-info hover:bg-status-info/20 transition-colors font-mono",
        sizes[size],
        className,
      )}
      title={`Verified on Solana ${provenance.network} · Slot ${provenance.slot}`}
    >
      <Shield className="w-3.5 h-3.5" />
      <span className="font-medium">Verified on Solana</span>
      <span className="text-text-secondary">·</span>
      <span>{truncateHash(provenance.tx_signature, 5, 4)}</span>
      <ExternalLink className="w-3 h-3 opacity-60" />
    </a>
  );
}
