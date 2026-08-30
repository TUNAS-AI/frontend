import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { approveTunasPendingAction, rejectTunasPendingAction, sendTunasReport, type OperationalReport, type OperationalReportType, type TunasInteractionState } from "@/api/tunas";
import type { Mission } from "@/api/missions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReportSummary } from "./ReportSummary";

const reportTypes: Array<{ value: OperationalReportType; label: string }> = [
  { value: "ACTIVITY_STARTED", label: "Activity started" }, { value: "ACTIVITY_COMPLETED", label: "Activity completed" },
  { value: "ACTUAL_QUANTITY_REPORTED", label: "Actual quantity" }, { value: "WORKER_AVAILABILITY_CHANGED", label: "Worker availability" },
  { value: "BUYER_REQUIREMENT_CHANGED", label: "Buyer requirement" }, { value: "DRYING_RESOURCE_CHANGED", label: "Drying resource" },
  { value: "RAIN_OR_FIELD_EVENT", label: "Rain or field event" }, { value: "MISSION_DEVIATION", label: "Mission deviation" },
  { value: "GENERAL_OPERATIONAL_NOTE", label: "General note" },
];

type Props = { mission: Mission; open: boolean; initialType?: OperationalReportType; onOpenChange: (open: boolean) => void; onApproved: () => void };

export function OperationalReportDialog({ mission, open, initialType = "GENERAL_OPERATIONAL_NOTE", onOpenChange, onApproved }: Props) {
  const currentStep = mission.missionSteps.find((step) => step.stage === mission.stage && step.status !== "COMPLETED");
  const [type, setType] = useState<OperationalReportType>(initialType);
  const [observedAt, setObservedAt] = useState(toLocalDateTime(new Date()));
  const [value, setValue] = useState("");
  const [secondary, setSecondary] = useState("");
  const [choice, setChoice] = useState("yes");
  const [narrative, setNarrative] = useState("");
  const [response, setResponse] = useState<TunasInteractionState | null>(null);
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (open) { setType(initialType); setObservedAt(toLocalDateTime(new Date())); setValue(""); setSecondary(""); setChoice("yes"); setNarrative(""); setResponse(null); setError(null); } }, [initialType, open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setWorking("submit"); setError(null);
    try { setResponse(await sendTunasReport(mission.missionId, buildReport(type, observedAt, currentStep?.missionStepId, value, secondary, choice, narrative), crypto.randomUUID())); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "We could not prepare this report."); }
    finally { setWorking(null); }
  }

  async function decide(decision: "approve" | "reject") {
    const pendingActionId = response?.pendingAction?.pendingActionId; if (!pendingActionId) return;
    setWorking(decision); setError(null);
    try { const updated = decision === "approve" ? await approveTunasPendingAction(pendingActionId) : await rejectTunasPendingAction(pendingActionId); setResponse(updated); if (decision === "approve") onApproved(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "We could not save this decision."); }
    finally { setWorking(null); }
  }

  const pending = response?.pendingAction;
  const canDecide = pending?.status.toLowerCase() === "pending";
  const canReplan = response?.impact?.replanSupported && response.semanticActions?.some((action) => action.type === "OPEN_REPLAN");
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Report operational change</DialogTitle><DialogDescription>Record what happened, review TUNAS's readable preview, then approve before it changes the mission record.</DialogDescription></DialogHeader>
    {!response ? <form className="grid gap-4" onSubmit={(event) => void submit(event)}>
      <label className="grid gap-2 text-sm font-semibold">Report type<select className="min-h-11 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30" value={type} onChange={(event) => { setType(event.target.value as OperationalReportType); setValue(""); setSecondary(""); }}>{reportTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label className="grid gap-2 text-sm font-semibold">Observed at<Input type="datetime-local" required value={observedAt} onChange={(event) => setObservedAt(event.target.value)} /></label>
      {currentStep && ["ACTIVITY_STARTED", "ACTIVITY_COMPLETED"].includes(type) ? <p className="rounded-md bg-muted/50 p-3 text-sm"><span className="font-bold">Current task: </span>{currentStep.title}</p> : null}
      <ReportFields type={type} value={value} secondary={secondary} choice={choice} onValue={setValue} onSecondary={setSecondary} onChoice={setChoice} />
      <label className="grid gap-2 text-sm font-semibold">Additional context <span className="font-normal text-muted-foreground">Optional</span><Textarea value={narrative} onChange={(event) => setNarrative(event.target.value)} placeholder="Context that will help explain this report…" /></label>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<Button type="submit" className="w-full sm:w-fit sm:justify-self-end" isLoading={working === "submit"} loadingLabel="Preparing report">Review report</Button>
    </form> : <div className="grid gap-4"><div className="rounded-md border border-ai-100 bg-ai-50 p-4"><p className="font-bold text-ai-700">{pending?.preview.question || response.message || "Review operational report"}</p>{pending?.preview.report ? <ReportSummary report={pending.preview.report} /> : <ReportSummary report={buildReport(type, observedAt, currentStep?.missionStepId, value, secondary, choice, narrative)} />}</div>
      {response.impact ? <div className="rounded-md border p-3 text-sm"><p className="font-bold">Impact: {response.impact.level === "MATERIAL" ? "Material change" : "No material planning impact"}</p>{response.impact.reasons.length ? <ul className="mt-2 grid gap-1">{response.impact.reasons.map((reason, index) => <li key={`${index}-${reason}`}>{reason}</li>)}</ul> : null}{canReplan ? <Button asChild variant="outline" size="sm" className="mt-3"><Link to={`/missions/${mission.missionId}/edit`}>Open replan</Link></Button> : null}</div> : null}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}{canDecide ? <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" disabled={working !== null} isLoading={working === "reject"} onClick={() => void decide("reject")}>Reject</Button><Button type="button" disabled={working !== null} isLoading={working === "approve"} onClick={() => void decide("approve")}>Approve report</Button></div> : <p className="text-sm font-semibold">Report {pending?.status.toLowerCase() || "processed"}.</p>}
    </div>}
  </DialogContent></Dialog>;
}

