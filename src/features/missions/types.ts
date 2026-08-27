export type FactProvenance =
  | "confirmed"
  | "farmer-reported"
  | "estimate"
  | "inferred"
  | "missing"
  | "contradiction";

export type Confidence = "high" | "medium" | "low" | "unknown";

export type MissionFactKey =
  | "fieldBlock"
  | "cropBatch"
  | "maturity"
  | "buyerQuantity"
  | "grade"
  | "deadline"
  | "weatherDependency"
  | "objective"
  | "constraints"
  | "harvestAmount";

export type MissionFact = {
  key: MissionFactKey;
  label: string;
  value: string;
  provenance: FactProvenance;
  confidence: Confidence;
  editable: boolean;
  required: boolean;
  note?: string;
};

export type MissionInterpretation = {
  missionId: string;
  originalMessage: string;
  facts: MissionFact[];
  contradictions: string[];
  lowConfidenceKeys: MissionFactKey[];
  missingKeys: MissionFactKey[];
};

export type ClarificationCheckpoint = {
  checkpointId: string;
  missionId: string;
  question: string;
  reason: string;
  status: "waiting";
  normalized: { buyerQuantityKg: number };
};

export type Quantity = { min: number; max: number; unit: string };
export type RiskLevel = "low" | "medium" | "high" | "unknown";

export type DailyWindowSchedule = {
  type: "daily-window";
  startTime: string;
  endTime: string;
};

export type DateRangeSchedule = {
  type: "date-range";
  startDate: string;
  endDate: string;
  durationLabel: string;
  currentPhase?: { label: string; progressLabel?: string };
  nextActivity?: {
    label: string;
    date: string;
    timeWindow?: { startTime: string; endTime: string };
  };
};

export type MissionSchedule = DailyWindowSchedule | DateRangeSchedule;

export type HarvestPlan = {
  id: string;
  name: string;
  summary: string;
  saleableQuantity: Quantity;
  grade: { label: string; quantity: Quantity };
  fulfilment: { target: number; unit: string; minPercent: number; maxPercent: number };
  schedule: MissionSchedule;
  rainExposure: RiskLevel;
  deadlineRisk: RiskLevel;
  uncertainty: { marginKg: number; confidence: Confidence; reason: string };
  assumptions: string[];
  advantage: string;
  tradeOff: string;
  recommended: boolean;
  feasibility: { selectable: boolean; reasons: string[] };
  revision: "initial" | "adjusted";
};

export type PlanningResult = {
  plans: HarvestPlan[];
  constraintSummary: string;
  hasValidPlan: boolean;
  blockers: string[];
};

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  timezone: string;
  conditional: boolean;
  demoOnly: boolean;
  detail: string;
};

export type MissionStepName = string;

export type ApprovalPreview = {
  approvalKey: string;
  missionId: string;
  revisionId: string;
  planId: HarvestPlan["id"];
  planName: HarvestPlan["name"];
  calendarLabel: string;
  date: string;
  timezone: string;
  demoOnly: boolean;
  events: CalendarEvent[];
  steps: Array<{ id: string; name: MissionStepName; status: "scheduled" }>;
};

export type CreatedMission = ApprovalPreview & {
  status: "scheduled";
  duplicate: boolean;
};

export type MissionContextData = {
  timezone: string;
  buyer?: { quantity: number; unit: string; marketQuality: string; deadline: string };
  weather?: { summary: string; provenance: FactProvenance; confidence: Confidence };
  rules?: Array<{ id: string; version: string; description: string; source: string }>;
  disclosure?: { label: string; tone: "warning" | "source" | "info" };
};

export type MockScenario = "normal" | "interpret-failure" | "submit-failure";
export type StableStage = "input" | "review" | "checkpoint" | "plans" | "approval" | "success";

export type MissionDraftSnapshot = {
  version: 2;
  missionId: string;
  message: string;
  stage: StableStage;
  interpretation: MissionInterpretation | null;
  checkpoint: ClarificationCheckpoint | null;
  harvestAmount: string;
  plans: HarvestPlan[];
  initialPlans: HarvestPlan[];
  adjustment: string;
  appliedAdjustment: string;
  adjusted: boolean;
  revisionId: string | null;
  selectedPlanId: HarvestPlan["id"] | null;
  preview: ApprovalPreview | null;
  createdMission: CreatedMission | null;
};

export type MissionServiceErrorCode =
  | "PARSE_FAILED"
  | "UNSUPPORTED_INPUT"
  | "VALIDATION_FAILED"
  | "CHECKPOINT_INVALID"
  | "UNSUPPORTED_ADJUSTMENT"
  | "SUBMIT_FAILED";

export class MissionServiceError extends Error {
  readonly code: MissionServiceErrorCode;
  readonly fieldKey?: MissionFactKey;

  constructor(code: MissionServiceErrorCode, message: string, fieldKey?: MissionFactKey) {
    super(message);
    this.code = code;
    this.fieldKey = fieldKey;
    this.name = "MissionServiceError";
  }
}

export interface MissionService {
  createDraft(): Promise<{ missionId: string }>;
  interpret(input: { missionId: string; message: string; scenario: MockScenario }): Promise<MissionInterpretation>;
  checkpoint(interpretation: MissionInterpretation): Promise<{ checkpoint: ClarificationCheckpoint; interpretation: MissionInterpretation }>;
  plan(input: { checkpoint: ClarificationCheckpoint; harvestAmountKg: number; interpretation: MissionInterpretation }): Promise<PlanningResult>;
  recalculate(input: { adjustment: string; plans: HarvestPlan[]; missionId: string }): Promise<{ revisionId: string; result: PlanningResult; changes: string[] }>;
  preview(input: { missionId: string; revisionId: string; plan: HarvestPlan }): Promise<ApprovalPreview>;
  submit(input: { preview: ApprovalPreview; scenario: MockScenario }): Promise<CreatedMission>;
}
