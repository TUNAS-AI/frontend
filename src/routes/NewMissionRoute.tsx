import { AppShell } from "@/components/app/AppShell";
import { productNavigationItems } from "@/components/app/productNavigation";
import { MissionCreationView } from "@/features/missions/MissionCreationView";

export function NewMissionRoute() {
  return <AppShell activeItem="missions" navigationItems={productNavigationItems}><MissionCreationView /></AppShell>;
}
