import { useEffect } from "react";
import { ArrowLeft, CheckCircle2, CircleAlert, Scale, Target } from "lucide-react";
import { Link } from "react-router";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import type { MissionOutcome } from "./types";

export function OutcomeDetailView({ outcome }: { outcome: MissionOutcome }) {
  useEffect(() => { document.title = `${outcome.title} | TUNAS`; }, [outcome.title]);

  return (
    <div className="grid gap-5">
      <Link to="/missions" className="inline-flex min-h-11 w-fit items-center gap-2 rounded-md px-1 text-sm font-bold text-forest-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to missions</Link>

      <PageHeader badges={<><Badge variant={outcome.resultStatusTone}>{outcome.resultStatusLabel}</Badge><Badge variant="source">{outcome.sourceLabel}</Badge></>} eyebrow="Mission result" title={outcome.title} description={outcome.description} meta={outcome.closedLabel} />

      <Card variant="success">
        <CardContent className="grid gap-5 pt-5 sm:grid-cols-[1fr_auto] sm:items-center sm:pt-6">
          <div><p className="text-sm font-bold text-success-foreground">Buyer commitment</p><h2 className="mt-1 text-2xl font-extrabold">{outcome.commitment.statusLabel}</h2><p className="mt-1 text-muted-foreground">{outcome.commitment.buyerName} · target {outcome.commitment.targetLabel}</p></div>
          <div className="sm:text-right"><p className="text-3xl font-extrabold tabular-nums text-success-foreground">{outcome.commitment.fulfilmentPercent}%</p><p className="font-bold">{outcome.commitment.actualLabel}</p></div>
        </CardContent>
      </Card>

      <section aria-labelledby="comparison-heading" className="grid gap-4">
        <div><h2 id="comparison-heading" className="text-xl font-extrabold">Expected versus actual</h2><p className="mt-1 text-sm text-muted-foreground">Each comparison keeps its unit and interpretation visible; status is never communicated by color alone.</p></div>
        <div className="grid gap-4 xl:grid-cols-2">{outcome.comparisons.map((comparison) => <Card key={comparison.id}><CardHeader><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle>{comparison.label}</CardTitle><Badge variant={comparison.tone}>{comparison.statusLabel}</Badge></div></CardHeader><CardContent className="grid gap-4"><dl className="grid grid-cols-2 gap-4"><div><dt className="text-sm font-semibold text-muted-foreground">Expected</dt><dd className="mt-1 text-xl font-extrabold tabular-nums">{comparison.expected}</dd></div><div><dt className="text-sm font-semibold text-muted-foreground">Actual</dt><dd className="mt-1 text-xl font-extrabold tabular-nums">{comparison.actual}</dd></div></dl><p className="border-t pt-3 text-sm leading-6 text-muted-foreground">{comparison.interpretation}</p></CardContent></Card>)}</div>
      </section>

      <Alert variant={outcome.deviation.classification === "none" ? "success" : "warning"}>{outcome.deviation.classification === "none" ? <CheckCircle2 aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}<AlertTitle>{outcome.deviation.classificationLabel}: {outcome.deviation.title}</AlertTitle><AlertDescription>{outcome.deviation.description}</AlertDescription></Alert>

      <Card><CardHeader><div className="flex items-center gap-2 text-forest-700"><Target className="h-5 w-5" aria-hidden="true" /><CardTitle>What this result means</CardTitle></div></CardHeader><CardContent><p className="max-w-3xl leading-7">{outcome.conclusion}</p></CardContent></Card>

      <details className="rounded-lg border bg-card"><summary className="flex min-h-11 cursor-pointer items-center gap-2 px-5 py-4 font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-ring/30"><Scale className="h-5 w-5 text-forest-700" aria-hidden="true" />Recorded evidence</summary><dl className="grid gap-4 border-t px-5 py-4 sm:grid-cols-3">{outcome.evidence.map((item) => <div key={item.id}><dt className="text-sm font-semibold text-muted-foreground">{item.label}</dt><dd className="mt-1 font-bold tabular-nums">{item.value}</dd><p className="mt-1 text-xs text-muted-foreground">{item.sourceLabel}</p></div>)}</dl></details>
    </div>
  );
}
