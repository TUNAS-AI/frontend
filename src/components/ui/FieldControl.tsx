import type { ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type FieldControlProps = {
  children?: ReactNode;
  helper?: string;
  label: string;
  error?: string;
  required?: boolean;
  reserveHelperSpace?: boolean;
};

export function FieldGroup({ children, error, helper, label, required, reserveHelperSpace }: FieldControlProps) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-foreground">
      <span>
        {label}
        {required ? <span className="ml-1 text-destructive" aria-hidden="true">*</span> : null}
      </span>
      {children}
      {error ? <span className="text-sm font-medium text-destructive">{error}</span> : null}
      {!error && (helper || reserveHelperSpace) ? <span className={cn("text-sm font-medium text-muted-foreground", reserveHelperSpace && "min-h-10", !helper && "invisible")} aria-hidden={!helper}>{helper ?? " "}</span> : null}
    </label>
  );
}

export function Select({
  children,
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-11 w-full rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm transition-colors hover:border-foreground/50 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70 aria-[invalid=true]:border-destructive",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
