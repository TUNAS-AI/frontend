import { CloudRain, PackageCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { MissionContextData } from "../types";
import { formatMissionDateTime } from "../formatMissionDate";

export function MissionContext({ context }: { context: MissionContextData }) {
  return (
    <Card>
      <CardHeader><CardTitle>Mission context</CardTitle></CardHeader>
      <CardContent className="grid gap-3 text-sm">
        {context.buyer ? <p className="flex items-start gap-2"><PackageCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span><strong>Buyer:</strong> {context.buyer.quantity} {context.buyer.unit} · {context.buyer.marketQuality}, {formatMissionDateTime(context.buyer.deadline, context.timezone)} {context.timezone}</span></p> : null}
        {context.weather ? <p className="flex items-start gap-2"><CloudRain className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span><strong>Weather:</strong> {context.weather.summary}</span></p> : null}
        {context.disclosure ? <Badge variant={context.disclosure.tone}>{context.disclosure.label}</Badge> : null}
      </CardContent>
    </Card>
  );
}
