import { getDemoMissionOutcome } from "@/api/outcomes";
import { AppShell } from "@/components/app/AppShell";
import { productNavigationItems } from "@/components/app/productNavigation";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { OutcomeAssistant } from "@/features/outcomes/OutcomeAssistant";
import { OutcomeDetailView } from "@/features/outcomes/OutcomeDetailView";
import { OutcomeContext } from "@/features/outcomes/components/OutcomeContext";
import { SearchX } from "lucide-react";
import { Link, useParams } from "react-router";

export function OutcomeDetailRoute() {
  const { missionId = "" } = useParams();
  const outcome = getDemoMissionOutcome(missionId);
  return <AppShell activeItem="missions" assistant={outcome ? <OutcomeAssistant outcome={outcome} /> : undefined} context={outcome ? <OutcomeContext outcome={outcome} /> : undefined} contextLabel="Result context" navigationItems={productNavigationItems}>{outcome ? <OutcomeDetailView outcome={outcome} /> : <EmptyState icon={<SearchX className="h-6 w-6" />} title="Mission result unavailable" description="This placeholder build does not contain a confirmed result for that mission." action={<Button asChild><Link to="/missions">Back to missions</Link></Button>} />}</AppShell>;
}
