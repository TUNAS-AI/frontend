import type { ReactNode } from "react";
import { Card, CardContent } from "./Card";

type MetricCardProps = {
  detail?: ReactNode;
  icon?: ReactNode;
  label: ReactNode;
  value: ReactNode;
};

export function MetricCard({ detail, icon, label, value }: MetricCardProps) {
  return (
    <Card variant="subtle">
      <CardContent className="flex items-center gap-4 pt-5 sm:pt-6">
        {icon ? <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">{icon}</span> : null}
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{label}</p>
          <p className="mt-1 text-xl font-extrabold tabular-nums">{value}</p>
          {detail ? <p className="text-sm text-muted-foreground">{detail}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
