import { CalendarCheck2, CircleAlert, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { FieldGroup } from "@/components/ui/FieldControl";
import { Textarea } from "@/components/ui/textarea";
import type { HarvestPlan, MissionContextData } from "../types";
import { PlanOptionCard } from "./PlanOptionCard";
import { SelectedPlanDetails } from "./SelectedPlanDetails";

type MissionPlanReviewProps = {
  adjustment: string;
  adjusted: boolean;
  appliedAdjustment: string;
  changes: string[];
  constraintSummary: string;
  onAdjustmentChange: (value: string) => void;
  onPreview: () => void;
  onRecalculate: () => void;
  onSelect: (planId: HarvestPlan["id"]) => void;
  plans: HarvestPlan[];
  revisionId: string | null;
  rules: MissionContextData["rules"];
  selectedPlan: HarvestPlan | null;
  selectedPlanId: HarvestPlan["id"] | null;
  validationError: string;
};

export function MissionPlanReview({ adjustment, adjusted, appliedAdjustment, changes, constraintSummary, onAdjustmentChange, onPreview, onRecalculate, onSelect, plans, revisionId, rules, selectedPlan, selectedPlanId, validationError }: MissionPlanReviewProps) {
  return (
    <div className="grid gap-5">
      {adjusted && changes.length ? <Alert variant="success"><ShieldCheck aria-hidden="true" /><AlertTitle>Results changed after recalculation</AlertTitle><AlertDescription><ul className="list-disc pl-5">{changes.map((change) => <li key={change}>{change}</li>)}</ul></AlertDescription></Alert> : null}
      {!adjusted && appliedAdjustment ? <Alert variant="warning"><CircleAlert aria-hidden="true" /><AlertTitle>Recalculation is stale</AlertTitle><AlertDescription>The adjustment changed. Selection and approval readiness were cleared.</AlertDescription></Alert> : null}
      <section aria-labelledby="plans-heading" className="grid gap-4">
        <div><h2 id="plans-heading" className="text-2xl font-extrabold tracking-tight">Choose a plan strategy</h2><p className="mt-1 max-w-3xl text-base leading-7 text-muted-foreground">{constraintSummary} Compare the options, then inspect one strategy in detail. Selection is not approval.</p></div>
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(17rem,0.75fr)_minmax(0,1.4fr)]">
          <div className="grid gap-3" aria-label="Available plan strategies">{plans.map((plan, index) => <PlanOptionCard key={plan.id} plan={plan} position={index + 1} selected={selectedPlanId === plan.id} onSelect={() => onSelect(plan.id)} />)}</div>
          {selectedPlan ? <SelectedPlanDetails plan={selectedPlan} /> : <Card className="border-dashed"><CardContent className="grid min-h-52 place-items-center pt-5 text-center text-muted-foreground sm:pt-6">Select a feasible strategy to see its quantities, trade-offs, and assumptions.</CardContent></Card>}
        </div>
      </section>
      <Card><CardHeader><CardTitle>Optional adjustment</CardTitle></CardHeader><CardContent><FieldGroup label="Mission adjustment" helper="Optional. Supported intent: prioritize the buyer order without overtime." error={validationError || undefined}><Textarea id="mission-adjustment" lang="en" aria-invalid={Boolean(validationError)} aria-describedby="adjustment-description adjustment-error" aria-errormessage={validationError ? "adjustment-error" : undefined} value={adjustment} onChange={(event) => onAdjustmentChange(event.target.value)} className="min-h-24 text-base" /><span id="adjustment-description" className="sr-only">Optional adjustment. Supported intent: prioritize the buyer order without overtime.</span>{validationError ? <span id="adjustment-error" className="sr-only">{validationError}</span> : null}</FieldGroup></CardContent><CardFooter><Button type="button" onClick={onRecalculate}>Apply adjustment and recalculate</Button></CardFooter></Card>
      <details className="rounded-lg border bg-card p-4"><summary className="min-h-11 cursor-pointer py-2 font-bold">Rules and sources</summary><div className="grid gap-2 border-t pt-3 text-sm leading-6">{(rules ?? []).map((rule) => <p key={rule.id}><strong>{rule.id} v{rule.version}:</strong> {rule.description} Source: {rule.source}.</p>)}</div></details>
      <Card className="border-forest-400 bg-forest-50/60"><CardHeader><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle>Approval pending</CardTitle><Badge variant="warning">No schedule created</Badge></div><p className="text-base leading-7">Selected: <strong>{selectedPlan?.name ?? "No plan selected"}</strong>. {adjusted ? "This is the recalculated revision." : "You can review this plan now; adjustment is optional."}</p></CardHeader><CardFooter><Button type="button" size="lg" disabled={!selectedPlan || !revisionId} onClick={onPreview} icon={<CalendarCheck2 aria-hidden="true" />}>Build selected-plan preview</Button></CardFooter></Card>
    </div>
  );
}
