import { apiFetch } from "../http.ts";

export type WorkingHours = Partial<Record<"monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday", Array<{ start: string; end: string }>>>;
export type DryingProfile = { method: "FIELD_SUN" | "RACK_SUN" | "COVERED_VENTILATED" | "INSTORE"; capacityKg: number; protectedCapacityKg: number; minDays: number; maxDays: number };
export type SchedulingDurations = { readinessCheckMinutes: number; harvestMinutes: number; transferToDryingMinutes: number; beginDryingMinutes: number; dryingInspectionMinutes: number };

export type Farm = {
  farmId: string;
  name: string;
  location: string | null;
  notes: string | null;
  timezone: string;
  defaultWorkerCount: number;
  rainProtectionAvailable: boolean | null;
  defaultWorkingHours: WorkingHours | null;
  dryingProfile: DryingProfile | null;
  schedulingDurations: SchedulingDurations;
  createdAt: string;
  updatedAt: string;
};

export type FieldBlock = {
  fieldBlockId: string;
  farmId: string;
  name: string;
  areaHectares: number | null;
  coordinates: { latitude: number; longitude: number };
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type CropBatch = {
  cropBatchId: string;
  farmId: string;
  fieldBlockId: string;
  crop: "shallot" | string;
  variety: string | null;
  plantingDate: string | null;
  notes: string | null;
  status: string;
  readinessStatus: "READY" | "NOT_READY" | null;
  createdAt: string;
  updatedAt: string;
};

export type FarmSnapshot = { farm: Farm; fieldBlocks: FieldBlock[]; cropBatches: CropBatch[] };
export type FarmUpdate = Pick<Farm, "name" | "location" | "notes" | "timezone" | "defaultWorkerCount" | "rainProtectionAvailable" | "defaultWorkingHours" | "dryingProfile" | "schedulingDurations">;
export type FieldBlockInput = { name: string; coordinates: FieldBlock["coordinates"]; areaHectares?: number | null; notes?: string | null; status?: string };
export type CropBatchInput = { fieldBlockId?: string; variety?: string | null; plantingDate?: string | null; notes?: string | null; status?: string; readinessStatus?: "READY" | "NOT_READY" };

type ApiErrorBody = { error?: string };

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await apiFetch(path, options);
  if (response.ok) return response.status === 204 ? undefined as T : response.json() as Promise<T>;
  const body = await response.json().catch((): ApiErrorBody => ({}));
  throw new Error(body.error || "We could not complete that farm update. Try again.");
}

function json(body: unknown): RequestInit { return { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }; }

export async function getFarmSnapshot(): Promise<FarmSnapshot> {
  return request<FarmSnapshot>("/api/farm/snapshot");
}

export function updateFarm(input: FarmUpdate) { return request<Farm>("/api/farm", { method: "PATCH", ...json(input) }); }
export function createFieldBlock(input: FieldBlockInput) { return request<FieldBlock>("/api/field-blocks", { method: "POST", ...json(input) }); }
export function updateFieldBlock(id: string, input: FieldBlockInput) { return request<FieldBlock>(`/api/field-blocks/${id}`, { method: "PATCH", ...json(input) }); }
export function deleteFieldBlock(id: string) { return request<void>(`/api/field-blocks/${id}`, { method: "DELETE" }); }
export function createCropBatch(input: CropBatchInput) { return request<CropBatch>("/api/crop-batches", { method: "POST", ...json(input) }); }
export function updateCropBatch(id: string, input: CropBatchInput) { return request<CropBatch>(`/api/crop-batches/${id}`, { method: "PATCH", ...json(input) }); }
export function deleteCropBatch(id: string) { return request<void>(`/api/crop-batches/${id}`, { method: "DELETE" }); }
