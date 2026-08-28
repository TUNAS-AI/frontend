import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, CalendarClock, MapPinned, Plus, Sprout, Trash2 } from "lucide-react";
import { submitOnboarding } from "@/api/onboarding";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Select } from "@/components/ui/FieldControl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldLocationPicker } from "./FieldLocationPicker";
import {
  buildOnboardingPayload,
  createCropBatchDraft,
  createDemoOnboardingDraft,
  createFieldDraft,
  weekdays,
  type FarmDraft,
  type FieldDraft,
  type Weekday,
  validateFarmDraft,
  validateFieldDrafts,
} from "./onboarding";
import type { AuthSession, OnboardingPageCopy } from "./types";

type OnboardingStep = "farm" | "fields-and-crops" | "calendar";

type OnboardingViewProps = {
  copy: OnboardingPageCopy;
  session: AuthSession;
  onComplete: () => boolean;
};

const steps: ReadonlyArray<{ id: OnboardingStep; label: string }> = [
  { id: "farm", label: "Farm" },
  { id: "fields-and-crops", label: "Fields & crops" },
  { id: "calendar", label: "Google Calendar" },
];

const initialFarm: FarmDraft = {
  name: "",
  location: "",
  notes: "",
  timezone: "Asia/Jakarta",
  defaultWorkerCount: "1",
  workWindows: [{ id: "window-initial", day: "monday", start: "06:00", end: "12:00" }],
};

export function OnboardingView({ copy, session, onComplete }: OnboardingViewProps) {
  const [step, setStep] = useState<OnboardingStep>("farm");
  const [farm, setFarm] = useState<FarmDraft>(initialFarm);
  const [fields, setFields] = useState<FieldDraft[]>([createFieldDraft(0)]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const stepIndex = steps.findIndex((item) => item.id === step);

  function updateFarm<Key extends keyof FarmDraft>(key: Key, value: FarmDraft[Key]) {
    setFarm((current) => ({ ...current, [key]: value }));
  }

  function updateField(fieldId: string, update: Partial<FieldDraft>) {
    setFields((current) => current.map((field) => field.id === fieldId ? { ...field, ...update } : field));
  }

  function addWorkWindow() {
    updateFarm("workWindows", [...farm.workWindows, { id: `window-${Date.now()}`, day: "monday", start: "", end: "" }]);
  }

  function fillDemoData() {
    const draft = createDemoOnboardingDraft();
    setFarm(draft.farm);
    setFields(draft.fields);
    setError(null);
  }

  async function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      if (step === "farm") {
        validateFarmDraft(farm);
        setStep("fields-and-crops");
        return;
      }
      if (step === "fields-and-crops") {
        validateFieldDrafts(fields);
        setStep("calendar");
        return;
      }
      setBusy(true);
      try {
        await submitOnboarding(buildOnboardingPayload({ farm, fields }));
        if (!onComplete()) throw new Error("Your setup was saved, but this browser could not update your session. Sign in again to continue.");
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "We could not save your farm setup. Try again.");
      } finally {
        setBusy(false);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Check the information in this step and try again.");
    }
  }

  function back() {
    setError(null);
    if (step === "calendar") setStep("fields-and-crops");
    if (step === "fields-and-crops") setStep("farm");
  }

  return (
    <main className="motion-enter min-h-dvh bg-background px-4 py-6 text-foreground sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-3xl flex-col">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-forest-700 text-white shadow-lift"><Sprout className="h-5 w-5" aria-hidden="true" /></span>
            <div>
              <p className="font-extrabold tracking-[0.08em] text-forest-700">TUNAS</p>
              <p className="mt-0.5 text-sm text-muted-foreground">Farm setup</p>
            </div>
          </div>
          <p className="max-w-44 truncate pt-1 text-right text-xs font-medium text-muted-foreground">{session.account.email}</p>
        </header>

        <nav aria-label="Setup progress" className="mb-5">
          <ol className="grid grid-cols-3 gap-2">
            {steps.map((item, index) => {
              const current = index === stepIndex;
              const complete = index < stepIndex;
              return <li key={item.id} className={`border-b-2 pb-2 text-sm font-semibold ${current ? "border-forest-700 text-forest-700" : complete ? "border-leaf-500 text-leaf-700" : "border-border text-muted-foreground"}`}><span className="mr-1.5 text-xs tabular-nums">{index + 1}</span>{item.label}</li>;
            })}
          </ol>
        </nav>

        <section className="rounded-xl border bg-card px-5 py-6 shadow-farm sm:px-7" aria-labelledby="onboarding-heading">
          <div className="border-b pb-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-forest-700">Step {stepIndex + 1} of {steps.length}</p>
            <h1 id="onboarding-heading" className="mt-2 text-2xl font-extrabold tracking-tight">{step === "farm" ? copy.farmStepTitle : step === "fields-and-crops" ? copy.fieldsAndCropsStepTitle : copy.calendarStepTitle}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{step === "farm" ? copy.description : step === "fields-and-crops" ? "Each crop batch belongs to a field block. Add the field and its shallot batches together." : "Calendar connection is optional and is not available yet."}</p>
          </div>

          <form className="mt-5" onSubmit={next}>
            <div className="grid gap-5">
              {step === "farm" ? <FarmStep farm={farm} onFarmChange={updateFarm} onAddWindow={addWorkWindow} /> : null}
              {step === "fields-and-crops" ? <FieldsAndCropsStep fields={fields} onFieldsChange={setFields} onFieldChange={updateField} /> : null}
              {step === "calendar" ? <CalendarStep copy={copy} /> : null}
              {error ? <ErrorLine message={error} /> : null}
            </div>

            <footer className="mt-6 flex items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" icon={<ArrowLeft aria-hidden="true" />} disabled={stepIndex === 0 || busy} onClick={back}>Back</Button>
                <Button type="button" variant="outline" disabled={busy} onClick={fillDemoData}>Fill demo data</Button>
              </div>
              <Button type="submit" trailingIcon={step === "calendar" ? undefined : <ArrowRight aria-hidden="true" />} isLoading={busy} loadingLabel="Saving farm setup">{step === "calendar" ? copy.finishLabel : "Next"}</Button>
            </footer>
          </form>
        </section>
      </div>
    </main>
  );
}

