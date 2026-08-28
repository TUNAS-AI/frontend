import { useCallback, useEffect, useState } from "react";
import { getFarmSnapshot, type FarmSnapshot } from "@/api/farm";
import { AppShell } from "@/components/app/AppShell";
import { productNavigationItems } from "@/components/app/productNavigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { LoadingShell } from "@/components/ui/LoadingShell";
import { FarmView } from "@/features/farm/FarmView";
import { FarmContext } from "@/features/farm/components/FarmContext";

export function FarmRoute() {
  const [data, setData] = useState<FarmSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); setError(null); try { setData(await getFarmSnapshot()); } catch (reason) { setError(reason instanceof Error ? reason.message : "We could not load your farm. Try again."); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  return <AppShell activeItem="farm" context={data ? <FarmContext data={data} /> : undefined} contextLoading={loading} contextLabel="Farm at a glance" farmSnapshot={data ?? undefined} farmSnapshotError={error} farmSnapshotLoading={loading} navigationItems={productNavigationItems} onFarmSnapshotRetry={() => void load()}><>{loading ? <LoadingShell label="Loading farm…" /> : null}{error ? <Alert variant="danger" role="alert"><AlertTitle>Farm unavailable</AlertTitle><AlertDescription>{error}</AlertDescription><Button className="mt-3 w-fit" type="button" variant="outline" onClick={() => void load()}>Retry</Button></Alert> : null}{data && !loading ? <div className="motion-enter"><FarmView data={data} onRefresh={load} /></div> : null}</></AppShell>;
}
