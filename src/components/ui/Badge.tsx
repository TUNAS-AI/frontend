/* oxlint-disable react/only-export-components -- shadcn exports variants for composition. */
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/utils/cn"
import type { StatusVariant } from "./semantics"

const statusVariantClasses = {
  neutral: "border-field-200 bg-field-100 text-ink-700",
  info: "border-rain-300 bg-rain-100 text-info-foreground",
  success: "border-leaf-300 bg-leaf-100 text-success-foreground",
  warning: "border-harvest-300 bg-harvest-100 text-warning-foreground",
  danger: "border-risk-300 bg-risk-100 text-risk-700",
  ai: "border-ai-100 bg-ai-50 text-ai-700",
  source: "border-input bg-card text-muted-foreground",
} satisfies Record<StatusVariant, string>

const badgeVariants = cva(
  "inline-flex min-h-7 w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-5 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:ring-offset-2 [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: statusVariantClasses,
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
