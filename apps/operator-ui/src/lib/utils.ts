import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classNames de Tailwind respetando precedence.
 * Usado por componentes shadcn y custom.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un número como porcentaje legible: 35 → "+35%", -12 → "-12%"
 */
export function formatDelta(percentage: number): string {
  if (percentage > 0) return `+${percentage}%`;
  return `${percentage}%`;
}

/**
 * Trunca un hash blockchain a "5KJp7...XYZ" para mostrar en UI.
 */
export function truncateHash(hash: string, head = 5, tail = 3): string {
  if (hash.length <= head + tail + 3) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}
