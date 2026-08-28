import { type FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, MapPinned, Pencil, Plus, Sprout, Trash2, UsersRound } from "lucide-react";
import {
  type CropBatch,
  type CropBatchInput,
  type FarmSnapshot,
  type FarmUpdate,
  type FieldBlock,
  type FieldBlockInput,
  type WorkingHours,
  createCropBatch,
  createFieldBlock,
  deleteCropBatch,
  deleteFieldBlock,
  updateCropBatch,
  updateFarm,
  updateFieldBlock,
} from "@/api/farm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/FieldControl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FarmViewProps = { data: FarmSnapshot; onRefresh: () => Promise<void> };
type DialogState = "farm" | "new-field" | "edit-field" | "new-batch" | "edit-batch" | null;
type DeleteTarget = { kind: "field"; record: FieldBlock } | { kind: "batch"; record: CropBatch } | null;
type WorkWindow = { id: string; day: keyof WorkingHours; start: string; end: string };

const weekdays: Array<keyof WorkingHours> = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const dateFormat = new Intl.DateTimeFormat("en-ID", { day: "numeric", month: "short", year: "numeric" });

function optional(value: FormDataEntryValue | null) { const text = String(value ?? "").trim(); return text || null; }
function numeric(value: FormDataEntryValue | null) { return Number(value); }
function formatArea(area: number | null) { return area === null ? "Area not recorded" : `${area.toLocaleString("en-ID", { maximumFractionDigits: 2 })} ha`; }
function formatDate(value: string | null) { return value ? dateFormat.format(new Date(`${value}T00:00:00`)) : "Planting date not recorded"; }
function statusVariant(status: string) { return status.toLowerCase() === "active" ? "success" as const : "neutral" as const; }
function titleStatus(status: string) { return status ? `${status[0].toUpperCase()}${status.slice(1)}` : "Not recorded"; }

