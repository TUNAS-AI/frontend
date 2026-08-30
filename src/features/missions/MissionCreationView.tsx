import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, CircleAlert, FileText, Send, Sparkles, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { confirmMissionPreview, confirmMissionReplan, getMissionReplanDraft, interpretMissionPreview, interpretMissionReplan, isStaleMissionApproval, planMissionPreview, planMissionReplan, type MissionFactReview, type MissionPlanRecommendation, type MissionPreviewCandidate, type MissionPreviewPlan } from "@/api/missions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { ConfidenceIndicator } from "@/components/ui/ConfidenceIndicator";
import { PageHeader } from "@/components/ui/PageHeader";
import { FieldGroup, Select } from "@/components/ui/FieldControl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "./MissionsView";
import { clearMissionCreationDraft, clearMissionEditDraft, persistMissionCreationDraft, persistMissionEditDraft, restoreMissionCreationDraft, restoreMissionEditDraft } from "./missionCreationDraft";

const requiredKeys = ["fieldBlockId", "cropBatchIds", "marketQuality", "plannedHarvestKg", "plannedDriedKg", "deadline", "harvestDurationHours", "rainProtectionAvailable"] as const;
type EditableFactKey = typeof requiredKeys[number] | "notes";
const labels: Record<string, string> = { fieldBlockId: "Field block", cropBatchIds: "Crop batches", marketQuality: "Market quality", plannedHarvestKg: "Planned harvest", plannedDriedKg: "Planned dried weight", deadline: "Deadline", harvestDurationHours: "Estimated harvest duration (hours)", rainProtectionAvailable: "Rain protection available", availableWorkerCount: "Available workers", notes: "Notes" };

function reviewFor(candidate: MissionPreviewCandidate, key: string) { return candidate.review.find((item) => item.key === key); }
function hasValue(value: unknown) { return value !== null && value !== "" && value !== undefined && (!Array.isArray(value) || value.length > 0); }
function isConfirmed(candidate: MissionPreviewCandidate) { return requiredKeys.every((key) => hasValue(candidate.facts[key])); }
function promptFor(candidate: MissionPreviewCandidate | null) { return candidate?.facts.clarification?.question ?? "Describe the harvest goal, field, target amount, market quality, and deadline."; }

