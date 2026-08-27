import { ArrowRight, CalendarClock, Clock3 } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { RiskIndicator } from "@/components/ui/RiskIndicator";
import type { MissionListItem } from "../listTypes";

export function MissionListCard({ mission }: { mission: MissionListItem }) {
  return (
    <article>
      <Card className="shadow-farm">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={mission.statusTone}>{mission.statusLabel}</Badge>
            <RiskIndicator level={mission.risk} label={mission.riskLabel} />
          </div>
          <CardTitle className="pt-1 text-xl">{mission.title}</CardTitle>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">{mission.description}</p>
        </CardHeader>

        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {mission.context.map((item) => (
              <div key={item.id} className="rounded-md border bg-muted/25 p-3">
                <dt className="text-sm font-semibold text-muted-foreground">{item.label}</dt>
                <dd className="mt-1 break-words font-bold text-foreground">{item.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>

        <CardFooter className="justify-between border-t pt-5">
          <div className="grid gap-1 text-sm text-muted-foreground">
            {mission.deadline ? <p className="flex items-center gap-2"><CalendarClock className="h-4 w-4 shrink-0" aria-hidden="true" /><span><strong className="text-foreground">Deadline:</strong> <time dateTime={mission.deadline.dateTime}>{mission.deadline.label}</time></span></p> : null}
            <p className="flex items-center gap-2"><Clock3 className="h-4 w-4 shrink-0" aria-hidden="true" /><time dateTime={mission.updated.dateTime}>{mission.updated.label}</time></p>
          </div>
          {mission.action ? (
            <Button asChild trailingIcon={<ArrowRight aria-hidden="true" />}><Link to={mission.action.href}>{mission.action.label}</Link></Button>
          ) : (
            <Button type="button" variant="outline" disabled>{mission.unavailableActionLabel ?? "Detail unavailable"}</Button>
          )}
        </CardFooter>
      </Card>
    </article>
  );
}
