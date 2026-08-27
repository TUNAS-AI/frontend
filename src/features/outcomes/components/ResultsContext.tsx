import { BarChart3, Database, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getResultsSummary } from "../resultsSummary";
import type { MissionOutcome, ResultsPageData } from "../types";

export function ResultsContext({ data, outcomes }: { data: ResultsPageData; outcomes: readonly MissionOutcome[] }) {
  const summary = getResultsSummary(outcomes);
  return <Card className="shadow-farm"><CardHeader className="border-b"><div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Database className="h-4 w-4" aria-hidden="true" />{data.sourceLabel}</div><CardTitle>Evidence context</CardTitle></CardHeader><CardContent className="grid gap-5 pt-5"><dl className="grid grid-cols-2 gap-4"><div><dt className="text-xs font-semibold text-muted-foreground">Completed missions</dt><dd className="text-2xl font-extrabold tabular-nums">{summary.completedMissions}</dd></div><div><dt className="text-xs font-semibold text-muted-foreground">Commitments fulfilled</dt><dd className="text-2xl font-extrabold tabular-nums">{summary.fulfilledCommitments}</dd></div></dl><div className="flex gap-3 border-t pt-5"><BarChart3 className="mt-0.5 h-5 w-5 shrink-0 text-forest-600" aria-hidden="true" /><div><p className="font-bold">Benchmark status</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{summary.hasBenchmarkEvidence ? "Comparable evidence is available for review." : "Not enough comparable results for a benchmark."}</p></div></div><div className="flex gap-3 rounded-md bg-forest-50 p-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-forest-700" aria-hidden="true" /><p className="text-sm font-semibold text-forest-700">Results remain evidence for review, not automatic truth.</p></div><Badge variant="source">No automatic calibration</Badge></CardContent></Card>;
}
