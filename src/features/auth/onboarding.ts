export const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

export type Weekday = (typeof weekdays)[number];

export type WorkWindowDraft = {
  id: string;
  day: Weekday;
  start: string;
  end: string;
};

export type CropBatchDraft = {
  id: string;
  variety: string;
  plantingDate: string;
  notes: string;
};

export type FieldDraft = {
  id: string;
  name: string;
  latitude: string;
  longitude: string;
  areaHectares: string;
  notes: string;
  cropBatches: CropBatchDraft[];
};

export type FarmDraft = {
  name: string;
  location: string;
  notes: string;
  timezone: string;
  defaultWorkerCount: string;
  workWindows: WorkWindowDraft[];
};

export type OnboardingPayload = {
  farm: {
    name: string;
    location?: string;
    notes?: string;
    timezone: string;
    defaultWorkerCount: number;
    defaultWorkingHours: Partial<Record<Weekday, Array<{ start: string; end: string }>>>;
  };
  fields: Array<{
    name: string;
    coordinates: { latitude: number; longitude: number };
    areaHectares?: number;
    notes?: string;
    cropBatches: Array<{ variety?: string; plantingDate?: string; notes?: string }>;
  }>;
};

const id = (prefix: string, index: number) => `${prefix}-${Date.now()}-${index}`;
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function createCropBatchDraft(index: number): CropBatchDraft {
  return { id: id("batch", index), variety: "", plantingDate: "", notes: "" };
}

export function createFieldDraft(index: number): FieldDraft {
  return {
    id: id("field", index),
    name: "",
    latitude: "",
    longitude: "",
    areaHectares: "",
    notes: "",
    cropBatches: [createCropBatchDraft(0)],
  };
}

export function createDemoOnboardingDraft(): { farm: FarmDraft; fields: FieldDraft[] } {
  const plantingDate = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  return {
    farm: {
      name: "Tani Makmur Brebes",
      location: "Brebes, Central Java",
      notes: "Workers: Pak Dedi, Pak Ujang, Bu Sari, and Pak Wawan. Drying method: outdoor drying. Rain protection: tarpaulin available.",
      timezone: "Asia/Jakarta",
      defaultWorkerCount: "4",
      workWindows: weekdays.slice(0, 6).map((day) => ({ id: `window-demo-${day}`, day, start: "06:00", end: "16:00" })),
    },
    fields: [
      {
        id: "field-demo-north-block",
        name: "Blok Utara",
        latitude: "-6.867120",
        longitude: "109.037109",
        areaHectares: "0.8",
        notes: "Farmer-reported readiness: READY. Estimated harvestable quantity: 650 kg.",
        cropBatches: [{ id: "batch-demo-north-block-1", variety: "Bima Brebes", plantingDate: plantingDate(62), notes: "Farmer-reported readiness: READY. Estimated harvestable quantity: 650 kg." }],
      },
    ],
  };
}

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function validateWindows(windows: WorkWindowDraft[]) {
  if (!windows.length) throw new Error("Add at least one work window.");
  const hours: OnboardingPayload["farm"]["defaultWorkingHours"] = {};
  for (const window of windows) {
    if (!timePattern.test(window.start) || !timePattern.test(window.end) || window.end <= window.start) {
      throw new Error("Each work window needs an end time after its start time.");
    }
    (hours[window.day] ??= []).push({ start: window.start, end: window.end });
  }
  for (const [day, ranges] of Object.entries(hours)) {
    const ordered = [...ranges].sort((left, right) => left.start.localeCompare(right.start));
    if (ordered.some((range, index) => index > 0 && range.start < ordered[index - 1].end)) {
      throw new Error(`${day[0].toUpperCase()}${day.slice(1)} work windows cannot overlap.`);
    }
  }
  return hours;
}

export function validateFarmDraft(farm: FarmDraft) {
  const name = farm.name.trim();
  if (!name) throw new Error("Enter a farm name.");
  const defaultWorkerCount = Number(farm.defaultWorkerCount);
  if (!Number.isInteger(defaultWorkerCount) || defaultWorkerCount < 1) throw new Error("People usually available must be a whole number of at least 1.");
  return { name, defaultWorkerCount, defaultWorkingHours: validateWindows(farm.workWindows) };
}

export function validateFieldDrafts(fields: FieldDraft[]) {
  if (!fields.length) throw new Error("Add at least one field.");
  return fields.map((field) => {
    const fieldName = field.name.trim();
    if (!fieldName) throw new Error("Name every field.");
    const latitude = Number(field.latitude);
    const longitude = Number(field.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new Error(`Set a valid map location for ${fieldName}.`);
    }
    const areaHectares = field.areaHectares.trim() ? Number(field.areaHectares) : undefined;
    if (areaHectares !== undefined && (!Number.isFinite(areaHectares) || areaHectares <= 0)) throw new Error(`Area for ${fieldName} must be greater than 0.`);
    if (!field.cropBatches.length) throw new Error(`Add at least one crop batch to ${fieldName}.`);
    return { fieldName, latitude, longitude, areaHectares };
  });
}

export function buildOnboardingPayload({ farm, fields }: { farm: FarmDraft; fields: FieldDraft[] }): OnboardingPayload {
  const validatedFarm = validateFarmDraft(farm);
  const validatedFields = validateFieldDrafts(fields);

  return {
    farm: {
      name: validatedFarm.name,
      ...(optional(farm.location) ? { location: optional(farm.location) } : {}),
      ...(optional(farm.notes) ? { notes: optional(farm.notes) } : {}),
      timezone: farm.timezone.trim() || "Asia/Jakarta",
      defaultWorkerCount: validatedFarm.defaultWorkerCount,
      defaultWorkingHours: validatedFarm.defaultWorkingHours,
    },
    fields: fields.map((field, index) => {
      const { fieldName, latitude, longitude, areaHectares } = validatedFields[index];
      return {
        name: fieldName,
        coordinates: { latitude, longitude },
        ...(areaHectares === undefined ? {} : { areaHectares }),
        ...(optional(field.notes) ? { notes: optional(field.notes) } : {}),
        cropBatches: field.cropBatches.map((batch) => ({
          ...(optional(batch.variety) ? { variety: optional(batch.variety) } : {}),
          ...(optional(batch.plantingDate) ? { plantingDate: optional(batch.plantingDate) } : {}),
          ...(optional(batch.notes) ? { notes: optional(batch.notes) } : {}),
        })),
      };
    }),
  };
}
