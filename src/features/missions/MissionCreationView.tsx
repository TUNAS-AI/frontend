import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarCheck2, CircleAlert, ClipboardCheck, FlaskConical, PackageOpen, RotateCcw, Save } from "lucide-react";
import { missionApi, missionDemoContext, missionReferenceInput } from "@/api/missions";
import { INITIAL_PLAN_REVISION_ID, isRevisionStale, REQUIRED_ADJUSTMENT } from "@/api/missions/missionWorkflow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FieldGroup } from "@/components/ui/FieldControl";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { clearMissionDraft, persistMissionDraft, restoreMissionDraft } from "./missionDraftStorage";
import { InterpretationReview } from "./components/InterpretationReview";
import { MissionAssistantChat } from "./components/MissionAssistantChat";
import { MissionPlanReview } from "./components/MissionPlanReview";
import type { ApprovalPreview, ClarificationCheckpoint, CreatedMission, HarvestPlan, MissionDraftSnapshot, MissionFactKey, MissionInterpretation, MockScenario, StableStage } from "./types";
import { MissionServiceError } from "./types";
import { formatMissionDate } from "./formatMissionDate";

type Stage = StableStage | "loading" | "interpreting" | "saving-checkpoint" | "planning" | "recalculating" | "previewing" | "submitting" | "error" | "no-plans";
type RetryAction = "create-draft" | "interpret" | "checkpoint" | "plan" | "recalculate" | "preview" | "submit";

const restored = restoreMissionDraft();

