import { missionsListPlaceholderData } from "@/api/missions";
import { AppShell } from "@/components/app/AppShell";
import { productNavigationItems } from "@/components/app/productNavigation";
import { MissionsAssistant } from "@/features/missions/MissionsAssistant";
import { MissionsSummaryPanel } from "@/features/missions/components/MissionsSummaryPanel";
import { MissionsView } from "@/features/missions/MissionsView";

export function MissionsRoute() {
  return (
    <AppShell
      activeItem="missions"
      assistant={<MissionsAssistant data={missionsListPlaceholderData} />}
      context={<MissionsSummaryPanel data={missionsListPlaceholderData} />}
      contextLabel="Mission overview"
      navigationItems={productNavigationItems}
    >
      <MissionsView data={missionsListPlaceholderData} />
    </AppShell>
  );
}
