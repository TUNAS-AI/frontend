import { MapPinned, UserRound } from "lucide-react";
import { getFarmSnapshot, type FarmSnapshot } from "@/api/farm";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCallback, useEffect, useState } from "react";

let cachedSnapshot: FarmSnapshot | null = null;

type FarmSnapshotPanelProps = {
  farmerName: string;
  snapshot?: FarmSnapshot;
  snapshotError?: string | null;
  snapshotLoading?: boolean;
  onRetry?: () => void;
};

export function FarmSnapshotPanel({ farmerName, snapshot, snapshotError, snapshotLoading, onRetry }: FarmSnapshotPanelProps) {
  const externallyManaged = snapshotLoading !== undefined;
  const [data, setData] = useState<FarmSnapshot | null>(() => snapshot ?? cachedSnapshot);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!externallyManaged && !snapshot && !cachedSnapshot);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nextSnapshot = await getFarmSnapshot();
      cachedSnapshot = nextSnapshot;
      setData(nextSnapshot);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not load your farm snapshot. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (externallyManaged || data) return;
    void load();
  }, [data, externallyManaged, load]);

  useEffect(() => {
    if (!snapshot) return;
    cachedSnapshot = snapshot;
    setData(snapshot);
  }, [snapshot]);

  const pending = externallyManaged ? Boolean(snapshotLoading) : loading;
  const failure = externallyManaged ? snapshotError : error;

  if (pending) return <FarmSnapshotPanelSkeleton />;
  if (failure || !data) {
    return <section aria-label="Farm snapshot" className="grid gap-3 rounded-lg border bg-card p-4 shadow-farm"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Farm snapshot</p><h2 className="mt-1 font-extrabold">Farm unavailable</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{failure || "We could not load your farm snapshot."}</p></div><Button type="button" size="sm" variant="outline" className="w-fit" onClick={onRetry ?? (() => void load())}>Retry</Button></section>;
  }

  return <section aria-label="Farm snapshot" className="overflow-hidden rounded-lg border border-forest-300/70 bg-card"><div className="bg-primary px-4 py-3 text-primary-foreground"><p className="flex items-center gap-2 text-sm font-bold text-white/85"><UserRound className="h-4 w-4 text-white/75" aria-hidden="true" />{farmerName}</p></div><div className="p-4"><h2 className="text-lg font-extrabold tracking-tight text-foreground">{data.farm.name}</h2><p className="mt-1 flex items-start gap-2 text-sm leading-5 text-muted-foreground"><MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />{data.farm.location || "Location not recorded"}</p></div></section>;
}

function FarmSnapshotPanelSkeleton() {
  return <section aria-label="Loading farm snapshot" className="motion-enter grid gap-4 rounded-lg border bg-card p-4" aria-busy="true" aria-live="polite"><span className="sr-only">Loading farm snapshot…</span><Skeleton className="h-5 w-36" /><Skeleton className="h-4 w-3/4" /></section>;
}
