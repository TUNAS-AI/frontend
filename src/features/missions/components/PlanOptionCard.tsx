import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { RiskIndicator } from "@/components/ui/RiskIndicator";
import { cn } from "@/utils/cn";
import { getMissionScheduleSummary } from "../missionSchedule";
import type { HarvestPlan } from "../types";

type PlanOptionCardProps = {
  plan: HarvestPlan;
  position: number;
  selected: boolean;
  onSelect: () => void;
};

export function PlanOptionCard({ plan, position, selected, onSelect }: PlanOptionCardProps) {
  const scheduleSummary = getMissionScheduleSummary(plan.schedule);

  return (
    <button
      type="button"
      disabled={!plan.feasibility.selectable}
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "group w-full rounded-lg border bg-card p-4 text-left transition duration-200",
        "hover:-translate-y-0.5 hover:border-forest-400 hover:bg-forest-50/40",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30",
        "active:translate-y-0 disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-65 disabled:hover:translate-y-0",
        selected && "border-forest-500 bg-forest-50/70 ring-2 ring-forest-500/20",
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Strategy {String(position).padStart(2, "0")}
          </span>
          <span className="mt-1 block text-lg font-bold leading-tight text-foreground">
            {plan.name}
          </span>
        </span>
        {selected ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-forest-700" aria-hidden="true" /> : null}
      </span>

      <span className="mt-2 block text-sm leading-6 text-muted-foreground">{plan.summary}</span>

      <span className="mt-4 grid grid-cols-2 gap-2 border-t pt-3">
        <span>
          <span className="block text-xs font-semibold text-muted-foreground">Expected</span>
          <span className="mt-0.5 block font-bold tabular-nums text-foreground">
            {plan.saleableQuantity.min}-{plan.saleableQuantity.max} {plan.saleableQuantity.unit}
          </span>
        </span>
        <span>
          <span className="block text-xs font-semibold text-muted-foreground">{scheduleSummary.label}</span>
          <span className="mt-0.5 block font-bold tabular-nums text-foreground">
            {scheduleSummary.value}
          </span>
        </span>
      </span>

      <span className="mt-3 flex flex-wrap items-center gap-2">
        {plan.recommended ? <Badge variant="ai">Recommended</Badge> : null}
        {!plan.feasibility.selectable ? <Badge variant="danger">Cannot select</Badge> : null}
        <RiskIndicator level={plan.rainExposure} label={`Rain: ${plan.rainExposure}`} />
        <RiskIndicator level={plan.deadlineRisk} label={`Deadline: ${plan.deadlineRisk}`} />
      </span>
    </button>
  );
}
