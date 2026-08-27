import { Fragment } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getMissionScheduleSummary, getNextActivitySummary } from "../missionSchedule";
import type { HarvestPlan } from "../types";

export function SelectedPlanDetails({ plan }: { plan: HarvestPlan }) {
  const scheduleSummary = getMissionScheduleSummary(plan.schedule);
  const facts = [
    {
      label: "Expected saleable",
      value: `${plan.saleableQuantity.min}-${plan.saleableQuantity.max} ${plan.saleableQuantity.unit}`,
      detail: "Estimated market-ready yield",
      featured: true,
    },
    {
      label: "Market quality",
      value: `${plan.grade.quantity.min}-${plan.grade.quantity.max} ${plan.grade.quantity.unit}`,
      detail: plan.grade.label,
      featured: false,
    },
    {
      label: "Buyer fulfilment",
      value: `${plan.fulfilment.minPercent}-${plan.fulfilment.maxPercent}%`,
      detail: `of the ${plan.fulfilment.target} ${plan.fulfilment.unit} buyer target`,
      featured: false,
    },
    {
      label: scheduleSummary.label,
      value: scheduleSummary.value,
      detail: scheduleSummary.detail,
      featured: false,
    },
  ];

  return (
    <Card className="overflow-hidden border-0 bg-card shadow-sm ring-1 ring-forest-700/15">
      <CardHeader className="bg-forest-700 pb-7 text-white sm:pb-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-forest-100">Decision brief · Selected strategy</span>
          {plan.recommended ? <Badge className="border-white/30 bg-white/10 text-white">Recommended</Badge> : null}
        </div>
        <CardTitle className="text-2xl tracking-tight text-white sm:text-3xl">{plan.name}</CardTitle>
        <p className="max-w-prose text-base leading-7 text-white/80">{plan.summary}</p>
      </CardHeader>

      <CardContent className="grid gap-6 pt-5 sm:pt-6">
        <div className="grid grid-cols-2 gap-x-8">
          {facts.map((fact, index) => (
            <Fragment key={fact.label}>
              {index === 2 ? <div className="col-span-2 border-t" aria-hidden="true" /> : null}
              <dl className={index > 1 ? "min-w-0 pb-1 pt-5" : "min-w-0 pb-5"}>
                <dt className={fact.featured ? "text-sm font-semibold text-forest-700" : "text-sm font-semibold text-muted-foreground"}>
                  {fact.label}
                </dt>
                <dd className="mt-2.5">
                  <span className={fact.featured
                    ? "block text-xl font-extrabold leading-tight tracking-tight tabular-nums text-forest-700 sm:text-2xl"
                    : "block text-xl font-extrabold leading-tight tracking-tight tabular-nums text-foreground sm:text-2xl"}
                  >
                    {fact.value}
                  </span>
                  <span className={fact.featured ? "mt-1.5 block text-sm leading-5 text-forest-700/80" : "mt-1.5 block text-sm leading-5 text-muted-foreground"}>
                    {fact.detail}
                  </span>
                </dd>
              </dl>
            </Fragment>
          ))}
        </div>

        {plan.schedule.type === "date-range" && (plan.schedule.currentPhase || plan.schedule.nextActivity) ? (
          <section className="grid gap-3 rounded-lg bg-forest-50 p-4 sm:grid-cols-2" aria-label="Long-range plan progress">
            {plan.schedule.currentPhase ? (
              <div>
                <p className="text-sm font-semibold text-forest-700">Current phase</p>
                <p className="mt-1 font-bold text-forest-700">{plan.schedule.currentPhase.label}</p>
                {plan.schedule.currentPhase.progressLabel ? <p className="mt-0.5 text-sm text-forest-700/80">{plan.schedule.currentPhase.progressLabel}</p> : null}
              </div>
            ) : null}
            {plan.schedule.nextActivity ? (
              <div>
                <p className="text-sm font-semibold text-forest-700">Next activity</p>
                <p className="mt-1 font-bold leading-6 text-forest-700">{getNextActivitySummary(plan.schedule)}</p>
              </div>
            ) : null}
          </section>
        ) : null}

        <div className="grid gap-3">
          <section className="rounded-md bg-leaf-100/70 p-4" aria-labelledby={`advantage-${plan.id}`}>
            <h4 id={`advantage-${plan.id}`} className="text-sm font-bold text-leaf-700">Why choose this</h4>
            <p className="mt-1 text-sm leading-6 text-foreground">{plan.advantage}</p>
          </section>
          <section className="rounded-md bg-harvest-100/70 p-4" aria-labelledby={`tradeoff-${plan.id}`}>
            <h4 id={`tradeoff-${plan.id}`} className="text-sm font-bold text-harvest-700">What to consider</h4>
            <p className="mt-1 text-sm leading-6 text-foreground">{plan.tradeOff}</p>
          </section>
        </div>

        <section className="grid gap-2 border-t pt-4" aria-labelledby={`assumptions-${plan.id}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h4 id={`assumptions-${plan.id}`} className="font-bold">Assumptions and confidence</h4>
            <span className="text-sm text-muted-foreground">
              ±{plan.uncertainty.marginKg} kg · {plan.uncertainty.confidence} confidence
            </span>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{plan.uncertainty.reason}</p>
        </section>

        {!plan.feasibility.selectable ? (
          <p className="rounded-md bg-risk-100 p-3 font-semibold text-risk-700">{plan.feasibility.reasons.join(" ")}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
