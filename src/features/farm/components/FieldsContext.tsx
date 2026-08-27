import { Database, Layers3, Sprout } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { FieldsPageData } from "../types";

export function FieldsContext({ data }: { data: FieldsPageData }) {
  const activeBatches = data.batches.filter((item) => item.statusLabel === "Active").length;
  const openCommitments = data.commitments.filter((item) => item.statusLabel !== "Completed").length;

  return (
    <Card className="shadow-farm">
      <CardHeader className="border-b">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Sprout className="h-4 w-4" aria-hidden="true" />Fields at a glance</div>
        <CardTitle>{data.blocks.length} configured fields</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 pt-5">
        <dl className="divide-y">
          <div className="flex items-center justify-between gap-4 pb-3"><dt className="text-sm font-semibold text-muted-foreground">Active crop batches</dt><dd className="text-lg font-extrabold tabular-nums">{activeBatches}</dd></div>
          <div className="flex items-center justify-between gap-4 py-3"><dt className="text-sm font-semibold text-muted-foreground">Recorded observations</dt><dd className="text-lg font-extrabold tabular-nums">{data.observations.length}</dd></div>
          <div className="flex items-center justify-between gap-4 pt-3"><dt className="text-sm font-semibold text-muted-foreground">Open commitments</dt><dd className="text-lg font-extrabold tabular-nums">{openCommitments}</dd></div>
        </dl>
        <div className="flex gap-3 border-t pt-5">
          <Layers3 className="mt-0.5 h-5 w-5 shrink-0 text-forest-600" aria-hidden="true" />
          <div><p className="font-bold">Mission context</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Missions retrieve only the field records relevant to their goal.</p></div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Database className="h-4 w-4" aria-hidden="true" />{data.sourceLabel}</div>
        <Badge variant="source">Local demo edits are not persisted</Badge>
      </CardContent>
    </Card>
  );
}
