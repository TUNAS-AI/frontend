import type {
  ApprovalPreview,
  CalendarEvent,
  HarvestPlan,
  MissionFactKey,
  MissionInterpretation,
  MissionStepName,
  PlanningResult,
  Quantity,
} from "../../features/missions/types.ts";
import { MissionServiceError } from "../../features/missions/types.ts";
import { DEMO_MISSION_WORKFLOW } from "./mockSupport/demoMissionData.ts";

export const REQUIRED_ADJUSTMENT = DEMO_MISSION_WORKFLOW.requiredAdjustment;
export const HARVEST_DATE = DEMO_MISSION_WORKFLOW.approval.date;
export const FARM_TIMEZONE = DEMO_MISSION_WORKFLOW.approval.timezone;
// A selected initial plan is already a complete revision. Recalculation replaces this ID.
export const INITIAL_PLAN_REVISION_ID = "initial";

const requiredFactKeys: MissionFactKey[] = [...DEMO_MISSION_WORKFLOW.requiredFactKeys];

function numberFrom(value: string, fieldKey: MissionFactKey) {
  const normalized = value.trim().replace(",", ".");
  const match = normalized.match(/^([0-9]+(?:\.[0-9]+)?)(?:\s*kg)?$/i);
  const parsed = match ? Number(match[1]) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new MissionServiceError("VALIDATION_FAILED", "Enter a valid positive number.", fieldKey);
  }
  return parsed;
}

export function validateInterpretation(interpretation: MissionInterpretation): MissionInterpretation {
  for (const key of requiredFactKeys) {
    const fact = interpretation.facts.find((item) => item.key === key);
    if (!fact?.value.trim()) {
      throw new MissionServiceError("VALIDATION_FAILED", `${fact?.label ?? key} is required before planning.`, key);
    }
  }
  const supportedValues: ReadonlyArray<{ key: MissionFactKey; pattern: RegExp; message: string }> = DEMO_MISSION_WORKFLOW.supportedFacts;
  for (const supported of supportedValues) {
    const value = interpretation.facts.find((fact) => fact.key === supported.key)?.value ?? "";
    if (!supported.pattern.test(value)) {
      throw new MissionServiceError("VALIDATION_FAILED", supported.message, supported.key);
    }
  }

  const missingKeys = interpretation.facts.filter((fact) => !fact.value.trim() || fact.provenance === "missing").map((fact) => fact.key);
  const lowConfidenceKeys = interpretation.facts.filter((fact) => fact.confidence === "low").map((fact) => fact.key);
  return { ...interpretation, missingKeys, lowConfidenceKeys, contradictions: [] };
}

export function normalizePlanningFacts(interpretation: MissionInterpretation) {
  const validated = validateInterpretation(interpretation);
  const buyerQuantityKg = numberFrom(validated.facts.find((fact) => fact.key === "buyerQuantity")?.value ?? "", "buyerQuantity");
  return { interpretation: validated, normalized: { buyerQuantityKg } };
}

export function isSupportedAdjustment(value: string) {
  const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return normalize(value) === normalize(REQUIRED_ADJUSTMENT);
}

export function isRevisionStale(appliedAdjustment: string, currentAdjustment: string) {
  return Boolean(appliedAdjustment) && appliedAdjustment !== currentAdjustment;
}

function quantity(min: number, max: number): Quantity {
  return { min: Math.max(0, Math.round(min)), max: Math.max(0, Math.round(max)), unit: DEMO_MISSION_WORKFLOW.quantityUnit };
}

