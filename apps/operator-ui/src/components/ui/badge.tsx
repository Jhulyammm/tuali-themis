import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-coral/15 text-coral border border-coral/30",
        success: "bg-status-success/15 text-status-success border border-status-success/30",
        warning: "bg-status-warning/15 text-status-warning border border-status-warning/30",
        error: "bg-status-error/15 text-status-error border border-status-error/30",
        info: "bg-status-info/15 text-status-info border border-status-info/30",
        secondary: "bg-bg-elevated text-text-secondary border border-default",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
