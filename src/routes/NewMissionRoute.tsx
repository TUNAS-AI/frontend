import { missionDemoContext } from "@/api/missions";
import { AppShell } from "@/components/app/AppShell";
import { productNavigationItems } from "@/components/app/productNavigation";
import { MissionContext } from "@/features/missions/components/MissionContext";
import { MissionCreationView } from "@/features/missions/MissionCreationView";

export function NewMissionRoute() {
  return <AppShell activeItem="new" context={<MissionContext context={missionDemoContext} />} navigationItems={productNavigationItems}><MissionCreationView /></AppShell>;
}