function ReportFields({ type, value, secondary, choice, onValue, onSecondary, onChoice }: { type: OperationalReportType; value: string; secondary: string; choice: string; onValue: (value: string) => void; onSecondary: (value: string) => void; onChoice: (value: string) => void }) {
  if (type === "ACTIVITY_STARTED" || type === "ACTIVITY_COMPLETED") return null;
  if (type === "ACTUAL_QUANTITY_REPORTED") return <NativeField label="Actual quantity (kg)" type="number" value={value} onChange={onValue} />;
  if (type === "WORKER_AVAILABILITY_CHANGED") return <><NativeField label="Available workers" type="number" step="1" value={value} onChange={onValue} /><NativeField label="Effective at (optional)" type="datetime-local" value={secondary} onChange={onSecondary} required={false} /></>;
  if (type === "BUYER_REQUIREMENT_CHANGED") return <><NativeField label="Target quantity (kg)" type="number" value={value} onChange={onValue} /><NativeField label="Deadline (optional)" type="date" value={secondary} onChange={onSecondary} required={false} /></>;
  if (type === "DRYING_RESOURCE_CHANGED") return <><YesNo label="Drying resource available?" value={choice} onChange={onChoice} /><YesNo label="Protection available?" value={secondary || "yes"} onChange={onSecondary} /></>;
  const labels: Record<"RAIN_OR_FIELD_EVENT" | "MISSION_DEVIATION" | "GENERAL_OPERATIONAL_NOTE", string> = { RAIN_OR_FIELD_EVENT: "Rain or field event", MISSION_DEVIATION: "Deviation description", GENERAL_OPERATIONAL_NOTE: "Operational note" };
  return <label className="grid gap-2 text-sm font-semibold">{labels[type]}<Textarea required value={value} onChange={(event) => onValue(event.target.value)} /></label>;
}
function NativeField({ label, type, value, onChange, required = true, step = "any" }: { label: string; type: "number" | "date" | "datetime-local"; value: string; onChange: (value: string) => void; required?: boolean; step?: string }) { return <label className="grid gap-2 text-sm font-semibold">{label}<Input type={type} min={type === "number" ? "0" : undefined} step={type === "number" ? step : undefined} required={required} value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function YesNo({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <fieldset><legend className="text-sm font-semibold">{label}</legend><div className="mt-1 flex gap-5">{["yes", "no"].map((option) => <label key={option} className="flex min-h-11 items-center gap-2 text-sm"><input type="radio" name={label} value={option} checked={value === option} onChange={(event) => onChange(event.target.value)} />{option === "yes" ? "Yes" : "No"}</label>)}</div></fieldset>; }
function buildReport(type: OperationalReportType, observedAt: string, missionStepId: string | undefined, value: string, secondary: string, choice: string, narrative: string): OperationalReport {
  const base = { observedAt: new Date(observedAt).toISOString(), ...(missionStepId ? { missionStepId } : {}), ...(narrative.trim() ? { narrative: narrative.trim() } : {}) };
  if (type === "ACTIVITY_STARTED" || type === "ACTIVITY_COMPLETED") { if (!missionStepId) throw new Error("This mission has no current task to report."); return { ...base, reportType: type, payload: { missionStepId } }; }
  if (type === "ACTUAL_QUANTITY_REPORTED") return { ...base, reportType: type, payload: { quantityKg: Number(value) } };
  if (type === "WORKER_AVAILABILITY_CHANGED") return { ...base, reportType: type, payload: { availableWorkers: Number(value), ...(secondary ? { effectiveAt: new Date(secondary).toISOString() } : {}) } };
  if (type === "BUYER_REQUIREMENT_CHANGED") return { ...base, reportType: type, payload: { targetQuantityKg: Number(value), ...(secondary ? { deadline: secondary } : {}) } };
  if (type === "DRYING_RESOURCE_CHANGED") return { ...base, reportType: type, payload: { available: choice === "yes", protectionAvailable: (secondary || "yes") === "yes" } };
  if (type === "RAIN_OR_FIELD_EVENT") return { ...base, reportType: type, payload: { event: value.trim(), observedAt: new Date(observedAt).toISOString() } };
  if (type === "MISSION_DEVIATION") return { ...base, reportType: type, payload: { description: value.trim() } };
  return { ...base, reportType: type, payload: { text: value.trim() } };
}
function toLocalDateTime(date: Date) { const offset = date.getTimezoneOffset() * 60_000; return new Date(date.getTime() - offset).toISOString().slice(0, 16); }