export function MissionCreationView() {
  const [missionId, setMissionId] = useState(restored?.missionId ?? "");
  const [message, setMessage] = useState(restored?.message ?? missionReferenceInput);
  const [stage, setStage] = useState<Stage>(restored?.stage ?? "loading");
  const [stableStage, setStableStageValue] = useState<StableStage>(restored?.stage ?? "input");
  const [scenario, setScenario] = useState<MockScenario>("normal");
  const [validationError, setValidationError] = useState("");
  const [factError, setFactError] = useState<{ key: MissionFactKey; message: string } | null>(null);
  const [serviceError, setServiceError] = useState("");
  const [interpretation, setInterpretation] = useState<MissionInterpretation | null>(restored?.interpretation ?? null);
  const [checkpoint, setCheckpoint] = useState<ClarificationCheckpoint | null>(restored?.checkpoint ?? null);
  const [harvestAmount, setHarvestAmount] = useState(restored?.harvestAmount ?? "80");
  const [plans, setPlans] = useState<HarvestPlan[]>(restored?.plans ?? []);
  const [initialPlans, setInitialPlans] = useState<HarvestPlan[]>(restored?.initialPlans ?? []);
  const [selectedPlanId, setSelectedPlanId] = useState<HarvestPlan["id"] | null>(restored?.selectedPlanId ?? null);
  const [adjustment, setAdjustment] = useState(restored?.adjustment ?? REQUIRED_ADJUSTMENT);
  const [appliedAdjustment, setAppliedAdjustment] = useState(restored?.appliedAdjustment ?? "");
  const [adjusted, setAdjusted] = useState(restored?.adjusted ?? false);
  const [revisionId, setRevisionId] = useState<string | null>(restored?.revisionId ?? (restored?.plans.length && restored.selectedPlanId && !restored.adjusted ? INITIAL_PLAN_REVISION_ID : null));
  const [preview, setPreview] = useState<ApprovalPreview | null>(restored?.preview ?? null);
  const [createdMission, setCreatedMission] = useState<CreatedMission | null>(restored?.createdMission ?? null);
  const [changes, setChanges] = useState<string[]>([]);
  const [constraintSummary, setConstraintSummary] = useState("");
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [retryAction, setRetryAction] = useState<RetryAction>("interpret");
  const [announcement, setAnnouncement] = useState(restored ? "Saved mission restored." : "Creating a new demo mission.");
  const pageHeadingRef = useRef<HTMLHeadingElement>(null);
  const stageHeadingRef = useRef<HTMLHeadingElement>(null);
  const requestRef = useRef<HTMLTextAreaElement>(null);
  const skipStageFocusRef = useRef(false);
  const draftGenerationRef = useRef(0);

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? null;
  const consequentiallyPending = ["loading", "interpreting", "saving-checkpoint", "planning", "recalculating", "previewing", "submitting"].includes(stage);

  function setStableStage(next: StableStage) {
    setStableStageValue(next);
    setStage(next);
  }

  function clearPlanningState() {
    setPlans([]);
    setInitialPlans([]);
    setSelectedPlanId(null);
    setAdjusted(false);
    setAppliedAdjustment("");
    setRevisionId(null);
    setPreview(null);
    setApprovalOpen(false);
    setChanges([]);
  }

  function goBack() {
    if (consequentiallyPending) return;

    setValidationError("");
    setFactError(null);
    if (stage === "review") {
      setCheckpoint(null);
      clearPlanningState();
      setInterpretation(null);
      setStableStage("input");
      setAnnouncement("Back to the original mission request. Interpret it again after making changes.");
      globalThis.setTimeout(() => requestRef.current?.focus(), 0);
      return;
    }
    if (stage === "checkpoint" || stage === "no-plans") {
      clearPlanningState();
      setStableStage("review");
      setAnnouncement("Back to the interpreted mission details. Confirm corrections to create a new clarification checkpoint.");
      return;
    }
    if (stage === "plans") {
      clearPlanningState();
      setStableStage("checkpoint");
      setAnnouncement("Back to the clarification answer. Update the amount, then generate fresh plans.");
      return;
    }
    if (stage === "approval") {
      setPreview(null);
      setApprovalOpen(false);
      setStableStage("plans");
      setAnnouncement("Back to plan selection. The approval preview was closed.");
    }
  }

  function getBackLabel() {
    if (consequentiallyPending) return null;
    if (stage === "review") return "Back to mission request";
    if (stage === "checkpoint" || stage === "no-plans") return "Back to interpretation";
    if (stage === "plans") return "Back to clarification";
    if (stage === "approval") return "Back to plan selection";
    return null;
  }

  useEffect(() => {
    document.title = "New mission | TUNAS";
    pageHeadingRef.current?.focus();
    if (!restored) {
      void createDraft();
    }
  }, []);

  useEffect(() => {
    if (!missionId) return;
    const snapshot: MissionDraftSnapshot = {
      version: 2, missionId, message, stage: stableStage, interpretation, checkpoint, harvestAmount,
      plans, initialPlans, adjustment, appliedAdjustment, adjusted, revisionId, selectedPlanId, preview, createdMission,
    };
    persistMissionDraft(snapshot);
  }, [missionId, message, stableStage, interpretation, checkpoint, harvestAmount, plans, initialPlans, adjustment, appliedAdjustment, adjusted, revisionId, selectedPlanId, preview, createdMission]);

  useEffect(() => {
    if (["input", "loading"].includes(stage) || approvalOpen) return;
    if (skipStageFocusRef.current) {
      skipStageFocusRef.current = false;
      return;
    }
    const timer = globalThis.setTimeout(() => stageHeadingRef.current?.focus(), 0);
    return () => globalThis.clearTimeout(timer);
  }, [stage, approvalOpen]);

  function fail(error: unknown, action: RetryAction) {
    const message = error instanceof Error ? error.message : "The demo service failed.";
    setServiceError(message);
    setRetryAction(action);
    setStage("error");
    setAnnouncement(`Error: ${message}`);
    if (error instanceof MissionServiceError && error.fieldKey) {
      globalThis.setTimeout(() => document.getElementById(`mission-fact-${error.fieldKey}`)?.focus(), 0);
    }
  }

  async function createDraft() {
    const generation = ++draftGenerationRef.current;
    setStage("loading");
    try {
      const result = await missionApi.createDraft();
      if (generation !== draftGenerationRef.current) return;
      setMissionId(result.missionId);
      setStableStage("input");
      setAnnouncement("New mission draft ready.");
    } catch (error) {
      if (generation !== draftGenerationRef.current) return;
      fail(error, "create-draft");
    }
  }

  async function interpret() {
    if (!message.trim()) {
      setValidationError("Enter a mission request before interpreting it.");
      setAnnouncement("Validation error: enter a mission request.");
      requestRef.current?.focus();
      return;
    }
    setValidationError("");
    setStage("interpreting");
    try {
      const result = await missionApi.interpret({ missionId, message, scenario });
      setScenario("normal");
      setInterpretation(result);
      setStableStage("review");
      setAnnouncement("Interpretation ready for confirmation and correction.");
    } catch (error) {
      setScenario("normal");
      if (error instanceof MissionServiceError && error.code === "UNSUPPORTED_INPUT") {
        setValidationError(error.message);
        setStableStage("input");
        setAnnouncement(`Validation error: ${error.message}`);
        globalThis.setTimeout(() => requestRef.current?.focus(), 0);
        return;
      }
      fail(error, "interpret");
    }
  }

  async function saveCheckpoint() {
    if (!interpretation) return;
    setValidationError("");
    setFactError(null);
    setStage("saving-checkpoint");
    try {
      const result = await missionApi.checkpoint(interpretation);
      setCheckpoint(result.checkpoint);
      setInterpretation(result.interpretation);
      setStableStage("checkpoint");
      setAnnouncement("Clarification ready. The mission is waiting for an expected harvest amount.");
    } catch (error) {
      if (error instanceof MissionServiceError && error.code === "VALIDATION_FAILED" && error.fieldKey) {
        skipStageFocusRef.current = true;
        setFactError({ key: error.fieldKey, message: error.message });
        setStableStage("review");
        setAnnouncement(`Validation error: ${error.message}`);
        globalThis.setTimeout(() => document.getElementById(`mission-fact-${error.fieldKey}`)?.focus(), 0);
        return;
      }
      fail(error, "checkpoint");
    }
  }

  async function plan() {
    if (!interpretation || !checkpoint) return;
    const amount = Number(harvestAmount);
    if (!Number.isFinite(amount) || amount < 1) {
      setValidationError("Enter a positive expected harvest amount in kg.");
      setAnnouncement("Validation error: enter the expected harvest amount.");
      document.getElementById("harvest-amount")?.focus();
      return;
    }
    setValidationError("");
    setStage("planning");
    try {
      const result = await missionApi.plan({ checkpoint, harvestAmountKg: amount, interpretation });
      const facts = interpretation.facts.map((fact) => fact.key === "harvestAmount" ? { ...fact, value: `${amount} kg`, provenance: "farmer-reported" as const, confidence: "high" as const } : fact);
      setInterpretation({ ...interpretation, facts, missingKeys: [] });
      setConstraintSummary(result.constraintSummary);
      setPlans(result.plans);
      setInitialPlans(result.plans);
      setAdjusted(false);
      setRevisionId(null);
      setPreview(null);
      if (!result.hasValidPlan) {
        setStage("no-plans");
        setStableStageValue("checkpoint");
        setAnnouncement("No valid plan. The expected harvest amount is too low for these strategies.");
        return;
      }
      setRevisionId(INITIAL_PLAN_REVISION_ID);
      setSelectedPlanId(result.plans.find((item) => item.recommended && item.feasibility.selectable)?.id ?? null);
      setStableStage("plans");
      setAnnouncement("Three plans ready. Select a plan to review it; adjustment is optional.");
    } catch (error) {
      fail(error, "plan");
    }
  }

  async function recalculate() {
    setValidationError("");
    setStage("recalculating");
    try {
      const result = await missionApi.recalculate({ adjustment, plans: initialPlans, missionId });
      setPlans(result.result.plans);
      setConstraintSummary(result.result.constraintSummary);
      setChanges(result.changes);
      setRevisionId(result.revisionId);
      setAppliedAdjustment(adjustment);
      setAdjusted(true);
      setPreview(null);
      setSelectedPlanId(result.result.plans.find((item) => item.recommended && item.feasibility.selectable)?.id ?? null);
      setStableStage("plans");
      setAnnouncement("Recalculation complete. Results changed and a new approval is required.");
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Unsupported adjustment.");
      if (error instanceof MissionServiceError && error.code === "UNSUPPORTED_ADJUSTMENT") {
        skipStageFocusRef.current = true;
        setStableStage("plans");
        setAnnouncement(`Validation error: ${error.message}`);
        globalThis.setTimeout(() => document.getElementById("mission-adjustment")?.focus(), 0);
        return;
      }
      fail(error, "recalculate");
    }
  }

  async function reviseFromChat(request: string) {
    if (!initialPlans.length || !missionId) return false;
    if (!/buyer|order|overtime/i.test(request)) {
      setAnnouncement("That conversational revision is outside the bounded demo. The plan was not changed.");
      return false;
    }
    setStage("recalculating");
    try {
      const result = await missionApi.recalculate({ adjustment: REQUIRED_ADJUSTMENT, plans: initialPlans, missionId });
      setPlans(result.result.plans);
      setConstraintSummary(result.result.constraintSummary);
      setChanges([`Assistant revision: ${request}`, ...result.changes]);
      setRevisionId(result.revisionId);
      setAppliedAdjustment(request);
      setAdjusted(true);
      setPreview(null);
      setSelectedPlanId(result.result.plans.find((item) => item.recommended && item.feasibility.selectable)?.id ?? null);
      setStableStage("plans");
      setAnnouncement("The mission assistant revised the plan. Review the recalculated strategies.");
      return true;
    } catch (error) {
      fail(error, "recalculate");
      return false;
    }
  }

  function changeAdjustment(value: string) {
    setAdjustment(value);
    if (adjusted && isRevisionStale(appliedAdjustment, value)) {
      setAdjusted(false);
      setRevisionId(null);
      setPreview(null);
      setSelectedPlanId(null);
      setApprovalOpen(false);
      setAnnouncement("Adjustment changed. The recalculated revision, selection, and approval preview are now stale.");
    }
  }

  async function preparePreview() {
    if (!selectedPlan || !revisionId) return;
    setStage("previewing");
    try {
      const result = await missionApi.preview({ missionId, revisionId, plan: selectedPlan });
      setPreview(result);
      setStableStage("approval");
      setApprovalOpen(true);
      setAnnouncement(`Approval preview ready for ${result.planName}. No external action has occurred.`);
    } catch (error) {
      fail(error, "preview");
    }
  }

  async function submit() {
    if (!preview) return;
    setApprovalOpen(false);
    setStage("submitting");
    try {
      const result = await missionApi.submit({ preview, scenario });
      setScenario("normal");
      setCreatedMission(result);
      setStableStage("success");
      setAnnouncement(result.duplicate ? "Duplicate submission prevented. No new events were created." : "Mission successfully scheduled in the Simulated Calendar.");
    } catch (error) {
      setScenario("normal");
      fail(error, "submit");
    }
  }

  async function newMission() {
    if (consequentiallyPending) return;
    draftGenerationRef.current += 1;
    clearMissionDraft();
    setStage("loading");
    setMessage(missionReferenceInput);
    setInterpretation(null); setCheckpoint(null); setHarvestAmount("80"); setPlans([]); setInitialPlans([]);
    setSelectedPlanId(null); setAdjustment(REQUIRED_ADJUSTMENT); setAppliedAdjustment(""); setAdjusted(false);
    setRevisionId(null); setPreview(null); setCreatedMission(null); setValidationError(""); setFactError(null); setServiceError("");
    setMissionId("");
    await createDraft();
  }

  function retry() {
    if (retryAction === "create-draft") void createDraft();
    if (retryAction === "interpret") void interpret();
    if (retryAction === "checkpoint") void saveCheckpoint();
    if (retryAction === "plan") void plan();
    if (retryAction === "recalculate") void recalculate();
    if (retryAction === "preview") void preparePreview();
    if (retryAction === "submit") void submit();
  }

  return (
    <div className="grid gap-5">
      <header className="grid gap-2 rounded-lg border bg-gradient-to-br from-forest-700 to-forest-500 px-5 py-6 text-white sm:px-7">
        <div className="flex flex-wrap items-center gap-2"><Badge className="border-white/40 bg-white/10 text-white">Input → Confirm → Plan → Approve</Badge><Badge className="border-white/40 bg-white/10 text-white">Demo only</Badge></div>
        <h1 ref={pageHeadingRef} tabIndex={-1} className="text-2xl font-extrabold leading-tight outline-none sm:text-3xl">Create a mission</h1>
        <p className="max-w-2xl text-base leading-7 text-white/90">Describe a short operational goal or a longer crop project, then review a plan before approving it.</p>
      </header>

      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>

      {getBackLabel() ? <button type="button" className="flex min-h-11 w-fit items-center gap-2 rounded-md px-1 text-sm font-bold text-forest-700 transition-colors hover:text-forest-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30" onClick={goBack}><ArrowLeft className="h-4 w-4" aria-hidden="true" />{getBackLabel()}</button> : null}

      {stage === "loading" ? <Card aria-busy="true"><CardContent className="grid justify-items-center gap-3 py-12"><RotateCcw className="h-8 w-8 animate-spin" aria-hidden="true" /><p className="font-bold">Preparing a stable mission draft…</p></CardContent></Card> : null}

      {(stage === "input" || stage === "interpreting") ? (
        <Card>
          <CardHeader><CardTitle>Describe what you want to achieve</CardTitle><p id="mission-request-description" className="text-sm leading-6 text-muted-foreground">Include only the crop, goal, timing, conditions, buyer details, or other context that matters. The original message remains saved through clarification, failure, and refresh.</p></CardHeader>
          <CardContent className="grid gap-4">
            <FieldGroup label="Mission request" required error={validationError || undefined}>
              <Textarea ref={requestRef} id="mission-request" lang="id" required aria-required="true" aria-invalid={Boolean(validationError)} aria-describedby="mission-request-description mission-request-error" aria-errormessage={validationError ? "mission-request-error" : undefined} className="min-h-40 resize-y text-base leading-7" value={message} onChange={(event) => setMessage(event.target.value)} />
              {validationError ? <span id="mission-request-error" className="sr-only">{validationError}</span> : null}
            </FieldGroup>
            {!message ? <EmptyState title="No mission request yet" description="Load the supported reference request or enter a request." action={<Button type="button" variant="outline" onClick={() => setMessage(missionReferenceInput)}>Load example input</Button>} /> : null}
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-dashed p-3 text-sm font-semibold"><input type="checkbox" className="h-5 w-5 accent-forest-600" checked={scenario === "interpret-failure"} onChange={(event) => setScenario(event.target.checked ? "interpret-failure" : "normal")} /><span><FlaskConical className="mr-2 inline h-4 w-4" aria-hidden="true" />Simulate interpretation failure on next attempt</span></label>
          </CardContent>
          <CardFooter><Button type="button" onClick={interpret} isLoading={stage === "interpreting"} trailingIcon={<ArrowRight aria-hidden="true" />}>Interpret request</Button><Button type="button" variant="ghost" onClick={() => setMessage("")} icon={<PackageOpen aria-hidden="true" />}>Start blank</Button></CardFooter>
        </Card>
      ) : null}

      {stage === "review" && interpretation ? <section className="grid gap-4"><h2 ref={stageHeadingRef} tabIndex={-1} className="sr-only">Interpretation ready</h2><InterpretationReview interpretation={interpretation} fieldError={factError} onChange={(facts) => { setFactError(null); setInterpretation({ ...interpretation, facts }); }} /><div className="flex flex-wrap gap-3"><Button type="button" onClick={saveCheckpoint}>Confirm interpretation</Button></div></section> : null}

      {stage === "checkpoint" && checkpoint && interpretation ? (
        <Card className="border-rain-300">
          <CardHeader><div className="flex flex-wrap gap-2"><Badge variant="info"><Save aria-hidden="true" />Checkpoint saved</Badge><Badge variant="warning">Waiting for answer</Badge></div><h2 ref={stageHeadingRef} tabIndex={-1} className="text-lg font-bold leading-tight outline-none">{checkpoint.question}</h2><p id="amount-description" className="text-base leading-7 text-muted-foreground">{checkpoint.reason}</p></CardHeader>
          <CardContent className="grid gap-4"><Alert variant="info"><ClipboardCheck aria-hidden="true" /><AlertTitle>Your mission is paused, not restarted</AlertTitle><AlertDescription>Original request and corrections remain attached to checkpoint {checkpoint.checkpointId}.</AlertDescription></Alert><FieldGroup label="Expected harvest amount (kg)" required error={validationError || undefined}><Input id="harvest-amount" type="number" min="1" step="0.1" required aria-required="true" aria-invalid={Boolean(validationError)} aria-describedby="amount-description amount-error" aria-errormessage={validationError ? "amount-error" : undefined} value={harvestAmount} onChange={(event) => setHarvestAmount(event.target.value)} />{validationError ? <span id="amount-error" className="sr-only">{validationError}</span> : null}</FieldGroup></CardContent>
          <CardFooter><Button type="button" onClick={plan}>Answer and resume planning</Button></CardFooter>
        </Card>
      ) : null}

      {["saving-checkpoint", "planning", "recalculating", "previewing", "submitting"].includes(stage) ? <Card aria-busy="true"><CardContent className="grid justify-items-center gap-3 py-12 text-center"><RotateCcw className="h-9 w-9 animate-spin text-forest-600" aria-hidden="true" /><h2 ref={stageHeadingRef} tabIndex={-1} className="text-xl font-bold">{stage === "saving-checkpoint" ? "Validating corrections and saving checkpoint…" : stage === "planning" ? "Planning with corrected facts and harvest amount…" : stage === "recalculating" ? "Recalculating the buyer-first revision…" : stage === "previewing" ? "Building the selected-plan Calendar preview…" : "Submitting the exact approved preview…"}</h2></CardContent></Card> : null}

      {stage === "no-plans" ? <section><h2 ref={stageHeadingRef} tabIndex={-1} className="sr-only">No valid plan</h2><EmptyState title="No valid plan with the current amount" description={constraintSummary} action={<><Button type="button" onClick={() => setStableStage("checkpoint")}>Change amount</Button><Button type="button" variant="outline" onClick={() => setStableStage("review")}>Review mission details</Button></>} /></section> : null}

      {(stage === "plans" || stage === "approval") ? <MissionPlanReview adjustment={adjustment} adjusted={adjusted} appliedAdjustment={appliedAdjustment} changes={changes} constraintSummary={constraintSummary} onAdjustmentChange={changeAdjustment} onPreview={preparePreview} onRecalculate={recalculate} onSelect={(planId) => { setSelectedPlanId(planId); setPreview(null); setStableStageValue("plans"); }} plans={plans} revisionId={revisionId} rules={missionDemoContext.rules} selectedPlan={selectedPlan} selectedPlanId={selectedPlanId} validationError={validationError} /> : null}

      <Dialog open={approvalOpen} onOpenChange={setApprovalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Approve {preview?.planName ?? "selected plan"}?</DialogTitle><DialogDescription>This creates exactly the events shown below in the Simulated Calendar only.</DialogDescription></DialogHeader>
          {preview ? <div className="grid gap-4"><Alert variant="warning"><CircleAlert aria-hidden="true" /><AlertTitle>Demo only · No external calls</AlertTitle><AlertDescription><strong>{preview.planName}</strong> on {formatMissionDate(preview.date, preview.timezone)} in farm timezone {preview.timezone}. Conditional events are explicitly marked.</AlertDescription></Alert><section aria-labelledby="calendar-preview-heading"><h3 id="calendar-preview-heading" className="mb-3 text-lg font-bold">{preview.calendarLabel} preview</h3><ol className="grid gap-2 text-base">{preview.events.map((item) => <li key={item.id} className="rounded-md border p-3"><div className="flex flex-wrap justify-between gap-2"><strong>{item.startTime}-{item.endTime} · {item.title}</strong>{item.conditional ? <Badge variant="warning">Conditional</Badge> : <Badge variant="info">Scheduled if approved</Badge>}</div><p className="mt-1 text-sm text-muted-foreground">{formatMissionDate(item.date, item.timezone)} · {item.timezone} · Demo only</p><p className="mt-1">{item.detail}</p></li>)}</ol></section><section><h3 className="mb-2 text-lg font-bold">Mission steps in this approval</h3><ol className="grid gap-2">{preview.steps.map((item, index) => <li key={item.id} className="flex min-h-11 items-center gap-3 rounded-md border p-3"><span className="font-bold">{index + 1}.</span><span>{item.name}</span></li>)}</ol></section><label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-dashed p-3 text-sm font-semibold"><input type="checkbox" className="h-5 w-5" checked={scenario === "submit-failure"} onChange={(event) => setScenario(event.target.checked ? "submit-failure" : "normal")} />Simulate consequential submission failure once</label></div> : null}
          <DialogFooter><Button type="button" variant="outline" onClick={() => setApprovalOpen(false)}>Keep reviewing</Button><Button type="button" onClick={submit}>Approve exact preview</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {stage === "error" ? <div className="grid gap-4"><h2 ref={stageHeadingRef} tabIndex={-1} className="sr-only">Recoverable service error</h2><ErrorState title="Recoverable demo service failure" description={serviceError} action={<Button type="button" onClick={retry}>Retry with saved state</Button>} />{message ? <Alert variant="success"><Save aria-hidden="true" /><AlertTitle>Mission state preserved</AlertTitle><AlertDescription lang="id" className="break-words">“{message}”</AlertDescription></Alert> : null}</div> : null}

      {stage === "success" && createdMission ? <div className="grid gap-5"><Alert variant={createdMission.duplicate ? "info" : "success"} role="status"><CalendarCheck2 aria-hidden="true" /><AlertTitle>{createdMission.duplicate ? "Duplicate submission prevented" : `${createdMission.planName} scheduled in ${createdMission.calendarLabel}`}</AlertTitle><AlertDescription>{createdMission.duplicate ? "The same approval key was recognized. No additional events or steps were created." : `Created exactly ${createdMission.events.length} previewed demo events for ${formatMissionDate(createdMission.date, createdMission.timezone)}, ${createdMission.timezone}.`}</AlertDescription></Alert><Card><CardHeader><h2 ref={stageHeadingRef} tabIndex={-1} className="text-lg font-bold leading-tight outline-none">Created events and mission steps</h2><p className="text-sm text-muted-foreground">Approval key: {createdMission.approvalKey}</p></CardHeader><CardContent className="grid gap-5"><section><h3 className="mb-2 font-bold">Events returned from the approved preview</h3><ul className="grid gap-2">{createdMission.events.map((item) => <li key={item.id} className="rounded-md border p-3"><strong>{item.startTime}-{item.endTime} · {item.title}</strong>{item.conditional ? <Badge className="ml-2" variant="warning">Conditional</Badge> : null}<p className="text-sm text-muted-foreground">{formatMissionDate(item.date, item.timezone)} · {item.timezone} · Demo only</p></li>)}</ul></section><section><h3 className="mb-2 font-bold">Created steps</h3><ol className="grid gap-2">{createdMission.steps.map((item, index) => <li key={item.id} className="flex min-h-11 items-center gap-3 rounded-md border p-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-forest-100 font-bold">{index + 1}</span><span className="font-semibold">{item.name}</span><Badge className="ml-auto" variant="info">Scheduled</Badge></li>)}</ol></section></CardContent><CardFooter><Button type="button" variant="outline" onClick={submit}>Submit same approval again</Button><Button type="button" onClick={newMission}>New mission</Button></CardFooter></Card></div> : null}

      <MissionAssistantChat interpretation={interpretation} selectedPlan={selectedPlan} plans={plans} createdMission={createdMission} constraintSummary={constraintSummary} onRevise={reviseFromChat} />

      <div className="flex justify-end"><Button type="button" variant="ghost" disabled={consequentiallyPending} onClick={newMission}>Clear and start a new mission</Button></div>
    </div>
  );
}
