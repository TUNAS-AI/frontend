import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { MissionsPageData } from "../listTypes";

export function MissionsSummaryPanel({ data }: { data: MissionsPageData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mission overview</CardTitle>
        <Badge variant="source">{data.sourceBadge}</Badge>
      </CardHeader>
      <CardContent className="grid gap-3">
        {data.overview.map((item) => {
          const count = data.missions.filter((mission) => item.statuses.includes(mission.status)).length;
          return (
            <div key={item.id} className="flex items-start justify-between gap-4 rounded-md border p-3">
              <div><p className="font-bold">{item.label}</p><p className="text-sm leading-5 text-muted-foreground">{item.description}</p></div>
              <span className="grid h-8 min-w-8 place-items-center rounded-full bg-forest-50 px-2 font-extrabold text-forest-700" aria-label={`${count} ${item.label.toLowerCase()}`}>{count}</span>
            </div>
          );
        })}
        <p className="border-t pt-3 text-xs leading-5 text-muted-foreground">{data.freshness}</p>
      </CardContent>
    </Card>
  );
}
