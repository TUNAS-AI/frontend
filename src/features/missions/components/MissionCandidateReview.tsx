import { FileText, Sparkles } from "lucide-react";
import type { MissionPlanRecommendation, MissionPreviewPlan } from "@/api/missions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";

export function MissionCandidateReview({ plans, recommendation, selectedPlan, onSelect, onApprove }: { plans: MissionPreviewPlan[]; recommendation: MissionPlanRecommendation | null; selectedPlan: MissionPreviewPlan | null; onSelect: (planId: string) => void; onApprove: () => void }) {
  const ordered = [...plans].sort((a, b) => Number(b.planId === recommendation?.planId) - Number(a.planId === recommendation?.planId));
  const active = selectedPlan ?? ordered[0];
  const activeIndex = ordered.findIndex((plan) => plan.planId === active?.planId);
  const recommended = active?.planId === recommendation?.planId;

  function moveTab(index: number, key: string) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(key)) return;
    const next = key === "Home" ? 0 : key === "End" ? ordered.length - 1 : (index + (key === "ArrowRight" ? 1 : -1) + ordered.length) % ordered.length;
    onSelect(ordered[next].planId);
    requestAnimationFrame(() => document.getElementById(`plan-tab-${next}`)?.focus());
  }

  return <div className="grid gap-4">
    <div className="grid gap-2">
      <p className="text-sm leading-6 text-muted-foreground">Choose a tab to select that plan for approval. No schedule is created until you approve it.</p>
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Harvest plan candidates">{ordered.map((plan, index) => {
        const selected = plan.planId === active?.planId;
        return <button key={plan.planId} id={`plan-tab-${index}`} type="button" role="tab" aria-selected={selected} aria-controls={`plan-panel-${index}`} tabIndex={selected ? 0 : -1} title={plan.name} onClick={() => onSelect(plan.planId)} onKeyDown={(event) => moveTab(index, event.key)} className={`min-w-44 flex-1 rounded-md border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 ${selected ? "border-primary bg-primary text-primary-foreground shadow-sm" : "bg-card hover:border-primary/50 hover:bg-muted/40"}`}>
          <span className="block truncate font-bold">{plan.name}</span>
          <span className={`mt-1 block text-xs font-semibold ${selected ? "text-primary-foreground/85" : "text-muted-foreground"}`}>{selected ? "Selected plan" : plan.planId === recommendation?.planId ? "TUNAS recommendation" : `${plan.activities.length} activities`}</span>
        </button>;
      })}</div>
    </div>
    {active ? <Card id={`plan-panel-${activeIndex}`} role="tabpanel" aria-labelledby={`plan-tab-${activeIndex}`} className="border-primary/50 shadow-farm">
      <CardHeader><div className="flex min-w-0 flex-wrap items-center gap-2"><CardTitle className="min-w-0 flex-1 truncate" title={active.name}>{active.name}</CardTitle><Badge variant="success">Selected</Badge>{recommended ? <Badge variant="ai"><Sparkles aria-hidden="true" />TUNAS recommendation</Badge> : null}{active.weatherStatus === "WEATHER_UNVERIFIED" ? <Badge variant="warning">Weather recheck required</Badge> : null}</div><CardDescription>{active.summary}</CardDescription><dl className="mt-3 grid grid-cols-2 gap-3 rounded-md bg-muted/35 p-3"><div><dt className="text-xs font-semibold text-muted-foreground">Drying window</dt><dd className="mt-0.5 font-bold">{active.dryingEstimateMinDays}–{active.dryingEstimateMaxDays} days</dd></div><div><dt className="text-xs font-semibold text-muted-foreground">Activities</dt><dd className="mt-0.5 font-bold">{active.activities.length}</dd></div></dl></CardHeader>
      <CardContent className="grid gap-5"><CandidateTimeline activities={active.activities} /><details className="rounded-md border bg-muted/20 p-4"><summary className="cursor-pointer font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30">Planning details and evidence</summary><div className="mt-4 grid gap-5"><TextSection title="Recommendation reasons" values={recommended ? recommendation?.reasons.map((reason) => reason.text) ?? [] : []} /><EvidenceSection evidence={active.evidence} /><TextSection title="Assumptions" values={active.assumptions} /><TextSection title="Tradeoffs" values={active.tradeoffs} /><TextSection title="Risks" values={Object.entries(active.risks).map(([risk, detail]) => `${risk}: ${detail}`)} /><section><h4 className="font-bold">Drying guidance</h4><p className="text-sm leading-6 text-muted-foreground">{active.dryingEstimateReason}</p></section></div></details></CardContent>
    </Card> : null}
    <Card variant="success"><CardHeader><CardTitle>No schedule is applied before approval</CardTitle><CardDescription>The selected tab is the plan that will be approved.</CardDescription></CardHeader><CardFooter className="justify-end"><Button type="button" size="lg" disabled={!selectedPlan} onClick={onApprove} icon={<FileText aria-hidden="true" />}>Approve selected plan</Button></CardFooter></Card>
  </div>;
}

