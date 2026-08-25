/* oxlint-disable react/only-export-components -- variants are exported for composition. */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";
import type { StatusVariant } from "./semantics";

const statusVariantClasses = {
  neutral: "border-border bg-card text-foreground [&>svg]:text-muted-foreground",
  info: "border-rain-300 bg-rain-100 text-info-foreground [&>svg]:text-info-foreground",
  success: "border-leaf-300 bg-leaf-100 text-success-foreground [&>svg]:text-success-foreground",
  warning: "border-harvest-300 bg-harvest-100 text-warning-foreground [&>svg]:text-warning-foreground",
  danger: "border-risk-300 bg-risk-100 text-risk-700 [&>svg]:text-risk-700",
  ai: "border-ai-100 bg-ai-50 text-ai-700 [&>svg]:text-ai-700",
  source: "border-input bg-card text-muted-foreground [&>svg]:text-muted-foreground",
} satisfies Record<StatusVariant, string>;

const alertVariants = cva(
  "relative grid gap-1 rounded-lg border p-4 pl-11 text-sm leading-5 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:h-5 [&>svg]:w-5",
  {
    variants: {
      variant: statusVariantClasses,
    },
    defaultVariants: { variant: "neutral" },
  },
);

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(alertVariants({ variant }), className)} {...props} />
  ),
);
Alert.displayName = "Alert";

function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-bold leading-5", className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("font-medium opacity-90", className)} {...props} />;
}

export { Alert, AlertDescription, AlertTitle, alertVariants };
