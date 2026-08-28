import { CheckCircle2, ClipboardList, Hourglass, Sprout } from "lucide-react";
import type { MissionListItem } from "@/api/missions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export function MissionsAtGlance({ missions }: { missions: MissionListItem[] }) {
  const active = missions.filter((mission) => mission.status === "ACTIVE").length;
  const closeout = missions.filter((mission) => mission.status === "CLOSEOUT").length;
  const completed = missions.filter((mission) => mission.status === "COMPLETED").length;

  return <Card className="overflow-hidden shadow-farm"><CardHeader className="bg-primary text-primary-foreground"><div className="flex items-center gap-2 text-sm font-semibold text-white/80"><ClipboardList className="h-4 w-4" aria-hidden="true" />Missions at a glance</div><CardTitle className="text-4xl tabular-nums text-white">{missions.length}</CardTitle><p className="text-sm font-semibold text-white/85">Total missions</p></CardHeader><CardContent className="grid gap-4 pt-5"><Summary icon={<Sprout aria-hidden="true" />} label="In progress" value={active} /><Summary icon={<Hourglass aria-hidden="true" />} label="Awaiting closeout" value={closeout} /><Summary icon={<CheckCircle2 aria-hidden="true" />} label="Completed" value={completed} /><p className="border-t pt-4 text-sm leading-6 text-muted-foreground">Open a mission to review its approved schedule, risks, and current work.</p></CardContent></Card>;
}

function Summary({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">{icon}</span><div><p className="text-sm font-semibold text-muted-foreground">{label}</p><p className="text-xl font-extrabold tabular-nums">{value}</p></div></div>;
}
