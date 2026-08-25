import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type ErrorStateProps = {
  action?: ReactNode;
  className?: string;
  description: ReactNode;
  title?: ReactNode;
};

export function ErrorState({ action, className, description, title = "Something went wrong" }: ErrorStateProps) {
  return (
    <section
      className={cn("grid justify-items-center gap-3 rounded-lg border border-risk-300 bg-risk-100 px-5 py-8 text-center text-risk-700", className)}
      role="alert"
    >
      <CircleAlert className="h-8 w-8" aria-hidden="true" />
      <div className="grid max-w-md gap-1">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-base leading-6">{description}</p>
      </div>
      {action ? <div className="mt-2 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </section>
  );
}
