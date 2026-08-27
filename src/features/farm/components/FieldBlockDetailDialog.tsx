import { type FormEvent, useState } from "react";
import { CalendarClock, MapPinned, Plus, Sprout } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Select } from "@/components/ui/FieldControl";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BuyerCommitment, CropBatch, CropBatchDraft, FarmBlock, FarmObservation } from "../types";

type FieldBlockDetailDialogProps = {
  batches: readonly CropBatch[];
  block: FarmBlock | null;
  commitments: readonly BuyerCommitment[];
  observations: readonly FarmObservation[];
  onAddBatch: (blockId: string, draft: CropBatchDraft) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function FieldBlockDetailDialog({ batches, block, commitments, observations, onAddBatch, onOpenChange, open }: FieldBlockDetailDialogProps) {
  const [addingBatch, setAddingBatch] = useState(false);
  if (!block) return null;
  const blockBatches = batches.filter((batch) => batch.blockId === block.id);
  const blockObservations = observations.filter((observation) => observation.blockId === block.id);
  const blockCommitments = commitments.filter((commitment) => commitment.blockId === block.id);

  function close(nextOpen: boolean) {
    if (!nextOpen) setAddingBatch(false);
    onOpenChange(nextOpen);
  }

  function submitBatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!block) return;
    const form = new FormData(event.currentTarget);
    onAddBatch(block.id, {
      batchLabel: String(form.get("batchLabel") ?? "").trim(),
      variety: String(form.get("variety") ?? "").trim(),
      plantingDate: String(form.get("plantingDate") ?? "").trim(),
      stage: String(form.get("stage") ?? "").trim(),
      readinessLabel: String(form.get("readinessLabel") ?? "").trim(),
      notes: String(form.get("notes") ?? "").trim(),
    });
    event.currentTarget.reset();
    setAddingBatch(false);
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader><DialogTitle>{block.name}</DialogTitle><DialogDescription>{block.location} - {block.areaLabel}. Review only the records attached to this field block.</DialogDescription></DialogHeader>
        <div className="grid gap-6">
        <section aria-labelledby="field-details-heading" className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2"><Badge variant={block.conditionTone}>{block.conditionLabel}</Badge><Badge variant="source">{block.sourceLabel}</Badge></div>
          <dl id="field-details-heading" className="grid gap-4 rounded-lg bg-field-50/60 p-4 text-sm sm:grid-cols-2">
            <div><dt className="font-semibold text-muted-foreground">Location</dt><dd className="mt-1 flex items-center gap-1.5 font-bold"><MapPinned className="h-4 w-4 text-forest-600" aria-hidden="true" />{block.location}</dd></div>
            <div><dt className="font-semibold text-muted-foreground">Field area</dt><dd className="mt-1 font-bold tabular-nums">{block.areaLabel}</dd></div>
            <div><dt className="font-semibold text-muted-foreground">Access</dt><dd className="mt-1 leading-6 text-foreground">{block.accessNotes}</dd></div>
            <div><dt className="font-semibold text-muted-foreground">Drainage</dt><dd className="mt-1 leading-6 text-foreground">{block.drainageNotes}</dd></div>
            <div className="sm:col-span-2"><dt className="font-semibold text-muted-foreground">Field notes</dt><dd className="mt-1 leading-6 text-foreground">{block.notes}</dd></div>
          </dl>
        </section>

        <section aria-labelledby="crop-batches-heading" className="grid gap-3 border-t pt-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-forest-700">Crop records</p><h2 id="crop-batches-heading" className="mt-1 text-lg font-extrabold">Shallot crop batches</h2></div>
            <Button type="button" size="sm" icon={<Plus aria-hidden="true" />} onClick={() => setAddingBatch((current) => !current)}>{addingBatch ? "Close form" : "Add crop batch"}</Button>
          </div>

          {addingBatch ? (
            <form className="grid gap-4 rounded-lg border border-leaf-300 bg-leaf-50/60 p-4" onSubmit={submitBatch}>
              <div><p className="font-bold">Add a shallot batch</p><p className="mt-1 text-sm leading-6 text-muted-foreground">This batch will attach to {block.name} in the current demo session only.</p></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldGroup label="Batch label" required><Input name="batchLabel" required placeholder="NB-SH-29" /></FieldGroup>
                <FieldGroup label="Variety" required><Input name="variety" required placeholder="Bima Brebes" /></FieldGroup>
                <FieldGroup label="Planting date" required><Input name="plantingDate" required type="date" /></FieldGroup>
                <FieldGroup label="Crop stage" required><Select name="stage" required defaultValue=""><option value="" disabled>Select a stage</option><option>Early growth</option><option>Bulb development</option><option>Near harvest</option><option>Harvest-ready</option></Select></FieldGroup>
              </div>
              <FieldGroup label="Farmer-reported readiness" required helper="TUNAS does not diagnose readiness."><Select name="readinessLabel" required defaultValue=""><option value="" disabled>Select the farmer report</option><option value="Farmer reported: not ready">Not ready</option><option value="Farmer reported: almost ready">Almost ready</option><option value="Farmer reported: ready">Ready</option><option value="Farmer reported: unsure">Unsure</option></Select></FieldGroup>
              <FieldGroup label="Batch notes"><Textarea name="notes" className="min-h-20" placeholder="Optional farmer-reported notes." /></FieldGroup>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => setAddingBatch(false)}>Cancel</Button><Button type="submit">Add crop batch</Button></div>
            </form>
          ) : null}

          {blockBatches.length ? <div className="grid gap-3">{blockBatches.map((batch) => <CropBatchCard key={batch.id} batch={batch} />)}</div> : <div className="rounded-lg border border-dashed px-4 py-6 text-center"><Sprout className="mx-auto h-6 w-6 text-leaf-700" aria-hidden="true" /><p className="mt-2 font-bold">No crop batches attached</p><p className="mt-1 text-sm text-muted-foreground">Add a shallot batch when the farmer is ready to record it.</p></div>}
        </section>

        {blockObservations.length ? <section aria-labelledby="field-observations-heading" className="grid gap-3 border-t pt-5"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-forest-700">Reported context</p><h2 id="field-observations-heading" className="mt-1 text-lg font-extrabold">Field observations</h2></div><div className="grid gap-3">{blockObservations.map((observation) => <article key={observation.id} className="rounded-lg border px-4 py-3"><div className="flex flex-wrap items-center gap-2"><Badge variant="source">{observation.sourceLabel}</Badge><time className="text-xs font-semibold text-muted-foreground" dateTime={observation.observedAt}>{observation.observedLabel}</time></div><h3 className="mt-3 font-bold">{observation.title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{observation.detail}</p></article>)}</div></section> : null}

        {blockCommitments.length ? <section aria-labelledby="field-commitments-heading" className="grid gap-3 border-t pt-5"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-forest-700">Buyer context</p><h2 id="field-commitments-heading" className="mt-1 text-lg font-extrabold">Buyer commitments</h2></div><div className="grid gap-3">{blockCommitments.map((commitment) => <article key={commitment.id} className="rounded-lg border px-4 py-3"><div className="flex flex-wrap items-center justify-between gap-2"><Badge variant={commitment.statusTone}>{commitment.statusLabel}</Badge><time className="flex items-center gap-1 text-xs font-semibold text-muted-foreground" dateTime={commitment.dueAt}><CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />{commitment.dueLabel}</time></div><h3 className="mt-3 font-bold">{commitment.buyerName}</h3><dl className="mt-3 grid grid-cols-2 gap-3 border-t pt-3 text-sm"><div><dt className="text-muted-foreground">Target</dt><dd className="mt-1 font-bold tabular-nums">{commitment.amountLabel}</dd></div><div><dt className="text-muted-foreground">Market quality</dt><dd className="mt-1 font-bold">{commitment.marketQuality}</dd></div></dl></article>)}</div></section> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CropBatchCard({ batch }: { batch: CropBatch }) {
  return (
    <article className="rounded-lg border bg-card px-4 py-4">
      <div className="flex flex-wrap items-center gap-2"><Badge variant={batch.statusLabel === "Active" ? "success" : "neutral"}>{batch.statusLabel}</Badge><Badge variant="source">{batch.sourceLabel}</Badge></div>
      <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><h3 className="text-lg font-extrabold">{batch.crop} - {batch.batchLabel}</h3><p className="mt-1 font-semibold text-muted-foreground">{batch.variety}</p></div><p className="text-sm font-semibold text-muted-foreground">{batch.plantedLabel}</p></div>
      <dl className="mt-4 grid gap-3 border-t pt-4 text-sm sm:grid-cols-2"><div><dt className="font-semibold text-muted-foreground">Crop stage</dt><dd className="mt-1 font-bold">{batch.stage}</dd></div><div><dt className="font-semibold text-muted-foreground">Readiness</dt><dd className="mt-1 font-bold">{batch.readinessLabel}</dd></div><div className="sm:col-span-2"><dt className="font-semibold text-muted-foreground">Batch notes</dt><dd className="mt-1 leading-6">{batch.notes}</dd></div></dl>
      {batch.mission ? <div className="mt-4 flex flex-col justify-between gap-3 rounded-md bg-forest-50 px-3 py-3 sm:flex-row sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><Badge variant={batch.mission.statusTone}>{batch.mission.statusLabel}</Badge><p className="text-xs font-semibold text-forest-700">Linked mission</p></div><p className="mt-1 font-bold text-foreground">{batch.mission.title}</p></div><Button asChild size="sm" variant="outline"><Link to={batch.mission.href}>Open mission</Link></Button></div> : null}
    </article>
  );
}
