import { ArrowRight, MapPinned, Plus, Sprout } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { CropBatch, FarmBlock } from "../types";

type FieldBlockListProps = {
  batches: readonly CropBatch[];
  blocks: readonly FarmBlock[];
  onAddField: () => void;
  onSelectBlock: (blockId: string) => void;
};

export function FieldBlockList({ batches, blocks, onAddField, onSelectBlock }: FieldBlockListProps) {
  return (
    <section aria-labelledby="field-blocks-heading" className="grid gap-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-forest-700">Farm map</p>
          <h2 id="field-blocks-heading" className="mt-1 text-2xl font-extrabold tracking-tight">Field blocks</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Open a block for its crop batches, farmer-reported field context, and any mission already linked to a batch.</p>
        </div>
        <Button type="button" icon={<Plus aria-hidden="true" />} onClick={onAddField}>Add field block</Button>
      </div>

      {blocks.length ? (
        <ul className="grid gap-3">
          {blocks.map((block) => {
            const blockBatches = batches.filter((batch) => batch.blockId === block.id);
            const missionCount = blockBatches.filter((batch) => batch.mission).length;
            return (
              <li key={block.id}>
                <button
                  type="button"
                  className="group grid min-h-28 w-full gap-4 rounded-lg border bg-card px-4 py-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-px hover:border-forest-300 hover:bg-forest-50/50 hover:shadow-farm active:translate-y-0 active:scale-[0.995] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5"
                  onClick={() => onSelectBlock(block.id)}
                  aria-label={`Open ${block.name} details`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><Badge variant={block.conditionTone}>{block.conditionLabel}</Badge><span className="text-sm font-bold tabular-nums text-muted-foreground">{block.areaLabel}</span></div>
                    <h3 className="mt-3 text-xl font-extrabold tracking-tight text-foreground">{block.name}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPinned className="h-4 w-4 shrink-0 text-forest-600" aria-hidden="true" />{block.location}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{block.notes}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-field-100 pt-3 sm:min-w-48 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Crop batches</p>
                      <p className="mt-1 flex items-center gap-1.5 font-bold text-foreground"><Sprout className="h-4 w-4 text-leaf-700" aria-hidden="true" />{blockBatches.length} tracked</p>
                      <p className="mt-1 text-xs text-muted-foreground">{missionCount ? `${missionCount} linked mission${missionCount === 1 ? "" : "s"}` : "No linked mission"}</p>
                    </div>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-forest-50 text-forest-700 transition-colors group-hover:bg-forest-700 group-hover:text-white"><ArrowRight className="h-5 w-5" aria-hidden="true" /></span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed bg-card px-5 py-8 text-center">
          <Sprout className="mx-auto h-7 w-7 text-leaf-700" aria-hidden="true" />
          <h3 className="mt-3 font-bold">No field blocks yet</h3>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">Add a field block first, then attach a shallot crop batch with farmer-reported readiness.</p>
          <Button className="mt-4" type="button" icon={<Plus aria-hidden="true" />} onClick={onAddField}>Add field block</Button>
        </div>
      )}
    </section>
  );
}
