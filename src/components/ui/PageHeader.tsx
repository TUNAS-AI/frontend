import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type PageHeaderProps = {
  actions?: ReactNode;
  badges?: ReactNode;
  className?: string;
  description: ReactNode;
  eyebrow?: ReactNode;
  meta?: ReactNode;
  navigation?: ReactNode;
  title: ReactNode;
};

export function PageHeader({ actions, badges, className, description, eyebrow, meta, navigation, title }: PageHeaderProps) {
  return (
    <header className={cn("grid gap-4 rounded-lg border border-primary bg-primary px-5 py-6 text-primary-foreground shadow-farm sm:px-7", className)}>
      {navigation ? <div>{navigation}</div> : null}
      {badges ? <div className="flex flex-wrap items-center gap-2">{badges}</div> : null}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div className="grid max-w-3xl gap-2">
          {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/75">{eyebrow}</p> : null}
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">{title}</h1>
          <p className="text-base leading-7 text-white/85">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {meta ? <p className="text-xs leading-5 text-white/75">{meta}</p> : null}
    </header>
  );
}
