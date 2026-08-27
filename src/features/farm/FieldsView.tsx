import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Check, Pencil } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FieldGroup } from "@/components/ui/FieldControl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AddFieldBlockDialog } from "./components/AddFieldBlockDialog";
import { FieldBlockDetailDialog } from "./components/FieldBlockDetailDialog";
import { FieldBlockList } from "./components/FieldBlockList";
import type { CropBatchDraft, FarmBlockDraft, FieldsPageData } from "./types";

export function FieldsView({ data }: { data: FieldsPageData }) {
  const [farm, setFarm] = useState(data.farm);
  const [blocks, setBlocks] = useState(data.blocks);
  const [batches, setBatches] = useState(data.batches);
  const [editingProfile, setEditingProfile] = useState(false);
  const [addingField, setAddingField] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const selectedBlock = useMemo(() => blocks.find((block) => block.id === selectedBlockId) ?? null, [blocks, selectedBlockId]);

  useEffect(() => {
    document.title = "Field blocks | TUNAS";
  }, []);

  function saveFarm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEditingProfile(false);
    setNotice("Farm profile updated in this demo session only.");
  }

  function createField(draft: FarmBlockDraft) {
    const area = Number(draft.areaHectares);
    if (!Number.isFinite(area) || area <= 0) {
      setNotice("Enter a valid field area before creating the field block.");
      return;
    }
    const block = {
      id: `local-field-${Date.now()}`,
      name: draft.name,
      location: draft.location,
      areaLabel: `${area} ha`,
      conditionLabel: "Setup in progress",
      conditionTone: "info" as const,
      accessNotes: draft.accessNotes,
      drainageNotes: draft.drainageNotes,
      notes: draft.notes || "No additional farmer-reported notes.",
      sourceLabel: "Added in this demo session",
    };
    setBlocks((current) => [...current, block]);
    setAddingField(false);
    setSelectedBlockId(block.id);
    setDetailOpen(true);
    setNotice(`${block.name} was added locally. Add a shallot crop batch when the farmer is ready.`);
  }

  function createBatch(blockId: string, draft: CropBatchDraft) {
    const batch = {
      id: `local-batch-${Date.now()}`,
      crop: "Shallot",
      batchLabel: draft.batchLabel,
      variety: draft.variety,
      blockId,
      plantedLabel: `Planted ${draft.plantingDate}`,
      stage: draft.stage,
      readinessLabel: draft.readinessLabel,
      statusLabel: "Active",
      notes: draft.notes || "No additional farmer-reported notes.",
      sourceLabel: "Added in this demo session",
    };
    setBatches((current) => [...current, batch]);
    setNotice(`${batch.crop} batch ${batch.batchLabel} was attached to ${blocks.find((block) => block.id === blockId)?.name ?? "this field"} locally. It is not yet part of a mission.`);
  }

  return (
    <div className="grid gap-6">
      <header className="overflow-hidden rounded-lg border bg-card shadow-farm">
        <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
          <div className="grid content-between gap-8 px-5 py-7 sm:px-7 sm:py-8">
            <div className="grid gap-4">
              <div className="flex flex-wrap items-center gap-2"><Badge variant="info">Farm fields</Badge><Badge variant="source">{data.sourceLabel}</Badge></div>
              <div className="grid gap-2"><h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{data.title}</h1><p className="max-w-2xl text-base leading-7 text-muted-foreground">{data.description}</p></div>
            </div>
            <p className="text-xs text-muted-foreground">{data.freshness}</p>
          </div>

          <section aria-labelledby="farm-profile-heading" className="border-t bg-forest-50/50 px-5 py-6 dark:bg-muted/30 sm:px-7 lg:border-l lg:border-t-0">
            <div className="flex items-start justify-between gap-4"><div><p id="farm-profile-heading" className="text-sm font-extrabold tracking-wide text-foreground">Farm profile</p><h2 className="mt-2 text-xl font-extrabold tracking-tight">{farm.name}</h2></div>{!editingProfile ? <Button type="button" size="sm" variant="outline" icon={<Pencil aria-hidden="true" />} onClick={() => setEditingProfile(true)}>Edit</Button> : null}</div>
            <dl className="mt-5 grid gap-4 text-sm"><div><dt className="font-semibold text-muted-foreground">Location</dt><dd className="mt-0.5 font-bold">{farm.location}</dd></div><div><dt className="font-semibold text-muted-foreground">Timezone</dt><dd className="mt-0.5 font-bold">{farm.timezone}</dd></div></dl>
            <p className="mt-5 border-t border-forest-200 pt-4 text-sm leading-6 text-muted-foreground dark:border-forest-700">{farm.notes}</p>
          </section>
        </div>

        {editingProfile ? <form className="grid gap-4 border-t px-5 py-6 sm:px-7" onSubmit={saveFarm}><div><h2 className="font-bold">Edit farm profile</h2><p className="mt-1 text-sm text-muted-foreground">This placeholder edit lasts for the current browser session only.</p></div><div className="grid gap-4 sm:grid-cols-2"><FieldGroup label="Farm name" required><Input required value={farm.name} onChange={(event) => setFarm({ ...farm, name: event.target.value })} /></FieldGroup><FieldGroup label="Location" required><Input required value={farm.location} onChange={(event) => setFarm({ ...farm, location: event.target.value })} /></FieldGroup></div><FieldGroup label="Notes"><Textarea className="min-h-24" value={farm.notes} onChange={(event) => setFarm({ ...farm, notes: event.target.value })} /></FieldGroup><div className="flex flex-wrap gap-3"><Button type="submit">Save locally</Button><Button type="button" variant="outline" onClick={() => { setFarm(data.farm); setEditingProfile(false); }}>Cancel</Button></div></form> : null}
      </header>

      {notice ? <Alert variant="success" aria-live="polite"><Check aria-hidden="true" /><AlertTitle>Demo update complete</AlertTitle><AlertDescription>{notice}</AlertDescription></Alert> : null}

      <FieldBlockList blocks={blocks} batches={batches} onAddField={() => setAddingField(true)} onSelectBlock={(blockId) => { setSelectedBlockId(blockId); setDetailOpen(true); }} />

      <AddFieldBlockDialog open={addingField} onOpenChange={setAddingField} onCreate={createField} />
      <FieldBlockDetailDialog open={detailOpen} onOpenChange={setDetailOpen} block={selectedBlock} batches={batches} observations={data.observations} commitments={data.commitments} onAddBatch={createBatch} />
    </div>
  );
}