export function FarmView({ data, onRefresh }: FarmViewProps) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const [fieldId, setFieldId] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const field = useMemo(() => data.fieldBlocks.find((item) => item.fieldBlockId === fieldId) ?? null, [data.fieldBlocks, fieldId]);
  const batch = useMemo(() => data.cropBatches.find((item) => item.cropBatchId === batchId) ?? null, [data.cropBatches, batchId]);

  useEffect(() => { document.title = "Farm | TUNAS"; }, []);

  async function run(action: string, work: () => Promise<unknown>, success: string) {
    setBusyAction(action); setError(null);
    try { await work(); await onRefresh(); setNotice(success); return true; }
    catch (reason) { setError(reason instanceof Error ? reason.message : "We could not save that change. Try again."); return false; }
    finally { setBusyAction(null); }
  }

  function openFieldDialog(next: "new-field" | "edit-field", nextField?: FieldBlock) { setFieldId(nextField?.fieldBlockId ?? null); setDialog(next); }
  function openBatchDialog(next: "new-batch" | "edit-batch", nextField: FieldBlock, nextBatch?: CropBatch) { setFieldId(nextField.fieldBlockId); setBatchId(nextBatch?.cropBatchId ?? null); setDialog(next); }
  const batchesFor = (blockId: string) => data.cropBatches.filter((item) => item.fieldBlockId === blockId);

  return <div className="grid gap-6">
    <header className="overflow-hidden rounded-lg border bg-card shadow-farm">
      <div className="bg-primary px-5 py-6 text-primary-foreground sm:px-7 sm:py-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div className="grid max-w-2xl gap-2"><p className="text-xs font-bold uppercase tracking-[0.14em] text-white/75">Your farm</p><h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{data.farm.name}</h1><p className="text-base leading-7 text-white/85">Manage the farm, its field blocks, and the shallot batches growing in each one.</p></div>
          <Button type="button" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white" icon={<Pencil aria-hidden="true" />} onClick={() => setDialog("farm")}>Edit farm</Button>
        </div>
      </div>
      <dl className="grid gap-4 px-5 py-5 text-sm sm:grid-cols-2 sm:px-7 lg:grid-cols-4">
        <Fact label="Location" value={data.farm.location || "Not recorded"} icon={<MapPinned aria-hidden="true" />} />
        <Fact label="Timezone" value={data.farm.timezone} icon={<CalendarDays aria-hidden="true" />} />
        <Fact label="Planning capacity" value={`${data.farm.defaultWorkerCount} people`} icon={<UsersRound aria-hidden="true" />} />
        <Fact label="Availability" value={availabilityLabel(data.farm.defaultWorkingHours)} icon={<CalendarDays aria-hidden="true" />} />
      </dl>
      {data.farm.notes ? <p className="border-t px-5 py-4 text-sm leading-6 text-muted-foreground sm:px-7">{data.farm.notes}</p> : null}
    </header>

    {notice ? <Alert variant="success" aria-live="polite"><Sprout aria-hidden="true" /><AlertTitle>Saved</AlertTitle><AlertDescription>{notice}</AlertDescription></Alert> : null}
    {error ? <Alert variant="danger" role="alert"><AlertTitle>Could not save changes</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}

    <section className="grid gap-4" aria-labelledby="field-blocks-heading">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Farm structure</p><h2 id="field-blocks-heading" className="mt-1 text-2xl font-extrabold tracking-tight">Field blocks</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Each field contains its own shallot crop batches.</p></div><Button type="button" icon={<Plus aria-hidden="true" />} onClick={() => openFieldDialog("new-field")}>Add field block</Button></div>
      {data.fieldBlocks.length ? <div className="grid gap-3">{data.fieldBlocks.map((block) => <FieldBlockCard key={block.fieldBlockId} block={block} batches={batchesFor(block.fieldBlockId)} busyAction={busyAction} onEdit={() => openFieldDialog("edit-field", block)} onDelete={() => setDeleteTarget({ kind: "field", record: block })} onAddBatch={() => openBatchDialog("new-batch", block)} onEditBatch={(item) => openBatchDialog("edit-batch", block, item)} onDeleteBatch={(item) => setDeleteTarget({ kind: "batch", record: item })} />)}</div> : <EmptyFields onAdd={() => openFieldDialog("new-field")} />}
    </section>

    <FarmEditDialog open={dialog === "farm"} farm={data.farm} busy={busyAction === "farm"} onOpenChange={(open) => { if (!open) setDialog(null); }} onSave={(input) => run("farm", () => updateFarm(input), "Farm details updated.")} />
    <FieldBlockDialog open={dialog === "new-field" || dialog === "edit-field"} block={dialog === "edit-field" ? field : null} busy={busyAction === "field"} onOpenChange={(open) => { if (!open) setDialog(null); }} onSave={async (input) => { const saved = await run("field", () => field ? updateFieldBlock(field.fieldBlockId, input) : createFieldBlock(input), field ? "Field block updated." : "Field block added."); if (saved) setDialog(null); }} />
    <CropBatchDialog open={dialog === "new-batch" || dialog === "edit-batch"} field={field} batch={dialog === "edit-batch" ? batch : null} busy={busyAction === "batch"} onOpenChange={(open) => { if (!open) setDialog(null); }} onSave={async (input) => { const saved = await run("batch", () => batch ? updateCropBatch(batch.cropBatchId, input) : createCropBatch(input), batch ? "Crop batch updated." : "Crop batch added."); if (saved) setDialog(null); }} />
    <DeleteDialog target={deleteTarget} busy={busyAction === "delete"} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }} onConfirm={async () => { if (!deleteTarget) return; const saved = await run("delete", () => deleteTarget.kind === "field" ? deleteFieldBlock(deleteTarget.record.fieldBlockId) : deleteCropBatch(deleteTarget.record.cropBatchId), deleteTarget.kind === "field" ? "Field block deleted." : "Crop batch deleted."); if (saved) setDeleteTarget(null); }} />
  </div>;
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex min-w-0 gap-3"><span className="mt-0.5 text-primary" aria-hidden="true">{icon}</span><div className="min-w-0"><dt className="font-semibold text-muted-foreground">{label}</dt><dd className="mt-0.5 break-words font-bold text-foreground">{value}</dd></div></div>; }

