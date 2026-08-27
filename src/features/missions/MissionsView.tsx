import { useMemo, useState } from "react";
import { ClipboardList, Plus } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { MissionListCard } from "./components/MissionListCard";
import type { MissionsPageData } from "./listTypes";

export function MissionsView({ data }: { data: MissionsPageData }) {
  const [filterId, setFilterId] = useState(data.filters[0]?.id ?? "all");
  const selectedFilter = data.filters.find((filter) => filter.id === filterId) ?? data.filters[0];
  const visibleMissions = useMemo(
    () => selectedFilter ? data.missions.filter((mission) => selectedFilter.statuses.includes(mission.status)) : data.missions,
    [data.missions, selectedFilter],
  );

  return (
    <div className="grid gap-5">
      <PageHeader
        badges={<><Badge variant="info">Missions</Badge><Badge variant="source">{data.sourceBadge}</Badge></>}
        title={data.title}
        description={data.description}
        meta={data.freshness}
        actions={<Button asChild icon={<Plus aria-hidden="true" />}><Link to={data.primaryAction.href}>{data.primaryAction.label}</Link></Button>}
      />

      <section aria-labelledby="mission-list-heading" className="grid gap-4">
        <div className="grid gap-3">
          <div><h2 id="mission-list-heading" className="text-xl font-extrabold">Mission work list</h2><p className="mt-1 text-sm text-muted-foreground">Filter by lifecycle status. Mission-specific values below are placeholder records.</p></div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter missions by status">
            {data.filters.map((filter) => {
              const selected = filter.id === filterId;
              const count = data.missions.filter((mission) => filter.statuses.includes(mission.status)).length;
              return <Button key={filter.id} type="button" size="sm" variant={selected ? "primary" : "outline"} aria-pressed={selected} onClick={() => setFilterId(filter.id)}>{filter.label} <span aria-hidden="true">({count})</span></Button>;
            })}
          </div>
          <p className="sr-only" aria-live="polite">Showing {visibleMissions.length} missions for {selectedFilter?.label ?? "all"}.</p>
        </div>

        {visibleMissions.length ? (
          <div className="grid gap-4">{visibleMissions.map((mission) => <MissionListCard key={mission.id} mission={mission} />)}</div>
        ) : (
          <EmptyState icon={<ClipboardList className="h-6 w-6" />} title={data.emptyState.title} description={data.emptyState.description} action={<Button type="button" variant="outline" onClick={() => setFilterId(data.filters[0]?.id ?? "all")}>Show all missions</Button>} />
        )}
      </section>
    </div>
  );
}
