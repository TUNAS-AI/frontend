import { useParams } from "react-router";
import { AppShell } from "@/components/app/AppShell";
import { productNavigationItems } from "@/components/app/productNavigation";
import { MissionCreationView } from "@/features/missions/MissionCreationView";

export function EditMissionRoute() {
  const { missionId } = useParams();
  return <AppShell activeItem="missions" navigationItems={productNavigationItems}>{missionId ? <MissionCreationView missionId={missionId} /> : null}</AppShell>;
}
