import type { BuyerCommitment, CropBatch, FarmBlock, FarmObservation, FieldsPageData, LinkedFarmMission } from "@/features/farm/types";

type SourceRecord = Record<string, unknown>;

function record(value: unknown, label: string): SourceRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`Invalid farm fixture: ${label} must be an object.`);
  return value as SourceRecord;
}

function text(source: SourceRecord, key: string, label: string) {
  const value = source[key];
  if (typeof value !== "string" || !value.trim()) throw new Error(`Invalid farm fixture: ${label}.${key} must be a non-empty string.`);
  return value;
}

function list(source: SourceRecord, key: string, label: string) {
  const value = source[key];
  if (!Array.isArray(value)) throw new Error(`Invalid farm fixture: ${label}.${key} must be an array.`);
  return value;
}

function oneOf<T extends string>(value: string, values: readonly T[], label: string): T {
  if (!values.includes(value as T)) throw new Error(`Invalid farm fixture: ${label} has an unsupported value.`);
  return value as T;
}

function parseBlock(value: unknown): FarmBlock {
  const source = record(value, "block");
  return {
    id: text(source, "id", "block"), name: text(source, "name", "block"), location: text(source, "location", "block"), areaLabel: text(source, "areaLabel", "block"),
    conditionLabel: text(source, "conditionLabel", "block"), conditionTone: oneOf(text(source, "conditionTone", "block"), ["success", "warning", "info"] as const, "block.conditionTone"),
    accessNotes: text(source, "accessNotes", "block"), drainageNotes: text(source, "drainageNotes", "block"), notes: text(source, "notes", "block"), sourceLabel: text(source, "sourceLabel", "block"),
  };
}

function parseMission(value: unknown): LinkedFarmMission {
  const source = record(value, "batch.mission");
  const href = text(source, "href", "batch.mission");
  if (!href.startsWith("/missions/")) throw new Error("Invalid farm fixture: linked mission href must point to a mission detail route.");
  return {
    id: text(source, "id", "batch.mission"), title: text(source, "title", "batch.mission"), statusLabel: text(source, "statusLabel", "batch.mission"),
    statusTone: oneOf(text(source, "statusTone", "batch.mission"), ["success", "warning", "info", "ai"] as const, "batch.mission.statusTone"), href,
  };
}

function parseBatch(value: unknown): CropBatch {
  const source = record(value, "batch");
  const mission = source.mission === undefined ? undefined : parseMission(source.mission);
  return {
    id: text(source, "id", "batch"), crop: text(source, "crop", "batch"), batchLabel: text(source, "batchLabel", "batch"), variety: text(source, "variety", "batch"),
    blockId: text(source, "blockId", "batch"), plantedLabel: text(source, "plantedLabel", "batch"), stage: text(source, "stage", "batch"), readinessLabel: text(source, "readinessLabel", "batch"),
    statusLabel: text(source, "statusLabel", "batch"), notes: text(source, "notes", "batch"), sourceLabel: text(source, "sourceLabel", "batch"), mission,
  };
}

function parseObservation(value: unknown): FarmObservation {
  const source = record(value, "observation");
  return { id: text(source, "id", "observation"), blockId: text(source, "blockId", "observation"), title: text(source, "title", "observation"), detail: text(source, "detail", "observation"), observedAt: text(source, "observedAt", "observation"), observedLabel: text(source, "observedLabel", "observation"), sourceLabel: text(source, "sourceLabel", "observation") };
}

function parseCommitment(value: unknown): BuyerCommitment {
  const source = record(value, "commitment");
  const batchId = source.batchId === undefined ? undefined : text(source, "batchId", "commitment");
  return {
    id: text(source, "id", "commitment"), blockId: text(source, "blockId", "commitment"), batchId, buyerName: text(source, "buyerName", "commitment"), crop: text(source, "crop", "commitment"),
    amountLabel: text(source, "amountLabel", "commitment"), marketQuality: text(source, "marketQuality", "commitment"), dueAt: text(source, "dueAt", "commitment"), dueLabel: text(source, "dueLabel", "commitment"),
    statusLabel: text(source, "statusLabel", "commitment"), statusTone: oneOf(text(source, "statusTone", "commitment"), ["warning", "info", "success"] as const, "commitment.statusTone"),
  };
}

export function parseFarmPageData(value: unknown): FieldsPageData {
  const source = record(value, "farm response");
  const farm = record(source.farm, "farm");
  const blocks = list(source, "blocks", "farm response").map(parseBlock);
  const batches = list(source, "batches", "farm response").map(parseBatch);
  const observations = list(source, "observations", "farm response").map(parseObservation);
  const commitments = list(source, "commitments", "farm response").map(parseCommitment);
  const blockIds = new Set(blocks.map((block) => block.id));
  const batchIds = new Set(batches.map((batch) => batch.id));
  if (!batches.every((batch) => blockIds.has(batch.blockId)) || !observations.every((observation) => blockIds.has(observation.blockId)) || !commitments.every((commitment) => blockIds.has(commitment.blockId)) || !commitments.every((commitment) => !commitment.batchId || batchIds.has(commitment.batchId))) {
    throw new Error("Invalid farm fixture: a record references an unknown field block or crop batch.");
  }
  const assistant = record(source.assistant, "assistant");
  return {
    sourceLabel: text(source, "sourceLabel", "farm response"), title: text(source, "title", "farm response"), description: text(source, "description", "farm response"), freshness: text(source, "freshness", "farm response"),
    farm: { name: text(farm, "name", "farm"), location: text(farm, "location", "farm"), timezone: text(farm, "timezone", "farm"), notes: text(farm, "notes", "farm") },
    blocks, batches, observations, commitments,
    assistant: {
      contextLabel: text(assistant, "contextLabel", "assistant"), starterMessage: text(assistant, "starterMessage", "assistant"),
      responses: list(assistant, "responses", "assistant").map((response) => { const item = record(response, "assistant response"); return { id: text(item, "id", "assistant response"), keywords: list(item, "keywords", "assistant response").map((keyword) => { if (typeof keyword !== "string") throw new Error("Invalid farm fixture: assistant keywords must be strings."); return keyword; }), text: text(item, "text", "assistant response") }; }),
      fallbackResponse: text(assistant, "fallbackResponse", "assistant"),
    },
  };
}
