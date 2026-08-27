import { todayPlaceholderData } from "@/api/today";
import { AppShell } from "@/components/app/AppShell";
import { productNavigationItems } from "@/components/app/productNavigation";
import { MissionContext } from "@/features/missions/components/MissionContext";
import { TodayAssistant } from "@/features/today/TodayAssistant";
import { TodayView } from "@/features/today/TodayView";

export function TodayRoute() {
  return (
    <AppShell
      activeItem="today"
      assistant={<TodayAssistant data={todayPlaceholderData} />}
      context={<MissionContext context={todayPlaceholderData.context} />}
      navigationItems={productNavigationItems}
    >
      <TodayView data={todayPlaceholderData} />
    </AppShell>
  );
}
