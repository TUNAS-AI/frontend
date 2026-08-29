import type { FieldBlockInput } from "@/api/farm";

type FieldBlockFormValues = { name: string; latitude: string; longitude: string; areaHectares: string; notes: string; status: string };
type FieldBlockFormField = "name" | "latitude" | "longitude" | "areaHectares";
type FieldBlockFormErrors = Partial<Record<FieldBlockFormField, string>>;

function decimal(value: string, label: string, minimum: number, maximum: number, errors: FieldBlockFormErrors, field: FieldBlockFormField) {
  const parsed = Number(value);
  if (!value.trim() || !Number.isFinite(parsed) || parsed < minimum || parsed > maximum) {
    errors[field] = `${label} must be between ${minimum} and ${maximum}.`;
    return null;
  }
  return parsed;
}

export function validateFieldBlockForm(values: FieldBlockFormValues) {
  const errors: FieldBlockFormErrors = {};
  const name = values.name.trim();
  if (!name) errors.name = "Field block name is required.";
  const latitude = decimal(values.latitude, "Latitude", -90, 90, errors, "latitude");
  const longitude = decimal(values.longitude, "Longitude", -180, 180, errors, "longitude");
  const areaText = values.areaHectares.trim();
  const areaHectares = areaText ? Number(areaText) : null;
  if (areaHectares !== null && (!Number.isFinite(areaHectares) || areaHectares <= 0)) errors.areaHectares = "Area must be greater than zero.";
  const firstInvalid = (Object.keys(errors)[0] ?? null) as FieldBlockFormField | null;
  if (firstInvalid || latitude === null || longitude === null || areaHectares === null && areaText) return { input: null, errors, firstInvalid };
  const notes = values.notes.trim() || null;
  const status = values.status.trim();
  return {
    input: { name, coordinates: { latitude, longitude }, areaHectares, notes, ...(status ? { status } : {}) } satisfies FieldBlockInput,
    errors,
    firstInvalid: null,
  };
}