function FarmStep({ farm, onFarmChange, onAddWindow }: { farm: FarmDraft; onFarmChange: <Key extends keyof FarmDraft>(key: Key, value: FarmDraft[Key]) => void; onAddWindow: () => void }) {
  return <>
    <div className="grid gap-4 sm:grid-cols-2">
      <FieldGroup label="Farm name" required reserveHelperSpace><Input value={farm.name} onChange={(event) => onFarmChange("name", event.target.value)} placeholder="Kebun Sari Tani" /></FieldGroup>
      <FieldGroup label="People usually available" required helper="A planning capacity, not a worker roster." reserveHelperSpace><Input type="number" min="1" step="1" inputMode="numeric" value={farm.defaultWorkerCount} onChange={(event) => onFarmChange("defaultWorkerCount", event.target.value)} /></FieldGroup>
      <FieldGroup label="Farm location" helper="Optional place name for your records." reserveHelperSpace><Input value={farm.location} onChange={(event) => onFarmChange("location", event.target.value)} placeholder="Bogor, West Java" /></FieldGroup>
      <FieldGroup label="Timezone" reserveHelperSpace><Input value={farm.timezone} onChange={(event) => onFarmChange("timezone", event.target.value)} placeholder="Asia/Jakarta" /></FieldGroup>
    </div>
    <FieldGroup label="Farm notes" helper="Optional context that helps later planning."><Textarea className="min-h-24" value={farm.notes} onChange={(event) => onFarmChange("notes", event.target.value)} placeholder="Covered drying space is beside the packing shed." /></FieldGroup>
    <section aria-labelledby="work-windows-heading" className="grid gap-4 rounded-lg border bg-field-50/60 p-4">
      <div><h2 id="work-windows-heading" className="font-bold text-forest-700">Work windows</h2><p className="mt-1 text-sm text-muted-foreground">Add every time your farm is normally available for work.</p></div>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2.75rem] gap-2 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground sm:gap-3" aria-hidden="true"><span>Day</span><span>Start</span><span>End</span><span /></div>
      {farm.workWindows.map((window, index) => <div key={window.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2.75rem] items-end gap-2 sm:gap-3">
        <label className="sr-only" htmlFor={`work-window-day-${window.id}`}>Day for work window {index + 1}</label><Select id={`work-window-day-${window.id}`} value={window.day} onChange={(event) => onFarmChange("workWindows", farm.workWindows.map((item) => item.id === window.id ? { ...item, day: event.target.value as Weekday } : item))}>{weekdays.map((day) => <option key={day} value={day}>{day[0].toUpperCase()}{day.slice(1)}</option>)}</Select>
        <label className="sr-only" htmlFor={`work-window-start-${window.id}`}>Start time for work window {index + 1}</label><Input id={`work-window-start-${window.id}`} type="time" value={window.start} onChange={(event) => onFarmChange("workWindows", farm.workWindows.map((item) => item.id === window.id ? { ...item, start: event.target.value } : item))} />
        <label className="sr-only" htmlFor={`work-window-end-${window.id}`}>End time for work window {index + 1}</label><Input id={`work-window-end-${window.id}`} type="time" value={window.end} onChange={(event) => onFarmChange("workWindows", farm.workWindows.map((item) => item.id === window.id ? { ...item, end: event.target.value } : item))} />
        <Button type="button" size="icon" variant="ghost" aria-label={`Remove work window ${index + 1}`} disabled={farm.workWindows.length === 1} onClick={() => onFarmChange("workWindows", farm.workWindows.filter((item) => item.id !== window.id))}><Trash2 aria-hidden="true" /></Button>
      </div>)}
      <Button type="button" variant="outline" className="w-fit" icon={<Plus aria-hidden="true" />} onClick={onAddWindow}>Add window</Button>
    </section>
  </>;
}

