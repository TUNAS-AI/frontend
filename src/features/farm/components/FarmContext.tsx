import { Layers3, Sprout } from "lucide-react";
import type { FarmSnapshot } from "@/api/farm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export function FarmContext({ data }: { data: FarmSnapshot }) {
  const activeBatches = data.cropBatches.filter((batch) => batch.status.toLowerCase() === "active").length;
  return <Card className="overflow-hidden"><CardHeader className="bg-primary text-primary-foreground"><Sprout className="h-5 w-5 text-white/80" aria-hidden="true" /><CardTitle className="text-3xl text-white tabular-nums">{activeBatches}</CardTitle><p className="text-sm font-semibold text-white/85">Active crop batches</p></CardHeader><CardContent className="pt-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary"><Layers3 className="h-5 w-5" aria-hidden="true" /></span><div><p className="text-sm font-semibold text-muted-foreground">Field blocks</p><p className="text-xl font-extrabold tabular-nums">{data.fieldBlocks.length}</p></div></div></CardContent></Card>;
}
