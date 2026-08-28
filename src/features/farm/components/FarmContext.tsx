import { Layers3, Sprout } from "lucide-react";
import type { FarmSnapshot } from "@/api/farm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export function FarmContext({ data }: { data: FarmSnapshot }) {
  const activeBatches = data.cropBatches.filter((batch) => batch.status.toLowerCase() === "active").length;
  return <Card className="overflow-hidden shadow-farm"><CardHeader className="bg-primary text-primary-foreground"><div className="flex items-center gap-2 text-sm font-semibold text-white/80"><Sprout className="h-4 w-4" aria-hidden="true" />Farm at a glance</div><CardTitle className="text-4xl text-white tabular-nums">{activeBatches}</CardTitle><p className="text-sm font-semibold text-white/85">Active crop batches</p></CardHeader><CardContent className="grid gap-4 pt-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary"><Layers3 className="h-5 w-5" aria-hidden="true" /></span><div><p className="text-sm font-semibold text-muted-foreground">Field blocks</p><p className="text-xl font-extrabold tabular-nums">{data.fieldBlocks.length}</p></div></div><p className="border-t pt-4 text-sm leading-6 text-muted-foreground">Crop batches are grouped inside their field blocks, so the farm structure stays clear at a glance.</p></CardContent></Card>;
}
