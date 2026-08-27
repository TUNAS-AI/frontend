import { CalendarClock, Database, Timer } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ConfidenceIndicator } from "@/components/ui/ConfidenceIndicator";
import { getMissionScheduleSummary } from "../missionSchedule";
import type { MissionDetailPageData } from "../detailTypes";

const provenanceLabels = {
  confirmed: "Confirmed",
  "farmer-reported": "Farmer reported",
  estimate: "Estimate",
  inferred: "Inferred",
  missing: "Missing",
  contradiction: "Contradiction",
} as const;

export function MissionDetailContext({ data }: { data: MissionDetailPageData }) {
  const schedule = getMissionScheduleSummary(data.schedule);

  return (
    <Card className="shadow-farm">
      <CardHeader className="border-b">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Database className="h-4 w-4" aria-hidden="true" />
          {data.sourceLabel}
        </div>
        <CardTitle>Mission context</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 pt-5">
        <dl className="grid gap-4">
          <div className="flex gap-3">
            <Timer className="mt-0.5 h-5 w-5 shrink-0 text-forest-600" aria-hidden="true" />
            <div><dt className="text-sm font-semibold text-muted-foreground">{schedule.label}</dt><dd className="font-bold tabular-nums">{schedule.value}</dd><p className="text-xs text-muted-foreground">{schedule.detail}</p></div>
          </div>
          {data.deadline ? (
            <div className="flex gap-3">
              <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-forest-600" aria-hidden="true" />
              <div><dt className="text-sm font-semibold text-muted-foreground">Deadline</dt><dd className="font-bold"><time dateTime={data.deadline.dateTime}>{data.deadline.label}</time></dd></div>
            </div>
          ) : null}
        </dl>

        <div className="border-t pt-5">
          <h3 className="text-sm font-bold">Known context</h3>
          <dl className="mt-3 grid gap-4">
            {data.context.map((fact) => (
              <div key={fact.id} className="grid gap-1.5">
                <dt className="text-sm font-semibold text-muted-foreground">{fact.label}</dt>
                <dd className="font-bold">{fact.value}</dd>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="source">{provenanceLabels[fact.provenance]}</Badge>
                  <ConfidenceIndicator level={fact.confidence} showScale={false} />
                </div>
              </div>
            ))}
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}
