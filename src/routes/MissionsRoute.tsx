import { useCallback, useEffect, useState } from "react";
import { getMissions, type MissionListItem } from "@/api/missions";
import { AppShell } from "@/components/app/AppShell";
import { productNavigationItems } from "@/components/app/productNavigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { LoadingShell } from "@/components/ui/LoadingShell";
import { MissionsAtGlance } from "@/features/missions/MissionsAtGlance";
import { MissionsView } from "@/features/missions/MissionsView";

export function MissionsRoute() {
  const [missions, setMissions] = useState<MissionListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); setError(null); try { setMissions(await getMissions()); } catch (reason) { setError(reason instanceof Error ? reason.message : "We could not load missions. Try again."); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);

  return <AppShell activeItem="missions" context={!loading && !error ? <MissionsAtGlance missions={missions} /> : undefined} contextLoading={loading} contextLabel="Missions at a glance" navigationItems={productNavigationItems}>{loading ? <LoadingShell label="Loading missions…" /> : null}{error ? <Alert variant="danger" role="alert"><AlertTitle>Missions unavailable</AlertTitle><AlertDescription>{error}</AlertDescription><Button className="mt-3 w-fit" type="button" variant="outline" onClick={() => void load()}>Retry</Button></Alert> : null}{!loading && !error ? <div className="motion-enter"><MissionsView missions={missions} /></div> : null}</AppShell>;
}
