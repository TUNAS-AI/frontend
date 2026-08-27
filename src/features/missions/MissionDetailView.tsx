import { useEffect, useMemo } from "react";
import { AlertTriangle, ArrowLeft, CalendarClock, CheckCircle2, Circle, CircleCheck, Clock3, MessageSquareWarning, XCircle } from "lucide-react";
import { Link } from "react-router";
import { openTunasAssistantWithDraft } from "@/components/app/assistantControl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Badge, type BadgeProps } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { RiskIndicator } from "@/components/ui/RiskIndicator";
import { MissionCloseoutPanel } from "./components/MissionCloseoutPanel";
import type { MissionCloseoutDraft, MissionDetailPageData, MissionExecutionStep, MissionExecutionStepStatus } from "./detailTypes";

const statusVariants: Record<MissionExecutionStepStatus, BadgeProps["variant"]> = {
  completed: "success",
  "in-progress": "ai",
  scheduled: "info",
  "waiting-confirmation": "warning",
  "unable-to-continue": "danger",
};

const statusIcons = {
  completed: CircleCheck,
  "in-progress": Circle,
  scheduled: Clock3,
  "waiting-confirmation": AlertTriangle,
  "unable-to-continue": XCircle,
} as const;

type MissionDetailViewProps = {
  data: MissionDetailPageData;
  closeoutClosed: boolean;
  closeoutRequested: boolean;
  closeoutResult: MissionCloseoutDraft | null;
  onConfirmCloseout: (draft: MissionCloseoutDraft) => void;
  latestAssumedTask: MissionExecutionStep | null;
  nextTask: MissionExecutionStep | null;
  steps: MissionExecutionStep[];
};