export function createPlans(
  revision: "initial" | "adjusted",
  input: { buyerTarget?: number; harvestAmountKg?: number } = {},
): PlanningResult {
  const buyerTarget = input.buyerTarget ?? DEMO_MISSION_WORKFLOW.defaultBuyerTargetKg;
  const harvestAmountKg = input.harvestAmountKg ?? DEMO_MISSION_WORKFLOW.defaultHarvestAmountKg;
  if (harvestAmountKg < DEMO_MISSION_WORKFLOW.minimumPlanningAmountKg) {
    const blocker = `${harvestAmountKg} ${DEMO_MISSION_WORKFLOW.quantityUnit} is below the minimum ${DEMO_MISSION_WORKFLOW.minimumPlanningAmountKg} ${DEMO_MISSION_WORKFLOW.quantityUnit} planning volume.`;
    return { plans: [], constraintSummary: `${blocker} Add the expected harvest amount before continuing.`, hasValidPlan: false, blockers: [blocker] };
  }

  const configs = DEMO_MISSION_WORKFLOW.planTemplates.map((template) => ({
    ...template,
    ranges: template[revision],
  }));

  const plans: HarvestPlan[] = configs.map((config) => {
    const available = Math.min(harvestAmountKg, config.ranges.saleable[1]);
    const saleable = quantity(Math.min(config.ranges.saleable[0], available), available);
    const grade = quantity(Math.min(config.ranges.marketQuality[0], saleable.max), Math.min(config.ranges.marketQuality[1], saleable.max));
    const reasons: string[] = [];
    const selectable = reasons.length === 0;
    return {
      id: config.id,
      name: config.name,
      summary: config.summary,
      saleableQuantity: saleable,
      grade: { label: DEMO_MISSION_WORKFLOW.marketQualityLabel, quantity: grade },
      fulfilment: { target: buyerTarget, unit: DEMO_MISSION_WORKFLOW.quantityUnit, minPercent: Math.round(grade.min / buyerTarget * 100), maxPercent: Math.min(100, Math.round(grade.max / buyerTarget * 100)) },
      schedule: { type: "daily-window", startTime: config.ranges.start, endTime: config.ranges.end },
      rainExposure: config.rainExposure,
      deadlineRisk: grade.min >= buyerTarget ? "low" : grade.max >= buyerTarget ? "medium" : "high",
      uncertainty: { ...config.uncertainty },
      assumptions: [...config.assumptions],
      advantage: config.advantage,
      tradeOff: config.tradeOff,
      recommended: false,
      feasibility: { selectable, reasons },
      revision,
    };
  });

  const preferredId = DEMO_MISSION_WORKFLOW.preferredPlanId[revision];
  const preferred = plans.find((plan) => plan.id === preferredId && plan.feasibility.selectable)
    ?? plans.find((plan) => plan.feasibility.selectable);
  if (preferred) preferred.recommended = true;
  const selectablePlans = plans.filter((plan) => plan.feasibility.selectable);
  const blockers = [...new Set(plans.flatMap((plan) => plan.feasibility.reasons))];
  return {
    plans,
    constraintSummary: selectablePlans.length
      ? `${harvestAmountKg} ${DEMO_MISSION_WORKFLOW.quantityUnit} of expected harvest is available for planning.`
      : `No strategy is feasible: ${blockers.join(" ")}`,
    hasValidPlan: selectablePlans.length > 0,
    blockers,
  };
}

function event(id: string, title: string, startTime: string, endTime: string, detail: string, conditional = false): CalendarEvent {
  return { id, title, date: HARVEST_DATE, startTime, endTime, timezone: FARM_TIMEZONE, conditional, demoOnly: true, detail };
}

export function createApprovalPreview(missionId: string, revisionId: string, plan: HarvestPlan): ApprovalPreview {
  const prefix = `${missionId}:${revisionId}:${plan.id}`;
  const template = DEMO_MISSION_WORKFLOW.planTemplates.find((item) => item.id === plan.id);
  if (!template) {
    throw new MissionServiceError("VALIDATION_FAILED", "The selected placeholder plan has no approval template.");
  }
  if (plan.schedule.type !== "daily-window") {
    throw new MissionServiceError("VALIDATION_FAILED", "This placeholder approval flow supports daily-window plans only. Long-range plans require milestone approval templates.");
  }
  const approval = DEMO_MISSION_WORKFLOW.approval;
  const common = [
    event(`${prefix}:inspect`, approval.inspect.title, plan.schedule.startTime, approval.inspect.end, approval.inspect.detail),
    event(`${prefix}:harvest`, `${approval.harvestTitlePrefix} — ${plan.name}`, approval.harvestStart, template.approval.harvestEnd, plan.summary),
  ];
  const strategy = event(
    `${prefix}:${template.approval.strategyConditional ? "conditional" : "transfer"}`,
    template.approval.strategyTitle,
    template.approval.strategyStart,
    plan.schedule.endTime,
    template.approval.strategyDetail,
    template.approval.strategyConditional,
  );
  const events = [
    ...common,
    strategy,
    event(`${prefix}:postharvest`, approval.postharvest.title, approval.postharvest.start, template.approval.postharvestEnd, `Prepare ${plan.grade.label} produce for the buyer.`),
    event(`${prefix}:buyer`, approval.buyer.title, approval.buyer.start, approval.buyer.end, `Collection target: ${plan.fulfilment.target} ${plan.fulfilment.unit} ${plan.grade.label}.`),
  ];
  return {
    approvalKey: prefix,
    missionId,
    revisionId,
    planId: plan.id,
    planName: plan.name,
    calendarLabel: approval.calendarLabel,
    date: HARVEST_DATE,
    timezone: FARM_TIMEZONE,
    demoOnly: true,
    events,
    steps: template.approval.steps.map((name, index) => ({ id: `${prefix}:step-${index + 1}`, name: name as MissionStepName, status: "scheduled" })),
  };
}
