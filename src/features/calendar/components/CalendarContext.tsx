import { CalendarCheck, Database, TimerReset } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { CalendarPageData } from "../types";

export function CalendarContext({ data }: { data: CalendarPageData }) {
  const conditionalCount = data.events.filter((event) => event.conditional).length;
  const scheduledDays = new Set(data.events.map((event) => event.date)).size;

  return (
    <Card className="shadow-farm">
      <CardHeader className="border-b">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><CalendarCheck className="h-4 w-4" aria-hidden="true" />Approved schedule</div>
        <CardTitle>{data.monthLabel}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 pt-5">
        <div className="flex gap-3"><TimerReset className="mt-0.5 h-5 w-5 shrink-0 text-forest-600" aria-hidden="true" /><div><p className="text-sm font-semibold text-muted-foreground">Timezone</p><p className="font-bold">{data.timezone}</p></div></div>
        <dl className="divide-y border-y">
          <div className="flex items-center justify-between gap-4 py-3"><dt className="text-sm font-semibold text-muted-foreground">Approved events</dt><dd className="text-lg font-extrabold tabular-nums">{data.events.length}</dd></div>
          <div className="flex items-center justify-between gap-4 py-3"><dt className="text-sm font-semibold text-muted-foreground">Scheduled days</dt><dd className="text-lg font-extrabold tabular-nums">{scheduledDays}</dd></div>
          <div className="flex items-center justify-between gap-4 py-3"><dt className="text-sm font-semibold text-muted-foreground">Conditional events</dt><dd className="text-lg font-extrabold tabular-nums">{conditionalCount}</dd></div>
        </dl>
        <p className="text-sm leading-6 text-muted-foreground">Select any date in the month grid to inspect its schedule. Calendar review cannot approve or reschedule work.</p>
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Database className="h-4 w-4" aria-hidden="true" />{data.sourceLabel}</div>
        <Badge variant="source">No external calendar connection</Badge>
      </CardContent>
    </Card>
  );
}
