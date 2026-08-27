import { getDemoMissionDetail } from "@/api/missions";
import { AppShell } from "@/components/app/AppShell";
import { productNavigationItems } from "@/components/app/productNavigation";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { MissionDetailAssistant } from "@/features/missions/MissionDetailAssistant";
import { MissionDetailView } from "@/features/missions/MissionDetailView";
import { MissionDetailContext } from "@/features/missions/components/MissionDetailContext";
import type { MissionDetailPageData } from "@/features/missions/detailTypes";
import { useMissionExecution } from "@/features/missions/useMissionExecution";
import { useMissionCloseout } from "@/features/missions/useMissionCloseout";
import { SearchX } from "lucide-react";
import { Link, useParams } from "react-router";

export function MissionDetailRoute() {
  const { missionId = "" } = useParams();
  const data = getDemoMissionDetail(missionId);

  if (data) return <AvailableMissionDetail data={data} />;

  return (
    <AppShell
      activeItem="missions"
      contextLabel="Mission context"
      navigationItems={productNavigationItems}
    >
      <EmptyState
          icon={<SearchX className="h-6 w-6" />}
          title="Mission detail unavailable"
          description="This placeholder build does not contain a mission with that identifier. Return to the mission list to open an available record."
          action={<Button asChild><Link to="/missions">Back to missions</Link></Button>}
        />
    </AppShell>
  );
}

function AvailableMissionDetail({ data }: { data: MissionDetailPageData }) {
  const execution = useMissionExecution(data);
  const closeout = useMissionCloseout();

  return (
    <AppShell
      activeItem="missions"
      assistant={<MissionDetailAssistant data={data} onRequestCloseout={closeout.requestCloseout} onReportNotDone={execution.reportLatestAssumedTaskIncomplete} onRequestMove={execution.requestMoveForNextTask} />}
      context={<MissionDetailContext data={data} />}
      contextLabel="Mission context"
      navigationItems={productNavigationItems}
    >
      <MissionDetailView closeoutClosed={closeout.closed} closeoutRequested={closeout.requested} closeoutResult={closeout.result} data={data} latestAssumedTask={execution.latestAssumedTask} nextTask={execution.nextTask} onConfirmCloseout={closeout.confirmCloseout} steps={execution.steps} />
    </AppShell>
  );
}
