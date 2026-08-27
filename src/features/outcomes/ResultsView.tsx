import { useEffect } from "react";
import { ArrowRight, BarChart3, CheckCircle2, ClipboardList, Target } from "lucide-react";
import { Link } from "react-router";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { getResultsSummary } from "./resultsSummary";
import type { MissionOutcome, ResultsPageData } from "./types";

export function ResultsView({ data, outcomes }: { data: ResultsPageData; outcomes: readonly MissionOutcome[] }) {
  const summary = getResultsSummary(outcomes);
  useEffect(() => { document.title = "Results | TUNAS"; }, []);

  return (
    <div className="grid gap-5">
      <PageHeader badges={<><Badge variant="success">Results</Badge><Badge variant="source">{data.sourceLabel}</Badge></>} title={data.title} description={data.description} meta={data.freshness} />

      <section aria-label="Result summary" className="grid gap-3 sm:grid-cols-3">
        <MetricCard icon={<ClipboardList className="h-5 w-5" aria-hidden="true" />} label="Completed missions" value={summary.completedMissions} />
        <MetricCard icon={<Target className="h-5 w-5" aria-hidden="true" />} label="Commitments fulfilled" value={summary.fulfilledCommitments} />
        <MetricCard icon={<BarChart3 className="h-5 w-5" aria-hidden="true" />} label="Within expected range" value={`${summary.withinRangeCount} of ${summary.comparisonCount}`} />
      </section>

      {!summary.hasBenchmarkEvidence ? <Alert variant="info"><BarChart3 aria-hidden="true" /><AlertTitle>Benchmark not available yet</AlertTitle><AlertDescription>At least three comparable completed missions are required before this prototype should surface a reviewable pattern. Individual results remain available below.</AlertDescription></Alert> : null}

      <section aria-labelledby="completed-results-heading" className="grid gap-4">
        <div><h2 id="completed-results-heading" className="text-xl font-extrabold">Completed mission results</h2><p className="mt-1 text-sm text-muted-foreground">Open a result to review its evidence, comparison, and deviation context.</p></div>
        {outcomes.length ? <div className="grid gap-4">{outcomes.map((outcome) => <Card key={outcome.id} className="shadow-farm"><CardHeader><div className="flex flex-wrap items-center gap-2"><Badge variant={outcome.resultStatusTone}>{outcome.resultStatusLabel}</Badge><Badge variant="source">{outcome.cropLabel}</Badge></div><CardTitle className="pt-2 text-xl">{outcome.title}</CardTitle><p className="text-sm leading-6 text-muted-foreground">{outcome.closedLabel}</p></CardHeader><CardContent className="grid gap-4"><dl className="grid gap-3 sm:grid-cols-3"><div><dt className="text-sm font-semibold text-muted-foreground">Buyer target</dt><dd className="mt-1 font-bold">{outcome.commitment.targetLabel}</dd></div><div><dt className="text-sm font-semibold text-muted-foreground">Actual</dt><dd className="mt-1 font-bold">{outcome.commitment.actualLabel}</dd></div><div><dt className="text-sm font-semibold text-muted-foreground">Fulfilment</dt><dd className="mt-1 text-xl font-extrabold tabular-nums">{outcome.commitment.fulfilmentPercent}%</dd></div></dl><div className="flex flex-col justify-between gap-3 border-t pt-4 sm:flex-row sm:items-center"><div className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-forest-700" aria-hidden="true" /><span><strong>{outcome.comparisons.filter((comparison) => comparison.tone === "success").length}</strong> comparisons within expected range</span></div><Button asChild trailingIcon={<ArrowRight aria-hidden="true" />}><Link to={`/outcomes/${outcome.missionId}`}>Review result</Link></Button></div></CardContent></Card>)}</div> : <EmptyState title={data.emptyState.title} description={data.emptyState.description} />}
      </section>
    </div>
  );
}