function FieldsAndCropsStep({ fields, onFieldsChange, onFieldChange }: { fields: FieldDraft[]; onFieldsChange: (fields: FieldDraft[]) => void; onFieldChange: (fieldId: string, update: Partial<FieldDraft>) => void }) {
  return <>
    {fields.map((field, fieldIndex) => <section key={field.id} className="grid gap-5 rounded-lg border border-forest-200 bg-field-50/40 p-4 sm:p-5" aria-labelledby={`field-heading-${field.id}`}>
      <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-forest-700">Field {fieldIndex + 1}</p><h2 id={`field-heading-${field.id}`} className="mt-1 text-lg font-extrabold">Field and crop records</h2></div><Button type="button" variant="ghost" size="sm" icon={<Trash2 aria-hidden="true" />} disabled={fields.length === 1} onClick={() => onFieldsChange(fields.filter((item) => item.id !== field.id))}>Remove field</Button></div>
      <div className="grid gap-4 sm:grid-cols-2"><FieldGroup label="Field name" required><Input value={field.name} onChange={(event) => onFieldChange(field.id, { name: event.target.value })} placeholder="North Block" /></FieldGroup><FieldGroup label="Area (hectares)"><Input type="number" min="0" step="0.01" inputMode="decimal" value={field.areaHectares} onChange={(event) => onFieldChange(field.id, { areaHectares: event.target.value })} placeholder="0.8" /></FieldGroup></div>
      <FieldLocationPicker latitude={field.latitude} longitude={field.longitude} onChange={(latitude, longitude) => onFieldChange(field.id, { latitude: String(latitude), longitude: String(longitude) })} />
      <div className="grid gap-4 sm:grid-cols-2"><FieldGroup label="Latitude" required><Input type="number" step="any" inputMode="decimal" value={field.latitude} onChange={(event) => onFieldChange(field.id, { latitude: event.target.value })} placeholder="-6.914744" /></FieldGroup><FieldGroup label="Longitude" required><Input type="number" step="any" inputMode="decimal" value={field.longitude} onChange={(event) => onFieldChange(field.id, { longitude: event.target.value })} placeholder="107.609810" /></FieldGroup></div>
      <FieldGroup label="Field notes"><Textarea className="min-h-20" value={field.notes} onChange={(event) => onFieldChange(field.id, { notes: event.target.value })} placeholder="Truck access is narrow after rain." /></FieldGroup>
      <section className="grid gap-4 rounded-lg border border-leaf-300 bg-card p-4" aria-labelledby={`crop-batches-heading-${field.id}`}><div><h3 id={`crop-batches-heading-${field.id}`} className="text-sm font-bold text-forest-700">Shallot crop batches</h3><p className="mt-1 text-xs text-muted-foreground">These batches belong to {field.name.trim() || `Field ${fieldIndex + 1}`}.</p></div><div className="grid gap-4">{field.cropBatches.map((batch, batchIndex) => <div key={batch.id} className="grid gap-3 rounded-md border bg-background p-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold">Batch {batchIndex + 1}</p><Button type="button" size="sm" variant="ghost" icon={<Trash2 aria-hidden="true" />} disabled={field.cropBatches.length === 1} onClick={() => onFieldChange(field.id, { cropBatches: field.cropBatches.filter((item) => item.id !== batch.id) })}>Remove</Button></div><div className="grid gap-3 sm:grid-cols-2"><FieldGroup label="Variety"><Input value={batch.variety} onChange={(event) => onFieldChange(field.id, { cropBatches: field.cropBatches.map((item) => item.id === batch.id ? { ...item, variety: event.target.value } : item) })} placeholder="Bima Brebes" /></FieldGroup><FieldGroup label="Planting date"><Input type="date" value={batch.plantingDate} onChange={(event) => onFieldChange(field.id, { cropBatches: field.cropBatches.map((item) => item.id === batch.id ? { ...item, plantingDate: event.target.value } : item) })} /></FieldGroup></div><FieldGroup label="Batch notes"><Textarea className="min-h-20" value={batch.notes} onChange={(event) => onFieldChange(field.id, { cropBatches: field.cropBatches.map((item) => item.id === batch.id ? { ...item, notes: event.target.value } : item) })} placeholder="Farmer-reported context for future missions." /></FieldGroup></div>)}</div><Button type="button" variant="outline" size="sm" className="w-fit" icon={<Plus aria-hidden="true" />} onClick={() => onFieldChange(field.id, { cropBatches: [...field.cropBatches, createCropBatchDraft(field.cropBatches.length)] })}>Add crop batch</Button></section>
    </section>)}
    <Button type="button" variant="outline" className="w-fit" icon={<Plus aria-hidden="true" />} onClick={() => onFieldsChange([...fields, createFieldDraft(fields.length)])}>Add field</Button>
  </>;
}

function CalendarStep({ copy }: { copy: OnboardingPageCopy }) {
  return <div className="grid gap-3 rounded-lg border border-dashed bg-field-50/60 p-4 text-center"><span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-card text-forest-700"><CalendarClock aria-hidden="true" /></span><div><h2 className="font-extrabold">{copy.calendarHeldLabel}</h2><p className="mt-1.5 text-sm leading-6 text-muted-foreground">{copy.calendarHeldBody}</p></div><Button type="button" variant="outline" className="mx-auto" disabled icon={<MapPinned aria-hidden="true" />}>Connect Google Calendar · coming soon</Button></div>;
}

function ErrorLine({ message }: { message: string }) {
  return <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive" role="alert">{message}</p>;
}
