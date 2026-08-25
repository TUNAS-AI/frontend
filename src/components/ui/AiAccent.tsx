import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type AiAccentProps = {
  children: ReactNode;
  className?: string;
};

/** A restrained visual cue for AI-assisted guidance, not a status indicator. */
export function AiAccent({ children, className }: AiAccentProps) {
  return (
    <span className={cn("inline-flex min-h-7 items-center gap-1.5 rounded-md border border-ai-100 bg-ai-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-ai-700", className)}>
      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
      {children}
    </span>
  );
}