export function MissionDetailView({ closeoutClosed, closeoutRequested, closeoutResult, data, latestAssumedTask, nextTask, onConfirmCloseout, steps }: MissionDetailViewProps) {
  const completedCount = useMemo(() => steps.filter((step) => step.status === "completed").length, [steps]);
  const assumedCount = useMemo(() => steps.filter((step) => step.completionSource === "assumed-by-time").length, [steps]);

  useEffect(() => {
    document.title = `${data.title} | TUNAS`;
  }, [data.title]);

  return (
    <div className="grid gap-5">
      <Link to="/missions" className="inline-flex min-h-11 w-fit items-center gap-2 rounded-md px-1 text-sm font-bold text-forest-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to missions
      </Link>

      <PageHeader
        badges={<><Badge variant={closeoutClosed ? "success" : "ai"}>{closeoutClosed ? "Closed" : data.statusLabel}</Badge><RiskIndicator level={data.risk} label={data.riskLabel} /><Badge variant="source">Demo only</Badge></>}
        eyebrow="Mission execution"
        title={data.title}
        description={data.objective}
        meta={data.freshness}
        actions={<Button type="button" variant="outline" disabled={closeoutClosed} icon={<CheckCircle2 aria-hidden="true" />} onClick={() => openTunasAssistantWithDraft(`I would like to close out the mission “${data.title}”.`)}>{closeoutClosed ? "Mission closed" : "Close mission"}</Button>}
      />

      {closeoutClosed ? <Alert variant="success" aria-live="polite"><CheckCircle2 aria-hidden="true" /><AlertTitle>Mission closed in this demo session</AlertTitle><AlertDescription>{closeoutResult?.outcome} The result is not persisted and no external Calendar event was changed.</AlertDescription></Alert> : <Card variant="highlight">
        <CardHeader><p className="text-xs font-bold uppercase tracking-[0.14em] text-forest-700">Next task in the approved plan</p><CardTitle className="text-2xl">{nextTask?.title ?? "Plan tasks elapsed"}</CardTitle><p className="max-w-3xl leading-7 text-muted-foreground">{nextTask?.description ?? "The schedule has reached the end of the approved task list. Report only exceptions, then close the mission when the outcome is ready."}</p></CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="outline" disabled={!latestAssumedTask} icon={<MessageSquareWarning aria-hidden="true" />} onClick={() => latestAssumedTask && openTunasAssistantWithDraft(`The task “${latestAssumedTask.title}” was not done.`)}>Report task not done</Button>
          <Button type="button" variant="outline" disabled={!nextTask} icon={<CalendarClock aria-hidden="true" />} onClick={() => nextTask && openTunasAssistantWithDraft(`I would like to move this task: “${nextTask.title}”.`)}>Request a new time</Button>
        </CardContent>
      </Card>}

      {closeoutRequested && !closeoutClosed ? <MissionCloseoutPanel data={data} onConfirm={onConfirmCloseout} /> : null}

      <section aria-labelledby="execution-progress-heading" className="grid gap-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div><h2 id="execution-progress-heading" className="text-xl font-extrabold">Plan progress</h2><p className="mt-1 text-sm text-muted-foreground">Routine tasks advance when their scheduled window ends. Report only missed or moved work.</p></div>
          <p className="font-bold tabular-nums">{completedCount} of {steps.length} completed</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Mission execution progress" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={completedCount}><div className="h-full rounded-full bg-forest-500 transition-[width]" style={{ width: `${steps.length ? (completedCount / steps.length) * 100 : 0}%` }} /></div>

        <ol className="grid gap-3">
          {steps.map((step, index) => {
            const Icon = statusIcons[step.status];
            return (
              <li key={step.id}>
                <Card variant={step.status === "in-progress" ? "highlight" : "default"}>
                  <CardContent className="flex gap-4 pt-5 sm:pt-6">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-forest-700"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                    <div className="min-w-0 flex-1"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Task {index + 1}</p><h3 className="mt-1 text-lg font-bold">{step.title}</h3></div><div className="flex flex-wrap gap-2"><Badge variant={statusVariants[step.status]}>{step.statusLabel}</Badge>{step.completionSource === "assumed-by-time" ? <Badge variant="source">Assumed by schedule</Badge> : null}{step.completionSource === "user-confirmed" ? <Badge variant="source">User confirmed</Badge> : null}</div></div><p className="mt-2 leading-6 text-muted-foreground">{step.description}</p>{step.completedLabel || step.scheduledLabel ? <p className="mt-2 text-sm font-semibold text-muted-foreground">{step.completedLabel ?? step.scheduledLabel}</p> : null}</div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ol>
        {assumedCount ? <p className="text-sm leading-6 text-muted-foreground"><strong className="text-foreground">{assumedCount} task{assumedCount === 1 ? "" : "s"}</strong> completed by elapsed schedule rather than direct user confirmation. These can be corrected through Ask TUNAS.</p> : null}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card><CardHeader><CardTitle>Approved strategy</CardTitle></CardHeader><CardContent className="grid gap-4"><div><p className="text-sm font-semibold text-muted-foreground">{data.plan.name}</p><p className="mt-1 leading-7">{data.plan.summary}</p></div><dl className="grid gap-3 border-t pt-4"><div><dt className="text-sm font-semibold text-muted-foreground">Expected result</dt><dd className="mt-1 font-bold">{data.plan.expectedResult}</dd></div><div><dt className="text-sm font-semibold text-muted-foreground">Constraint</dt><dd className="mt-1">{data.plan.constraint}</dd></div></dl></CardContent></Card>
        <Card><CardHeader><CardTitle>Approval record</CardTitle></CardHeader><CardContent><ol className="grid gap-4">{data.approvalHistory.map((item) => <li key={item.id} className="border-l-2 border-forest-300 pl-4"><p className="font-bold">{item.label}</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{item.detail}</p><time className="mt-1 block text-xs text-muted-foreground" dateTime={item.dateTime}>{item.timeLabel}</time></li>)}</ol></CardContent></Card>
      </div>

      <Alert variant={data.impact.tone}><AlertTriangle aria-hidden="true" /><AlertTitle>{data.impact.title}</AlertTitle><AlertDescription>{data.impact.description}</AlertDescription></Alert>

      <details className="rounded-lg border bg-card"><summary className="min-h-11 cursor-pointer px-5 py-4 font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-ring/30">Original mission request</summary><p className="border-t px-5 py-4 leading-7 text-muted-foreground">{data.originalRequest}</p></details>
    </div>
  );
}