function FieldBlockCard({ block, batches, busyAction, onEdit, onDelete, onAddBatch, onEditBatch, onDeleteBatch }: { block: FieldBlock; batches: CropBatch[]; busyAction: string | null; onEdit: () => void; onDelete: () => void; onAddBatch: () => void; onEditBatch: (batch: CropBatch) => void; onDeleteBatch: (batch: CropBatch) => void }) {
  return <article className="overflow-hidden rounded-lg border bg-card shadow-sm"><div className="grid gap-4 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant={statusVariant(block.status)}>{titleStatus(block.status)}</Badge><span className="text-sm font-bold tabular-nums text-muted-foreground">{formatArea(block.areaHectares)}</span></div><h3 className="mt-3 text-xl font-extrabold tracking-tight">{block.name}</h3><p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"><MapPinned className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />{block.coordinates.latitude.toFixed(5)}, {block.coordinates.longitude.toFixed(5)}</p>{block.notes ? <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{block.notes}</p> : null}</div><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" icon={<Pencil aria-hidden="true" />} disabled={Boolean(busyAction)} onClick={onEdit}>Edit</Button><Button type="button" size="sm" variant="ghost" icon={<Trash2 aria-hidden="true" />} disabled={Boolean(busyAction)} onClick={onDelete}>Delete</Button></div></div>
    <details className="border-t" open={batches.length > 0}><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-ring/30"><span className="flex items-center gap-2"><Sprout className="h-5 w-5 text-primary" aria-hidden="true" />Crop batches <span className="rounded-full bg-primary/10 px-2 py-0.5 text-sm tabular-nums text-primary">{batches.length}</span></span><ChevronDown className="h-5 w-5 text-muted-foreground transition-transform [[open]_&]:rotate-180" aria-hidden="true" /></summary><div className="grid gap-3 border-t bg-muted/20 px-5 py-4">{batches.length ? batches.map((batch) => <CropBatchCard key={batch.cropBatchId} batch={batch} busy={Boolean(busyAction)} onEdit={() => onEditBatch(batch)} onDelete={() => onDeleteBatch(batch)} />) : <p className="text-sm leading-6 text-muted-foreground">No crop batches are recorded for this field yet.</p>}<Button type="button" size="sm" variant="outline" className="w-fit" icon={<Plus aria-hidden="true" />} disabled={Boolean(busyAction)} onClick={onAddBatch}>Add crop batch</Button></div></details>
  </article>;
}

function CropBatchCard({ batch, busy, onEdit, onDelete }: { batch: CropBatch; busy: boolean; onEdit: () => void; onDelete: () => void }) { return <article className="grid gap-4 rounded-md border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_auto]"><div><div className="flex flex-wrap items-center gap-2"><Badge variant={statusVariant(batch.status)}>{titleStatus(batch.status)}</Badge><span className="text-xs font-bold uppercase tracking-[0.12em] text-primary">{batch.crop}</span></div><h4 className="mt-2 font-bold">{batch.variety || "Variety not recorded"}</h4><p className="mt-1 text-sm text-muted-foreground">{formatDate(batch.plantingDate)}</p>{batch.notes ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{batch.notes}</p> : null}</div><div className="flex flex-wrap gap-2 sm:content-start"><Button type="button" size="sm" variant="outline" disabled={busy} onClick={onEdit}>Edit</Button><Button type="button" size="sm" variant="ghost" disabled={busy} onClick={onDelete}>Delete</Button></div></article>; }
function EmptyFields({ onAdd }: { onAdd: () => void }) { return <div className="rounded-lg border border-dashed bg-card px-5 py-9 text-center"><Sprout className="mx-auto h-7 w-7 text-primary" aria-hidden="true" /><h3 className="mt-3 font-bold">No field blocks yet</h3><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">Start by adding the first field block, then attach its shallot crop batches.</p><Button className="mt-4" type="button" icon={<Plus aria-hidden="true" />} onClick={onAdd}>Add field block</Button></div>; }

function FarmEditDialog({ open, farm, busy, onOpenChange, onSave }: { open: boolean; farm: FarmSnapshot["farm"]; busy: boolean; onOpenChange: (open: boolean) => void; onSave: (input: FarmUpdate) => Promise<boolean> }) {
  const [windows, setWindows] = useState<WorkWindow[]>(() => flattenHours(farm.defaultWorkingHours));
  useEffect(() => { if (open) setWindows(flattenHours(farm.defaultWorkingHours)); }, [farm, open]);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); void onSave({ name: String(form.get("name") ?? "").trim(), location: optional(form.get("location")), notes: optional(form.get("notes")), timezone: String(form.get("timezone") ?? "").trim(), defaultWorkerCount: numeric(form.get("defaultWorkerCount")), defaultWorkingHours: windows.length ? groupHours(windows) : null }); }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>Edit farm</DialogTitle><DialogDescription>These details are used as farm context for planning.</DialogDescription></DialogHeader><form className="grid gap-4" onSubmit={submit}><div className="grid gap-4 sm:grid-cols-2"><FieldGroup label="Farm name" required><Input name="name" required defaultValue={farm.name} /></FieldGroup><FieldGroup label="Planning capacity" required helper="People usually available for farm work."><Input name="defaultWorkerCount" type="number" min="1" step="1" required defaultValue={farm.defaultWorkerCount} /></FieldGroup><FieldGroup label="Location"><Input name="location" defaultValue={farm.location ?? ""} /></FieldGroup><FieldGroup label="Timezone" required><Input name="timezone" required defaultValue={farm.timezone} /></FieldGroup></div><FieldGroup label="Farm notes"><Textarea name="notes" className="min-h-20" defaultValue={farm.notes ?? ""} /></FieldGroup><WorkWindows windows={windows} onChange={setWindows} /><DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" isLoading={busy} loadingLabel="Saving farm">Save farm</Button></DialogFooter></form></DialogContent></Dialog>;
}

