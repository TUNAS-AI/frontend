import { ClipboardCheck, Database, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { MissionOutcome } from "../types";

export function OutcomeContext({ outcome }: { outcome: MissionOutcome }) {
  return <Card className="shadow-farm"><CardHeader className="border-b"><div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Database className="h-4 w-4" aria-hidden="true" />{outcome.sourceLabel}</div><CardTitle>Result context</CardTitle></CardHeader><CardContent className="grid gap-5 pt-5"><div className="flex gap-3"><ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-forest-600" aria-hidden="true" /><div><p className="text-sm font-semibold text-muted-foreground">Mission</p><p className="font-bold">{outcome.missionTitle}</p></div></div><div className="flex gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-forest-600" aria-hidden="true" /><div><p className="text-sm font-semibold text-muted-foreground">Crop and location</p><p className="font-bold">{outcome.cropLabel}</p><p className="text-sm text-muted-foreground">{outcome.blockLabel}</p></div></div><div className="border-t pt-5"><p className="text-sm font-semibold text-muted-foreground">Evidence status</p><div className="mt-2 flex flex-wrap gap-2"><Badge variant="success">Closeout confirmed</Badge><Badge variant="source">Single mission only</Badge></div></div><p className="text-xs leading-5 text-muted-foreground">{outcome.closedLabel}</p></CardContent></Card>;
}
