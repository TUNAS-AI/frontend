import type { MissionDraftSnapshot } from "./types";

export interface DraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const STORAGE_KEY = "tunas:mission-draft:v2";
const LEGACY_STORAGE_KEY = "hijau-ai:mission-draft:v2";
const LEGACY_V1_STORAGE_KEY = "hijau-ai:mission-draft:v1";

function browserStorage(): DraftStorage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function restoreMissionDraft(storage: DraftStorage | null = browserStorage()) {
  if (!storage) return null;
  try {
    const currentValue = storage.getItem(STORAGE_KEY);
    const legacyValue = storage.getItem(LEGACY_STORAGE_KEY);
    const sourceKey = currentValue
      ? STORAGE_KEY
      : legacyValue
        ? LEGACY_STORAGE_KEY
        : LEGACY_V1_STORAGE_KEY;
    const value = currentValue ?? legacyValue ?? storage.getItem(LEGACY_V1_STORAGE_KEY);
    if (!value) return null;
    const parsed: unknown = sourceKey === LEGACY_V1_STORAGE_KEY ? migrateLegacySnapshot(JSON.parse(value)) : JSON.parse(value);
    if (!isMissionDraftSnapshot(parsed)) {
      storage.removeItem(sourceKey);
      return null;
    }
    if (sourceKey !== STORAGE_KEY) {
      storage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      storage.removeItem(sourceKey);
    }
    return parsed;
  } catch {
    try {
      storage.removeItem(STORAGE_KEY);
      storage.removeItem(LEGACY_STORAGE_KEY);
      storage.removeItem(LEGACY_V1_STORAGE_KEY);
    } catch { /* Storage may be unavailable. */ }
    return null;
  }
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function string(value: unknown): value is string {
  return typeof value === "string";
}

function migrateLegacyPlan(value: unknown) {
  if (!object(value) || !object(value.timing) || !string(value.timing.start) || !string(value.timing.end)) return value;
  const { timing, ...plan } = value;
  return { ...plan, schedule: { type: "daily-window", startTime: timing.start, endTime: timing.end } };
}

function migrateLegacySnapshot(value: unknown): unknown {
  if (!object(value) || value.version !== 1 || !Array.isArray(value.plans) || !Array.isArray(value.initialPlans)) return value;
  return {
    ...value,
    version: 2,
    plans: value.plans.map(migrateLegacyPlan),
    initialPlans: value.initialPlans.map(migrateLegacyPlan),
  };
}

const stages = new Set(["input", "review", "checkpoint", "plans", "approval", "success"]);
const factKeys = new Set(["fieldBlock", "cropBatch", "maturity", "buyerQuantity", "grade", "deadline", "weatherDependency", "objective", "constraints", "harvestAmount"]);
const provenances = new Set(["confirmed", "farmer-reported", "estimate", "inferred", "missing", "contradiction"]);
const confidences = new Set(["high", "medium", "low", "unknown"]);
const risks = new Set(["low", "medium", "high", "unknown"]);

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function validQuantity(value: unknown) {
  return object(value) && finite(value.min) && finite(value.max) && value.min >= 0 && value.max >= value.min && string(value.unit);
}

function validDate(value: unknown): value is string {
  return string(value) && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`));
}

function validTime(value: unknown): value is string {
  return string(value) && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function validTimeWindow(value: unknown) {
  return object(value) && validTime(value.startTime) && validTime(value.endTime) && value.startTime < value.endTime;
}

function validSchedule(value: unknown) {
  if (!object(value)) return false;
  if (value.type === "daily-window") return validTimeWindow(value);
  if (value.type !== "date-range" || !validDate(value.startDate) || !validDate(value.endDate)
    || value.startDate > value.endDate || !string(value.durationLabel) || !value.durationLabel.trim()) return false;

  const phaseValid = value.currentPhase === undefined || (object(value.currentPhase)
    && string(value.currentPhase.label) && value.currentPhase.label.trim()
    && (value.currentPhase.progressLabel === undefined || string(value.currentPhase.progressLabel)));
  const activityValid = value.nextActivity === undefined || (object(value.nextActivity)
    && string(value.nextActivity.label) && value.nextActivity.label.trim() && validDate(value.nextActivity.date)
    && value.nextActivity.date >= value.startDate && value.nextActivity.date <= value.endDate
    && (value.nextActivity.timeWindow === undefined || validTimeWindow(value.nextActivity.timeWindow)));
  return Boolean(phaseValid && activityValid);
}

function validInterpretation(value: unknown, missionId: string) {
  if (!object(value) || value.missionId !== missionId || !string(value.originalMessage) || !Array.isArray(value.facts)) return false;
  return value.facts.every((fact) => object(fact)
    && factKeys.has(fact.key as string) && string(fact.label) && string(fact.value)
    && provenances.has(fact.provenance as string) && confidences.has(fact.confidence as string)
    && typeof fact.editable === "boolean" && typeof fact.required === "boolean")
    && Array.isArray(value.contradictions) && value.contradictions.every(string)
    && Array.isArray(value.lowConfidenceKeys) && value.lowConfidenceKeys.every(string)
    && Array.isArray(value.missingKeys) && value.missingKeys.every(string);
}

function validCheckpoint(value: unknown, missionId: string) {
  return object(value) && value.missionId === missionId && string(value.checkpointId)
    && string(value.question) && string(value.reason) && value.status === "waiting"
    && object(value.normalized) && typeof value.normalized.buyerQuantityKg === "number"
    && Number.isFinite(value.normalized.buyerQuantityKg) && value.normalized.buyerQuantityKg > 0
    ;
}

function validPlan(value: unknown) {
  return object(value) && string(value.id) && string(value.name)
    && (value.revision === "initial" || value.revision === "adjusted")
    && string(value.summary) && validQuantity(value.saleableQuantity)
    && object(value.grade) && string(value.grade.label) && validQuantity(value.grade.quantity)
    && object(value.fulfilment) && finite(value.fulfilment.target) && value.fulfilment.target > 0
    && string(value.fulfilment.unit) && finite(value.fulfilment.minPercent) && finite(value.fulfilment.maxPercent)
    && validSchedule(value.schedule)
    && risks.has(value.rainExposure as string) && risks.has(value.deadlineRisk as string)
    && object(value.uncertainty) && finite(value.uncertainty.marginKg) && confidences.has(value.uncertainty.confidence as string) && string(value.uncertainty.reason)
    && object(value.feasibility) && typeof value.feasibility.selectable === "boolean"
    && Array.isArray(value.feasibility.reasons) && value.feasibility.reasons.every(string)
    && Array.isArray(value.assumptions) && value.assumptions.every(string)
    && string(value.advantage) && string(value.tradeOff) && typeof value.recommended === "boolean";
}

function validPreview(value: unknown, missionId: string) {
  return object(value) && value.missionId === missionId && string(value.planId)
    && string(value.approvalKey) && string(value.revisionId) && string(value.planName)
    && string(value.calendarLabel) && string(value.date)
    && string(value.timezone) && typeof value.demoOnly === "boolean"
    && Array.isArray(value.events) && value.events.every((event) => object(event)
      && string(event.id) && string(event.title) && string(event.date) && string(event.startTime)
      && string(event.endTime) && string(event.timezone) && typeof event.conditional === "boolean" && typeof event.demoOnly === "boolean" && string(event.detail))
    && Array.isArray(value.steps) && value.steps.every((step) => object(step) && string(step.id) && string(step.name) && step.status === "scheduled");
}

export function isMissionDraftSnapshot(value: unknown): value is MissionDraftSnapshot {
  if (!object(value) || value.version !== 2 || !string(value.missionId) || !value.missionId
    || !string(value.message) || !string(value.stage) || !stages.has(value.stage)
    || !string(value.harvestAmount) || !Array.isArray(value.plans) || !value.plans.every(validPlan)
    || !Array.isArray(value.initialPlans) || !value.initialPlans.every(validPlan)
    || !string(value.adjustment) || !string(value.appliedAdjustment) || typeof value.adjusted !== "boolean"
    || !(value.revisionId === null || string(value.revisionId))
    || !(value.selectedPlanId === null || string(value.selectedPlanId))) return false;

  const interpretationValid = value.interpretation === null || validInterpretation(value.interpretation, value.missionId);
  const checkpointValid = value.checkpoint === null || validCheckpoint(value.checkpoint, value.missionId);
  const previewValid = value.preview === null || validPreview(value.preview, value.missionId);
  const createdValid = value.createdMission === null || (validPreview(value.createdMission, value.missionId)
    && object(value.createdMission) && value.createdMission.status === "scheduled" && typeof value.createdMission.duplicate === "boolean");
  if (!interpretationValid || !checkpointValid || !previewValid || !createdValid) return false;
  if (value.selectedPlanId && !value.plans.some((plan) => object(plan) && plan.id === value.selectedPlanId)) return false;
  if (value.adjusted && (!value.revisionId || !value.appliedAdjustment)) return false;
  if (value.stage === "review" && value.interpretation === null) return false;
  if (["checkpoint", "plans", "approval", "success"].includes(value.stage) && (value.interpretation === null || value.checkpoint === null)) return false;
  if (["plans", "approval", "success"].includes(value.stage) && value.plans.length === 0) return false;
  if (value.stage === "approval" && (value.preview === null || value.selectedPlanId === null || value.revisionId === null)) return false;
  if (value.preview && object(value.preview) && (value.preview.planId !== value.selectedPlanId || value.preview.revisionId !== value.revisionId)) return false;
  if (value.stage === "success" && value.createdMission === null) return false;
  if (value.createdMission !== null && value.stage !== "success") return false;
  if (value.preview !== null && !["approval", "success"].includes(value.stage)) return false;
  return true;
}

export function persistMissionDraft(snapshot: MissionDraftSnapshot, storage: DraftStorage | null = browserStorage()) {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}

export function clearMissionDraft(storage: DraftStorage | null = browserStorage()) {
  if (!storage) return false;
  try {
    storage.removeItem(STORAGE_KEY);
    storage.removeItem(LEGACY_STORAGE_KEY);
    storage.removeItem(LEGACY_V1_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
