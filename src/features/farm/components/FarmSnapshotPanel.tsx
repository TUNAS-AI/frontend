import { Layers3, MapPinned, Sprout, UserRound } from "lucide-react";
import { Link } from "react-router";
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
  showBrand?: boolean;
};

export function FarmSnapshotPanel({ farmerName, snapshot, snapshotError, snapshotLoading, onRetry, showBrand = true }: FarmSnapshotPanelProps) {
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

  return <section aria-label="Farm snapshot" className="overflow-hidden rounded-lg border border-forest-300/70 bg-card shadow-farm"><div className="bg-primary px-4 py-3 text-primary-foreground">{showBrand ? <div className="flex items-center"><img src="/images/tunas-ai-logo-white.png" alt="TUNAS" className="h-7 w-auto object-contain" /></div> : null}<p className={`${showBrand ? "mt-2" : ""} flex items-center gap-2 text-sm font-bold text-white/85`}><UserRound className="h-4 w-4 text-white/75" aria-hidden="true" />{farmerName}</p></div><div className="grid gap-4 p-4"><div><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Farm snapshot</p><h2 className="mt-1 text-lg font-extrabold tracking-tight text-foreground">{data.farm.name}</h2><p className="mt-1 flex items-start gap-2 text-sm leading-5 text-muted-foreground"><MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />{data.farm.location || "Location not recorded"}</p></div><dl className="grid grid-cols-2 gap-3 border-y py-3"><SnapshotMetric icon={<Layers3 aria-hidden="true" />} label="Field blocks" value={data.fieldBlocks.length} /><SnapshotMetric icon={<Sprout aria-hidden="true" />} label="Crop batches" value={data.cropBatches.length} /></dl><Button asChild type="button" size="sm" variant="outline" className="w-full"><Link to="/farm">Manage farm</Link></Button></div></section>;
}

function SnapshotMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="min-w-0"><dt className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">{icon}{label}</dt><dd className="mt-1 text-2xl font-extrabold tabular-nums text-foreground">{value}</dd></div>;
}

function FarmSnapshotPanelSkeleton() {
  return <section aria-label="Loading farm snapshot" className="motion-enter grid gap-4 rounded-lg border bg-card p-4 shadow-farm" aria-busy="true" aria-live="polite"><span className="sr-only">Loading farm snapshot…</span><div className="grid gap-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-5 w-36" /></div><div className="grid gap-2 border-y py-4"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2" /></div><div className="grid grid-cols-2 gap-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div><Skeleton className="h-9 w-full" /></section>;
}