export function MissionCreationView({ missionId }: { missionId?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const tunas = location.state as { tunasDraft?: string; tunasAutoGenerate?: boolean } | null;
  const tunasStarted = useRef(false);
  const restored = useMemo(() => missionId ? restoreMissionEditDraft(missionId) : restoreMissionCreationDraft(), [missionId]);
  const [candidate, setCandidate] = useState<MissionPreviewCandidate | null>(restored.candidate);
  const [planPreview, setPlanPreview] = useState(restored.planPreview);
  const [selectedPlanId, setSelectedPlanId] = useState(restored.selectedPlanId);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState<"interpret" | "plan" | "confirm" | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(Boolean(missionId && !restored.candidate));

  useEffect(() => { if (missionId) persistMissionEditDraft(missionId, { candidate, planPreview, selectedPlanId }); else persistMissionCreationDraft({ candidate, planPreview, selectedPlanId }); }, [candidate, missionId, planPreview, selectedPlanId]);
  useEffect(() => {
    if (!missionId || restored.candidate) return;
    let live = true;
    void getMissionReplanDraft(missionId).then((draft) => { if (live) setCandidate(draft); }).catch((reason) => { if (live) setError(reason instanceof Error ? reason.message : "We could not load this mission for editing."); }).finally(() => { if (live) setLoadingDraft(false); });
    return () => { live = false; };
  }, [missionId, restored.candidate]);
  useEffect(() => {
    if (!missionId || !candidate || !tunas?.tunasDraft || tunasStarted.current || working !== null) return;
    tunasStarted.current = true;
    setMessage(tunas.tunasDraft);
    void (async () => {
      setError(null); setWorking("interpret");
      try {
        const result = await interpretMissionReplan(missionId, { previewId: candidate.previewId, messages: candidate.messages, facts: candidate.facts, message: tunas.tunasDraft! });
        setCandidate(result); setPlanPreview(null); setSelectedPlanId(null);
        if (tunas.tunasAutoGenerate && isConfirmed(result)) {
          setWorking("plan");
          const preview = await planMissionReplan(missionId, result);
          setPlanPreview(preview); setSelectedPlanId(preview.status === "feasible" ? preview.recommendation?.planId ?? null : null);
        }
      } catch (reason) { setError(reason instanceof Error ? reason.message : "Tunas could not prepare this weather replan. Try again."); }
      finally { setWorking(null); navigate(location.pathname, { replace: true, state: null }); }
    })();
  }, [candidate, location.pathname, missionId, navigate, tunas?.tunasAutoGenerate, tunas?.tunasDraft, working]);

  const selectedPlan = planPreview?.status === "feasible" ? planPreview.candidates.find((plan) => plan.planId === selectedPlanId) ?? null : null;
  const complete = candidate ? isConfirmed(candidate) : false;
  const missing = candidate ? requiredKeys.filter((key) => !hasValue(candidate.facts[key])) : [];

  async function interpret() {
    const text = message.trim();
    if (!text) { setError("Describe the mission or answer TUNAS’s clarification before continuing."); return; }
    setError(null); setWorking("interpret");
    try {
      const input = { previewId: candidate?.previewId, messages: candidate?.messages, facts: candidate?.facts, message: text };
      const result = missionId ? await interpretMissionReplan(missionId, input) : await interpretMissionPreview(input);
      setCandidate(result); setPlanPreview(null); setSelectedPlanId(null); setMessage("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "TUNAS could not review this request. Try again."); } finally { setWorking(null); }
  }

  async function generatePlans() {
    if (!candidate) return;
    setError(null); setWorking("plan");
    try {
      const result = missionId ? await planMissionReplan(missionId, candidate) : await planMissionPreview(candidate);
      setPlanPreview(result); setSelectedPlanId(result.status === "feasible" ? result.recommendation?.planId ?? null : null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "TUNAS could not generate plans. Try again."); } finally { setWorking(null); }
  }

  async function confirm() {
    if (!planPreview || planPreview.status !== "feasible" || !selectedPlan) return;
    setError(null); setWorking("confirm");
    try {
      const mission = missionId ? await confirmMissionReplan(missionId, planPreview.previewToken, selectedPlan.planId) : await confirmMissionPreview(planPreview.previewToken, selectedPlan.planId);
      if (missionId) clearMissionEditDraft(missionId); else clearMissionCreationDraft(); navigate(`/missions/${mission.missionId}`);
    } catch (reason) {
      if (isStaleMissionApproval(reason)) {
        setPlanPreview(null); setSelectedPlanId(null); setApprovalOpen(false);
        if (missionId) {
          persistMissionEditDraft(missionId, { candidate: null, planPreview: null, selectedPlanId: null });
          try { setCandidate(await getMissionReplanDraft(missionId)); } catch { setCandidate(null); }
        } else persistMissionCreationDraft({ candidate, planPreview: null, selectedPlanId: null });
        setError("This approval preview expired or became stale. No mission or schedule was changed. Review the current details and generate new options.");
      } else {
        setError(reason instanceof Error ? reason.message : "The selected plan could not be approved.");
        setApprovalOpen(false);
      }
    } finally { setWorking(null); }
  }

  function revise() { setPlanPreview(null); setSelectedPlanId(null); setError(null); }
  function discard() { if (missionId) { clearMissionEditDraft(missionId); navigate(`/missions/${missionId}`); } else { clearMissionCreationDraft(); navigate("/missions"); } }
  function updateFact(key: EditableFactKey, value: MissionPreviewCandidate["facts"][EditableFactKey]) {
    setCandidate((current) => {
      if (!current) return current;
      const facts = { ...current.facts, [key]: value, clarification: null };
      if (key === "fieldBlockId") facts.cropBatchIds = [];
      const touched = key === "fieldBlockId" ? new Set([key, "cropBatchIds"]) : new Set([key]);
      const review = current.review.map((item) => touched.has(item.key) ? { ...item, status: hasValue(facts[item.key]) ? "confirmed" as const : "missing" as const, reason: hasValue(facts[item.key]) ? "Farmer-confirmed." : key === "notes" ? "Optional additional context." : "This detail is needed before planning.", provenance: "FARMER_REPORTED" as const, confidence: hasValue(facts[item.key]) ? "high" as const : "low" as const } : item);
      return { ...current, facts, review };
    });
    setPlanPreview(null); setSelectedPlanId(null); setError(null);
  }

  return <div className="grid gap-6">
    <PageHeader eyebrow="Harvest and drying work" title={missionId ? "Edit mission" : "New mission"} description={missionId ? "Describe what changed or what went wrong. TUNAS will update the mission details and offer a replacement plan." : "Tell TUNAS what you need to harvest. It will ask only for the details needed to make a safe plan."} actions={<Button type="button" variant="outline" className="border-white/35 bg-white/10 text-white hover:bg-white/20 hover:text-white focus-visible:ring-white/60 focus-visible:ring-offset-primary" onClick={() => setDiscardOpen(true)} icon={<Trash2 aria-hidden="true" />}>Discard draft</Button>} />
    {error ? <Alert variant="danger" role="alert"><CircleAlert aria-hidden="true" /><AlertTitle>Mission needs attention</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}
    {loadingDraft ? <Card><CardContent className="py-6 text-sm text-muted-foreground">Loading mission details…</CardContent></Card> : null}
    {!loadingDraft && !planPreview ? <>
      {candidate ? <FactSummary candidate={candidate} missing={missing} onChange={updateFact} /> : null}
      <MissionPromptCard candidate={candidate} message={message} working={working} onMessage={setMessage} onInterpret={() => void interpret()} />
      {candidate && complete ? <Card variant="success"><CardHeader><CardTitle>Ready to generate plans</CardTitle><CardDescription>Your required mission details are confirmed. TUNAS will use the selected field, farm context, and current weather forecast to make options.</CardDescription></CardHeader><CardFooter className="justify-end"><Button type="button" size="lg" onClick={() => void generatePlans()} isLoading={working === "plan"} loadingLabel="Generating plans" icon={<Sparkles aria-hidden="true" />}>Generate plan options</Button></CardFooter></Card> : null}
    </> : !loadingDraft && planPreview?.status === "feasible" ? <PlanReview plans={planPreview.candidates} recommendation={planPreview.recommendation} selectedPlan={selectedPlan} onSelect={setSelectedPlanId} onRevise={revise} onApprove={() => setApprovalOpen(true)} /> : !loadingDraft && planPreview?.status === "infeasible" ? <InfeasiblePlan blockers={planPreview.blockers} onRevise={revise} /> : null}
    <AlertDialog open={approvalOpen} onOpenChange={setApprovalOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{missionId ? "Approve replacement plan?" : "Approve this mission plan?"}</AlertDialogTitle><AlertDialogDescription>{selectedPlan ? `${selectedPlan.name} will become your active TUNAS schedule. If Google Calendar is connected, TUNAS will sync this approved schedule there.` : "Select a plan before approval."}</AlertDialogDescription></AlertDialogHeader>{selectedPlan ? <div className="grid gap-3 rounded-md border bg-muted/30 p-3 text-sm leading-6"><strong>{selectedPlan.name}</strong><span>{selectedPlan.summary}</span></div> : null}<AlertDialogFooter><AlertDialogCancel disabled={working === "confirm"}>Keep reviewing</AlertDialogCancel><AlertDialogAction disabled={!selectedPlan || working === "confirm"} onClick={(event) => { event.preventDefault(); void confirm(); }}>{working === "confirm" ? "Approving…" : missionId ? "Replace and sync plan" : "Approve and sync plan"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Discard this mission draft?</AlertDialogTitle><AlertDialogDescription>Your unapproved request and plan preview will be removed from this browser session. The active mission will stay unchanged.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep drafting</AlertDialogCancel><AlertDialogAction onClick={discard}>Discard draft</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

function MissionPromptCard({ candidate, message, working, onMessage, onInterpret }: { candidate: MissionPreviewCandidate | null; message: string; working: "interpret" | "plan" | "confirm" | null; onMessage: (value: string) => void; onInterpret: () => void }) {
  return <Card variant="highlight"><CardHeader><div className="flex flex-wrap items-center gap-2"><CardTitle>{candidate ? "Add the missing detail" : "Describe your harvest mission"}</CardTitle><Badge variant="ai"><Sparkles aria-hidden="true" />TUNAS review</Badge></div><CardDescription>{promptFor(candidate)}</CardDescription></CardHeader><CardContent className="grid gap-3"><label className="grid gap-2 text-sm font-semibold" htmlFor="mission-message">Your update</label><Textarea id="mission-message" value={message} onChange={(event) => onMessage(event.target.value)} placeholder={candidate ? "Answer in your own words…" : "Example: I need to harvest shallots for a buyer by Friday."} disabled={working !== null} className="min-h-36" /><p className="text-sm leading-6 text-muted-foreground">Use plain language. TUNAS keeps the original request and updates the summary above.</p></CardContent><CardFooter className="justify-end"><Button type="button" size="lg" onClick={onInterpret} isLoading={working === "interpret"} loadingLabel="Reviewing mission" icon={<Send aria-hidden="true" />}>{candidate ? "Update mission details" : "Review mission details"}</Button></CardFooter></Card>;
}

function FactSummary({ candidate, missing, onChange }: { candidate: MissionPreviewCandidate; missing: readonly string[]; onChange: (key: EditableFactKey, value: MissionPreviewCandidate["facts"][EditableFactKey]) => void }) {
  return <section className="grid gap-4" aria-labelledby="mission-summary-heading"><div><h2 id="mission-summary-heading" className="text-2xl font-extrabold tracking-tight">Mission summary</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Review TUNAS’s extraction or fill any required detail directly. You can still use the message below to revise it in your own words.</p></div>{missing.length ? <Alert variant="warning"><CircleAlert aria-hidden="true" /><AlertTitle>Still needed: {missing.map((key) => labels[key]).join(", ")}</AlertTitle><AlertDescription>Fill the fields below or answer the focused question below.</AlertDescription></Alert> : null}<div className="grid gap-3 sm:grid-cols-2">{requiredKeys.map((key) => <FactCard key={key} factKey={key} candidate={candidate} review={reviewFor(candidate, key)} onChange={onChange} />)}<Card className="min-w-0 sm:col-span-2"><CardHeader className="gap-3 p-4"><CardTitle className="text-base">Additional notes</CardTitle><CardDescription>Add context that could affect the harvest plan. This is optional.</CardDescription><Textarea value={candidate.facts.notes ?? ""} onChange={(event) => onChange("notes", event.target.value || null)} placeholder="Example: access conditions, buyer instructions, or other field context." /></CardHeader></Card></div></section>;
}

function FactCard({ factKey, candidate, review, onChange }: { factKey: typeof requiredKeys[number]; candidate: MissionPreviewCandidate; review?: MissionFactReview; onChange: (key: EditableFactKey, value: MissionPreviewCandidate["facts"][EditableFactKey]) => void }) {
  const label = labels[factKey]; const value = candidate.facts[factKey];
  const missing = review?.status !== "confirmed";
  const options = candidate.manualOptions;
  const fieldBatches = options?.cropBatches.filter((batch) => batch.fieldBlockId === candidate.facts.fieldBlockId) ?? [];
  const control = factKey === "fieldBlockId" ? <FieldGroup label={label} required><Select value={typeof value === "string" ? value : ""} onChange={(event) => onChange(factKey, event.target.value || null)} aria-invalid={missing}><option value="">Select a field block</option>{options?.fieldBlocks.map((field) => <option key={field.fieldBlockId} value={field.fieldBlockId}>{field.name}</option>)}</Select></FieldGroup>
    : factKey === "cropBatchIds" ? <fieldset className="grid gap-2"><legend className="text-sm font-semibold">{label}<span className="ml-1 text-destructive" aria-hidden="true">*</span></legend>{candidate.facts.fieldBlockId ? fieldBatches.length ? <div className="grid gap-2 rounded-md border p-3">{fieldBatches.map((batch) => <label key={batch.cropBatchId} className="flex min-h-11 items-center gap-3 text-sm font-medium"><input type="checkbox" className="h-4 w-4 rounded border-input" checked={candidate.facts.cropBatchIds.includes(batch.cropBatchId)} onChange={(event) => onChange(factKey, event.target.checked ? [...candidate.facts.cropBatchIds, batch.cropBatchId] : candidate.facts.cropBatchIds.filter((id) => id !== batch.cropBatchId))} />{batch.label}</label>)}</div> : <p className="text-sm text-muted-foreground">No crop batches are available in this field.</p> : <p className="text-sm text-muted-foreground">Select a field block first.</p>}</fieldset>
    : factKey === "marketQuality" ? <FieldGroup label={label} required><Select value={typeof value === "string" ? value : ""} onChange={(event) => onChange(factKey, event.target.value || null)} aria-invalid={missing}><option value="">Select a market-quality grade</option><option value="Grade A">Grade A</option><option value="Grade B">Grade B</option><option value="Grade C">Grade C</option></Select></FieldGroup>
    : factKey === "deadline" ? <DeadlineField value={typeof value === "string" ? value : null} missing={missing} onChange={(next) => onChange(factKey, next)} />
    : factKey === "rainProtectionAvailable" ? <FieldGroup label={label} required><Select value={value === null ? "" : String(value)} onChange={(event) => onChange(factKey, event.target.value === "" ? null : event.target.value === "true")} aria-invalid={missing}><option value="">Select an answer</option><option value="true">Yes, protection is available</option><option value="false">No protection is available</option></Select></FieldGroup>
    : <FieldGroup label={label} required><Input type="number" min="0.001" step="0.001" value={typeof value === "number" ? value : ""} onChange={(event) => onChange(factKey, event.target.value === "" ? null : Number(event.target.value))} aria-invalid={missing} /></FieldGroup>;
  return <Card className="min-w-0"><CardHeader className="gap-3 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle className="text-base">{label}</CardTitle><Badge variant={missing ? "warning" : review?.provenance === "INFERRED" ? "source" : "success"}>{missing ? review?.status === "needs_clarification" ? "Needs clarification" : "Missing" : review?.provenance === "INFERRED" ? "From farm context" : "Farmer-reported"}</Badge></div>{control}{review ? <ConfidenceIndicator level={review.confidence} showScale={false} /> : null}</CardHeader></Card>;
}

function DeadlineField({ value, missing, onChange }: { value: string | null; missing: boolean; onChange: (value: string | null) => void }) {
  const initial = value ? formatDeadlineInput(value) : "";
  const [draft, setDraft] = useState(initial); const [error, setError] = useState<string | null>(null);
  useEffect(() => { setDraft(value ? formatDeadlineInput(value) : ""); }, [value]);
  function commit() {
    if (!draft) { setError(null); onChange(null); return; }
    const normalized = parseDeadlineInput(draft);
    if (!normalized) { setError("Use a valid date in dd/mm/yyyy format."); return; }
    setError(null); onChange(normalized);
  }
  return <FieldGroup label="Deadline" required><Input inputMode="numeric" placeholder="dd/mm/yyyy" value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={commit} aria-invalid={missing || Boolean(error)} aria-describedby={error ? "mission-deadline-error" : undefined} />{error ? <p id="mission-deadline-error" className="text-sm text-destructive" role="alert">{error}</p> : null}</FieldGroup>;
}

function formatDeadlineInput(value: string) { const [year, month, day] = value.slice(0, 10).split("-"); return year && month && day ? `${day}/${month}/${year}` : value; }
function parseDeadlineInput(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, day, month, year] = match; const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  return date.getUTCFullYear() === Number(year) && date.getUTCMonth() === Number(month) - 1 && date.getUTCDate() === Number(day) ? `${year}-${month}-${day}` : null;
}

function InfeasiblePlan({ blockers, onRevise }: { blockers: string[]; onRevise: () => void }) {
  return <Card variant="highlight"><CardHeader><div className="flex items-center gap-2"><CircleAlert aria-hidden="true" /><CardTitle>No feasible plan yet</CardTitle></div><CardDescription>The deterministic planning checks could not produce a safe option. Nothing has been scheduled or changed.</CardDescription></CardHeader><CardContent><ul className="grid gap-2 text-sm leading-6">{blockers.map((blocker) => <li key={blocker}>• {blocker}</li>)}</ul></CardContent><CardFooter className="justify-end"><Button type="button" onClick={onRevise} icon={<ArrowLeft aria-hidden="true" />}>Edit mission details</Button></CardFooter></Card>;
}

function PlanReview({ plans, recommendation, selectedPlan, onSelect, onRevise, onApprove }: { plans: MissionPreviewPlan[]; recommendation: MissionPlanRecommendation | null; selectedPlan: MissionPreviewPlan | null; onSelect: (planId: string) => void; onRevise: () => void; onApprove: () => void }) {
  if (!plans.length) return <InfeasiblePlan blockers={["The planning service returned no feasible candidates."]} onRevise={onRevise} />;
  const orderedPlans = plans.map((plan) => {
    const recommended = plan.planId === recommendation?.planId;
    return {
      ...plan,
      recommended,
      dryingEstimateReason: `${plan.dryingEstimateReason} Deterministic evidence: ${plan.evidence.join(" ") || "No additional evidence supplied."} Tradeoffs: ${plan.tradeoffs.join(" ") || "No additional tradeoffs supplied."}${recommended ? ` Advisory recommendation reasons: ${recommendation.reasons.join(" ")}` : ""}`,
    };
  }).sort((left, right) => Number(right.recommended) - Number(left.recommended));
  return <section className="grid gap-5" aria-labelledby="plan-options-heading"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="plan-options-heading" className="text-2xl font-extrabold tracking-tight">Choose a harvest plan</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Select one option to inspect its schedule, risks, and drying estimate. Selection does not create a mission.</p></div><Button type="button" variant="outline" onClick={onRevise} icon={<ArrowLeft aria-hidden="true" />}>Revise details</Button></div><div className="grid gap-3">{orderedPlans.map((plan) => <button key={plan.planId} type="button" aria-pressed={selectedPlan?.planId === plan.planId} onClick={() => onSelect(plan.planId)} className={`grid gap-3 rounded-lg border p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 ${plan.recommended ? "border-ai-200 bg-ai-50/80 shadow-farm hover:border-ai-300" : "bg-card hover:border-forest-400 hover:bg-forest-50/30"} ${selectedPlan?.planId === plan.planId ? plan.recommended ? "ring-2 ring-ai-500/30" : "border-forest-500 bg-forest-50/60 ring-2 ring-forest-500/20" : ""}`}><div className="flex flex-wrap items-center justify-between gap-2"><div className="grid gap-1"><h3 className="text-lg font-bold">{plan.name}</h3>{plan.recommended ? <p className="text-sm font-semibold text-ai-700">Best fit for the confirmed target and current conditions</p> : null}</div>{plan.recommended ? <Badge variant="ai"><Sparkles aria-hidden="true" />TUNAS recommendation</Badge> : null}{selectedPlan?.planId === plan.planId ? <CheckCircle2 className={`h-5 w-5 ${plan.recommended ? "text-ai-700" : "text-forest-700"}`} aria-label="Selected" /> : null}</div><p className="text-sm leading-6 text-muted-foreground">{plan.summary}</p><div className="grid gap-3 border-t pt-3 sm:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Drying estimate</p><p className="mt-1 font-semibold">{plan.dryingEstimateDays} days</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{plan.dryingEstimateReason}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Risks</p><ul className="mt-1 grid gap-1 text-sm leading-5 text-muted-foreground">{Object.values(plan.risks).map((risk) => <li key={risk}>{risk}</li>)}</ul></div></div></button>)}</div>{selectedPlan ? <Card variant="highlight"><CardHeader><CardTitle>{selectedPlan.name} schedule</CardTitle><CardDescription>Review the timing and assumptions before you approve.</CardDescription></CardHeader><CardContent className="grid gap-3">{selectedPlan.activities.map((activity) => <div key={`${activity.stage}-${activity.title}`} className="rounded-md border bg-card p-3"><div className="flex flex-wrap items-center justify-between gap-2"><strong>{activity.title}</strong><Badge variant="source">{activity.stage === "HARVESTING" ? "Harvest" : "Drying"}</Badge></div><p className="mt-1 text-sm leading-6 text-muted-foreground">{activity.description}</p><p className="mt-2 text-sm font-semibold">{activity.startsOn === activity.endsOn ? formatDate(activity.startsOn) : `${formatDate(activity.startsOn)}–${formatDate(activity.endsOn)}`}{activity.windowStart && activity.windowEnd ? ` · ${activity.windowStart}–${activity.windowEnd}` : ""}{activity.targetHarvestKg ? ` · ${activity.targetHarvestKg.toLocaleString("en-ID")} kg` : ""}</p></div>)}<div className="rounded-md border border-ai-100 bg-ai-50 p-3 text-sm leading-6 text-ai-700"><strong>Assumptions</strong><ul className="mt-1 list-disc pl-5">{selectedPlan.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}</ul></div></CardContent><CardFooter className="justify-end"><Button type="button" size="lg" onClick={onApprove} icon={<FileText aria-hidden="true" />}>Review and approve plan</Button></CardFooter></Card> : null}</section>;
}