function CandidateTimeline({ activities }: { activities: MissionPreviewPlan["activities"] }) {
  const groups = [...activities].sort((a, b) => a.startsOn.localeCompare(b.startsOn)).reduce((result, activity) => result.set(activity.startsOn.slice(0, 10), [...(result.get(activity.startsOn.slice(0, 10)) ?? []), activity]), new Map<string, MissionPreviewPlan["activities"]>());
  return <section className="grid gap-3"><h4 className="font-bold">Candidate timeline</h4>{[...groups].map(([date, items]) => <div key={date} className="grid gap-2"><h5 className="text-sm font-bold text-primary">{new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeZone: items[0]?.timezone }).format(new Date(`${date}T00:00:00`))}</h5><ol className="grid gap-2 border-l-2 border-primary/20 pl-4">{items.map((activity, index) => <li key={`${activity.actionKind}-${activity.startsOn}-${index}`} className="grid gap-1 rounded-md bg-muted/30 p-3"><div className="flex flex-wrap justify-between gap-2"><strong>{activity.title}</strong><span className="text-sm font-semibold">{activityTime(activity)}</span></div><p className="text-sm leading-6 text-muted-foreground">{activity.description}</p><p className="text-xs text-muted-foreground">{[activity.targetHarvestKg != null ? `Target ${activity.targetHarvestKg} kg` : null, activity.workers != null ? `${activity.workers} workers` : null, activity.isConditional ? "Conditional" : null].filter(Boolean).join(" · ")}</p></li>)}</ol></div>)}</section>;
}

function activityTime(activity: MissionPreviewPlan["activities"][number]) {
  if (activity.scheduleType === "DAILY_WINDOW" && activity.windowStart && activity.windowEnd) return `${activity.windowStart}–${activity.windowEnd}`;
  return activity.scheduleType === "CONDITION_GATE" ? "Farmer-confirmed condition gate" : `${activity.startsOn.slice(0, 10)}–${activity.endsOn.slice(0, 10)}`;
}

function TextSection({ title, values }: { title: string; values: string[] }) { return <section><h4 className="font-bold">{title}</h4>{values.length ? <ul className="mt-1 grid gap-1 text-sm leading-6 text-muted-foreground">{values.map((value) => <li key={value}>• {value}</li>)}</ul> : <p className="mt-1 text-sm text-muted-foreground">None supplied.</p>}</section>; }
function EvidenceSection({ evidence }: { evidence: MissionPreviewPlan["evidence"] }) { return <section><h4 className="font-bold">Deterministic evidence</h4>{evidence.length ? <dl className="mt-1 grid gap-2 text-sm">{evidence.map((item) => <div key={item.evidenceId} className="rounded-md bg-muted/30 p-2"><dt className="font-semibold">{item.passed ? "Pass" : "Fail"} · {item.rule}</dt><dd className="break-words text-muted-foreground">{item.source}: {String(item.value)}</dd></div>)}</dl> : <p className="mt-1 text-sm text-muted-foreground">None supplied.</p>}</section>; }
