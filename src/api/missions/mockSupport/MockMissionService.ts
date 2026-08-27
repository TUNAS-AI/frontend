import {
  createApprovalPreview,
  createPlans,
  isSupportedAdjustment,
  normalizePlanningFacts,
} from "../missionWorkflow.ts";
import { REQUIRED_ADJUSTMENT } from "../missionWorkflow.ts";
import type {
  ClarificationCheckpoint,
  CreatedMission,
  MissionInterpretation,
  MissionService,
} from "../../../features/missions/types.ts";
import { MissionServiceError } from "../../../features/missions/types.ts";
import { DEMO_FACTS, DEMO_MISSION_WORKFLOW } from "./demoMissionData.ts";

let fallbackId = 0;
const SUBMISSION_STORAGE_PREFIX = "tunas:submission:";
const LEGACY_SUBMISSION_STORAGE_PREFIX = "hijau-ai:submission:";

async function wait() {
  await new Promise((resolve) => globalThis.setTimeout(resolve, DEMO_MISSION_WORKFLOW.latencyMs));
}

function uniqueMissionId() {
  if (globalThis.crypto?.randomUUID) return `mission-${globalThis.crypto.randomUUID()}`;
  fallbackId += 1;
  return `mission-demo-${fallbackId}`;
}

export class MockMissionService implements MissionService {
  private readonly submissions = new Map<string, CreatedMission>();

  private restoredSubmission(approvalKey: string) {
    try {
      const current = globalThis.sessionStorage?.getItem(`${SUBMISSION_STORAGE_PREFIX}${approvalKey}`);
      const legacy = current ? null : globalThis.sessionStorage?.getItem(`${LEGACY_SUBMISSION_STORAGE_PREFIX}${approvalKey}`);
      const value = current ?? legacy;
      if (legacy) {
        globalThis.sessionStorage?.setItem(`${SUBMISSION_STORAGE_PREFIX}${approvalKey}`, legacy);
        globalThis.sessionStorage?.removeItem(`${LEGACY_SUBMISSION_STORAGE_PREFIX}${approvalKey}`);
      }
      return value ? JSON.parse(value) as CreatedMission : null;
    } catch {
      return null;
    }
  }

  private persistSubmission(result: CreatedMission) {
    try {
      globalThis.sessionStorage?.setItem(`${SUBMISSION_STORAGE_PREFIX}${result.approvalKey}`, JSON.stringify(result));
    } catch {
      // In-memory idempotency remains available when browser storage is blocked.
    }
  }

  async createDraft() {
    await wait();
    return { missionId: uniqueMissionId() };
  }

  async interpret({ missionId, message, scenario }: Parameters<MissionService["interpret"]>[0]) {
    await wait();
    if (scenario === "interpret-failure") {
      throw new MissionServiceError("PARSE_FAILED", "The demo interpreter intentionally failed. Your original request is still saved.");
    }
    const buyerMatch = message.match(/(\d+(?:[.,]\d+)?)\s*kg/i);
    const interpretation = DEMO_MISSION_WORKFLOW.interpretation;
    const eligible = interpretation.eligibleCrop.test(message)
      && interpretation.eligibleBlock.test(message)
      && interpretation.eligibleMaturity.test(message)
      && interpretation.eligibleBuyer.test(message)
      && interpretation.eligibleMarketQuality.test(message)
      && interpretation.eligibleDeadline.test(message)
      && interpretation.eligibleWeather.test(message)
      && Boolean(buyerMatch);
    if (!eligible) {
      throw new MissionServiceError("UNSUPPORTED_INPUT", interpretation.unsupportedMessage);
    }
    return {
      missionId,
      originalMessage: message,
      facts: DEMO_FACTS.map((fact) => {
        if (fact.key === "buyerQuantity") return { ...fact, value: `${buyerMatch?.[1].replace(",", ".")} kg` };
        return { ...fact };
      }),
      contradictions: [],
      lowConfidenceKeys: ["weatherDependency"],
      missingKeys: ["harvestAmount"],
    } satisfies MissionInterpretation;
  }

  async checkpoint(interpretation: MissionInterpretation) {
    await wait();
    const { interpretation: validated, normalized } = normalizePlanningFacts(interpretation);
    const checkpoint = {
      checkpointId: `${validated.missionId}:${DEMO_MISSION_WORKFLOW.checkpoint.idSuffix}`,
      missionId: validated.missionId,
      question: DEMO_MISSION_WORKFLOW.checkpoint.question,
      reason: DEMO_MISSION_WORKFLOW.checkpoint.reason,
      status: "waiting",
      normalized,
    } satisfies ClarificationCheckpoint;
    return { checkpoint, interpretation: validated };
  }

  async plan({ checkpoint, harvestAmountKg, interpretation }: Parameters<MissionService["plan"]>[0]) {
    await wait();
    if (checkpoint.missionId !== interpretation.missionId || harvestAmountKg < 1) {
      throw new MissionServiceError("CHECKPOINT_INVALID", "The saved checkpoint could not be resumed.");
    }
    return createPlans("initial", {
      buyerTarget: checkpoint.normalized.buyerQuantityKg,
      harvestAmountKg,
    });
  }

  async recalculate({ adjustment, plans, missionId }: Parameters<MissionService["recalculate"]>[0]) {
    await wait();
    if (!isSupportedAdjustment(adjustment)) {
      throw new MissionServiceError("UNSUPPORTED_ADJUSTMENT", `This demo supports only: “${REQUIRED_ADJUSTMENT}”`);
    }
    if (plans.length === 0) {
      throw new MissionServiceError("VALIDATION_FAILED", "There are no feasible plans to recalculate.");
    }
    const source = plans[0];
    return {
      revisionId: `${missionId}:revision-${uniqueMissionId()}`,
      result: createPlans("adjusted", {
        buyerTarget: source.fulfilment.target,
        harvestAmountKg: source.saleableQuantity.max,
      }),
      changes: [...DEMO_MISSION_WORKFLOW.recalculationChanges],
    };
  }

  async preview({ missionId, revisionId, plan }: Parameters<MissionService["preview"]>[0]) {
    await wait();
    if (!plan.feasibility.selectable) {
      throw new MissionServiceError("VALIDATION_FAILED", "An infeasible plan cannot be previewed or approved.");
    }
    return createApprovalPreview(missionId, revisionId, plan);
  }

  async submit({ preview, scenario }: Parameters<MissionService["submit"]>[0]) {
    await wait();
    if (scenario === "submit-failure") {
      throw new MissionServiceError("SUBMIT_FAILED", "The simulated Calendar submission intentionally failed. The approval preview remains saved for retry.");
    }
    const existing = this.submissions.get(preview.approvalKey) ?? this.restoredSubmission(preview.approvalKey);
    if (existing) return { ...existing, duplicate: true };
    const result: CreatedMission = { ...preview, status: "scheduled", duplicate: false };
    this.submissions.set(preview.approvalKey, result);
    this.persistSubmission(result);
    return result;
  }
}
