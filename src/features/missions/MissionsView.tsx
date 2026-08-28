/* oxlint-disable react/only-export-components -- Detail and list views share mission display helpers. */
import { ArrowRight, CalendarDays, ClipboardList, MapPinned, Plus, Sprout } from "lucide-react";
import { Link } from "react-router";
import type { Mission, MissionListItem, MissionPlan, MissionStage, MissionStatus, MissionStep } from "@/api/missions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

export function MissionsView({ missions }: { missions: MissionListItem[] }) {
  return <div className="grid gap-6"><PageHeader eyebrow="Harvest and drying work" title="Missions" description="Review each approved shallot harvest mission and its next planned work." />
    <section className="grid gap-4" aria-labelledby="mission-list-heading"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 id="mission-list-heading" className="text-2xl font-extrabold tracking-tight text-primary">Your missions</h2><p className="mt-1 text-sm leading-6 text-muted-foreground"><span className="block">Newest missions appear first.</span><span className="block">Open one to review its plan and schedule.</span></p></div><Button asChild type="button" icon={<Plus aria-hidden="true" />}><Link to="/missions/new">New mission</Link></Button></div>{missions.length ? <div className="grid gap-3">{missions.map((mission) => <MissionCard key={mission.missionId} mission={mission} />)}</div> : <EmptyState icon={<ClipboardList className="h-6 w-6" />} title="No missions yet" description="Turn a harvest request into a weather-aware plan, then approve it when you are ready." action={<Button asChild type="button" icon={<Plus aria-hidden="true" />}><Link to="/missions/new">Create a mission</Link></Button>} />}</section></div>;
}

export function MissionCard({ mission }: { mission: MissionListItem }) {
  const nextStep = nextMissionStep(mission.missionSteps);
  const batches = mission.cropBatches.map((item) => item.cropBatch.variety || "Shallot batch").join(", ");
  return <article className="grid gap-4 rounded-lg border bg-card p-5 shadow-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><StatusBadge status={mission.status} /><StageBadge stage={mission.stage} /></div><h3 className="mt-3 text-xl font-extrabold tracking-tight">{mission.originalMessage}</h3><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">{batches ? <span className="flex items-center gap-1.5"><Sprout className="h-4 w-4 text-primary" aria-hidden="true" />{batches}</span> : null}{mission.fieldBlockId ? <span className="flex items-center gap-1.5"><MapPinned className="h-4 w-4 text-primary" aria-hidden="true" />Field selected</span> : null}<span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />Created {formatDate(mission.createdAt)}</span></div>{nextStep ? <p className="mt-4 border-t pt-4 text-sm leading-6 text-muted-foreground"><span className="font-bold text-foreground">Next: </span>{nextStep.title} · {formatStepSchedule(nextStep)}</p> : <p className="mt-4 border-t pt-4 text-sm leading-6 text-muted-foreground">No remaining scheduled work.</p>}</div><Button asChild type="button" variant="outline" trailingIcon={<ArrowRight aria-hidden="true" />}><Link to={`/missions/${mission.missionId}`}>View details</Link></Button></article>;
}

export function StatusBadge({ status }: { status: MissionStatus }) { return <Badge variant={status === "ACTIVE" ? "success" : status === "CLOSEOUT" ? "warning" : "neutral"}>{status === "ACTIVE" ? "In progress" : status === "CLOSEOUT" ? "Awaiting closeout" : "Completed"}</Badge>; }
export function StageBadge({ stage }: { stage: MissionStage }) { return <Badge variant="source">{stageLabel(stage)}</Badge>; }
export function missionPlan(mission: Mission): MissionPlan | null { return mission.planningRuns.flatMap((run) => run.plans).find((plan) => plan.planId === mission.approvedPlanId) ?? null; }
export function nextMissionStep(steps: MissionStep[]) { return steps.find((step) => step.status !== "COMPLETED") ?? null; }
export function formatDate(value: string) {
  const parts = dateFormat.formatToParts(new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value));
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part("day")} ${part("month")}, ${part("year")}`;
}
export function formatStepSchedule(step: MissionStep) { const range = step.startsOn === step.endsOn ? formatDate(step.startsOn) : `${formatDate(step.startsOn)}–${formatDate(step.endsOn)}`; return step.windowStart && step.windowEnd ? `${range}, ${step.windowStart}–${step.windowEnd}` : range; }
export function stageLabel(stage: MissionStage) { return stage.toLowerCase().split("_").map((word) => `${word[0].toUpperCase()}${word.slice(1)}`).join(" "); }