function FieldBlockDialog({ open, block, busy, onOpenChange, onSave }: { open: boolean; block: FieldBlock | null; busy: boolean; onOpenChange: (open: boolean) => void; onSave: (input: FieldBlockInput) => Promise<void> }) { function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const areaText = String(form.get("areaHectares") ?? "").trim(); const areaHectares = areaText ? numeric(areaText) : null; const input: FieldBlockInput = { name: String(form.get("name") ?? "").trim(), coordinates: { latitude: numeric(form.get("latitude")), longitude: numeric(form.get("longitude")) }, areaHectares, notes: optional(form.get("notes")), ...(optional(form.get("status")) ? { status: String(form.get("status")).trim() } : {}) }; void onSave(input); }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{block ? "Edit field block" : "Add field block"}</DialogTitle><DialogDescription>A field block needs a name and a map location. Crop batches are added after the field exists.</DialogDescription></DialogHeader><form className="grid gap-4" onSubmit={submit}><div className="grid gap-4 sm:grid-cols-2"><FieldGroup label="Field block name" required><Input name="name" required defaultValue={block?.name ?? ""} /></FieldGroup><FieldGroup label="Area (hectares)"><Input name="areaHectares" type="number" min="0.01" step="0.01" defaultValue={block?.areaHectares ?? ""} /></FieldGroup><FieldGroup label="Latitude" required><Input name="latitude" type="number" step="any" required defaultValue={block?.coordinates.latitude ?? ""} /></FieldGroup><FieldGroup label="Longitude" required><Input name="longitude" type="number" step="any" required defaultValue={block?.coordinates.longitude ?? ""} /></FieldGroup></div><FieldGroup label="Status"><Input name="status" defaultValue={block?.status ?? ""} placeholder="active" /></FieldGroup><FieldGroup label="Field notes"><Textarea name="notes" className="min-h-20" defaultValue={block?.notes ?? ""} /></FieldGroup><DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" isLoading={busy} loadingLabel="Saving field">{block ? "Save field" : "Add field"}</Button></DialogFooter></form></DialogContent></Dialog>; }

