"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { cn, truncateHash } from "@/lib/utils";
import type { SolanaProvenance } from "@hack4her/playbooks";

interface SolanaBadgeProps {
  provenance: SolanaProvenance;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function SolanaBadge({ provenance, className, size = "md" }: SolanaBadgeProps) {
  const sizes = {
    sm: "text-[10px] px-2 py-1 gap-1.5",
    md: "text-xs px-3 py-1.5 gap-2",
    lg: "text-sm px-4 py-2 gap-2.5",
  };

  const iconSizes = { sm: "w-3 h-3", md: "w-3.5 h-3.5", lg: "w-4 h-4" };

  return (
    <motion.a
      href={provenance.explorer_url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", duration: 0.4, bounce: 0.35 }}
      className={cn(
        "inline-flex items-center rounded-lg font-mono font-medium transition-all",
        "border border-[#9945FF]/25 bg-gradient-to-r from-[#9945FF]/8 to-[#14F195]/8",
        "hover:from-[#9945FF]/15 hover:to-[#14F195]/15 hover:border-[#9945FF]/40 hover:shadow-sm",
        "text-[#7B35D9]",
        sizes[size],
        className,
      )}
      title={`Verified on Solana ${provenance.network} · Slot ${provenance.slot}`}
    >
      {/* Solana shield icon */}
      <SolanaShield className={iconSizes[size]} />
      <span>Verified on Solana</span>
      <span className="opacity-40">·</span>
      <span className="opacity-70">{truncateHash(provenance.tx_signature, 4, 4)}</span>
      <ExternalLink className={cn(iconSizes[size], "opacity-50")} />
    </motion.a>
  );
}

function SolanaShield({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="solana-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9945FF" />
          <stop offset="100%" stopColor="#14F195" />
        </linearGradient>
      </defs>
      <path
        d="M12 2L20 5.5V11C20 15.4 16.5 19.5 12 21C7.5 19.5 4 15.4 4 11V5.5L12 2Z"
        stroke="url(#solana-grad)"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M8.5 12L10.5 14L15.5 9"
        stroke="url(#solana-grad)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
