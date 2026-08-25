import { Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type EmptyStateProps = {
  action?: ReactNode;
  className?: string;
  description: ReactNode;
  icon?: ReactNode;
  title: ReactNode;
};

export function EmptyState({ action, className, description, icon, title }: EmptyStateProps) {
  return (
    <section className={cn("grid justify-items-center gap-3 rounded-lg border border-dashed bg-card px-5 py-10 text-center", className)}>
      <div className="grid h-12 w-12 place-items-center rounded-full bg-forest-50 text-forest-700" aria-hidden="true">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <div className="grid max-w-md gap-1">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <p className="text-base leading-6 text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="mt-2 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </section>
  );
}