function CropBatchDialog({ open, field, batch, busy, onOpenChange, onSave }: { open: boolean; field: FieldBlock | null; batch: CropBatch | null; busy: boolean; onOpenChange: (open: boolean) => void; onSave: (input: CropBatchInput) => Promise<void> }) { if (!field) return null; const selectedField = field; function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); void onSave({ fieldBlockId: selectedField.fieldBlockId, variety: optional(form.get("variety")), plantingDate: optional(form.get("plantingDate")), notes: optional(form.get("notes")), ...(optional(form.get("status")) ? { status: String(form.get("status")).trim() } : {}) }); }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{batch ? "Edit crop batch" : "Add crop batch"}</DialogTitle><DialogDescription>This shallot crop batch will belong to {field.name}.</DialogDescription></DialogHeader><form className="grid gap-4" onSubmit={submit}><FieldGroup label="Variety"><Input name="variety" defaultValue={batch?.variety ?? ""} placeholder="Bima Brebes" /></FieldGroup><div className="grid gap-4 sm:grid-cols-2"><FieldGroup label="Planting date"><Input name="plantingDate" type="date" defaultValue={batch?.plantingDate ?? ""} /></FieldGroup><FieldGroup label="Status"><Input name="status" defaultValue={batch?.status ?? ""} placeholder="active" /></FieldGroup></div><FieldGroup label="Batch notes"><Textarea name="notes" className="min-h-20" defaultValue={batch?.notes ?? ""} /></FieldGroup><DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" isLoading={busy} loadingLabel="Saving crop batch">{batch ? "Save crop batch" : "Add crop batch"}</Button></DialogFooter></form></DialogContent></Dialog>; }

function DeleteDialog({ target, busy, onOpenChange, onConfirm }: { target: DeleteTarget; busy: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => Promise<void> }) { const field = target?.kind === "field"; return <AlertDialog open={Boolean(target)} onOpenChange={onOpenChange}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{field ? "Delete this field block?" : "Delete this crop batch?"}</AlertDialogTitle><AlertDialogDescription>{field ? "This permanently deletes the field block and all crop batches attached to it." : "This permanently deletes this crop batch."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel><AlertDialogAction asChild><Button type="button" variant="danger" isLoading={busy} loadingLabel="Deleting" onClick={() => void onConfirm()}>Delete</Button></AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>; }

function WorkWindows({ windows, onChange }: { windows: WorkWindow[]; onChange: (windows: WorkWindow[]) => void }) { return <section className="grid gap-3 rounded-lg border bg-muted/35 p-4"><div><h3 className="font-bold">Work windows</h3><p className="mt-1 text-sm text-muted-foreground">Optional availability used for planning.</p></div>{windows.map((window) => <div key={window.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2.75rem] gap-2"><select aria-label="Weekday" className="min-h-11 rounded-md border bg-card px-2" value={window.day} onChange={(event) => onChange(windows.map((item) => item.id === window.id ? { ...item, day: event.target.value as keyof WorkingHours } : item))}>{weekdays.map((day) => <option key={day} value={day}>{day[0].toUpperCase()}{day.slice(1)}</option>)}</select><Input aria-label="Start time" type="time" required value={window.start} onChange={(event) => onChange(windows.map((item) => item.id === window.id ? { ...item, start: event.target.value } : item))} /><Input aria-label="End time" type="time" required value={window.end} onChange={(event) => onChange(windows.map((item) => item.id === window.id ? { ...item, end: event.target.value } : item))} /><Button type="button" size="icon" variant="ghost" aria-label="Remove work window" onClick={() => onChange(windows.filter((item) => item.id !== window.id))}><Trash2 aria-hidden="true" /></Button></div>)}<Button type="button" size="sm" variant="outline" className="w-fit" icon={<Plus aria-hidden="true" />} onClick={() => onChange([...windows, { id: `window-${Date.now()}`, day: "monday", start: "", end: "" }])}>Add window</Button></section>; }
function flattenHours(hours: WorkingHours | null) { return Object.entries(hours ?? {}).flatMap(([day, ranges]) => ranges?.map((range, index) => ({ id: `${day}-${index}`, day: day as keyof WorkingHours, ...range })) ?? []); }
function groupHours(windows: WorkWindow[]) { const result: WorkingHours = {}; for (const window of windows) (result[window.day] ??= []).push({ start: window.start, end: window.end }); return result; }
function availabilityLabel(hours: WorkingHours | null) { const count = Object.values(hours ?? {}).reduce((total, ranges) => total + (ranges?.length ?? 0), 0); return count ? `${count} time window${count === 1 ? "" : "s"}` : "Not recorded"; }
