import { ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { getCalendarMissionSteps, type CalendarMissionStep } from "@/api/missions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingShell } from "@/components/ui/LoadingShell";
import { PageHeader } from "@/components/ui/PageHeader";

const monthFormat = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });
const weekdayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const addDays = (date: Date, amount: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);

function monthBounds(month: Date) { return { from: new Date(month.getFullYear(), month.getMonth(), 1), to: new Date(month.getFullYear(), month.getMonth() + 1, 0) }; }
function monthDays(month: Date) {
  const { from, to } = monthBounds(month); const start = addDays(from, -from.getDay()); const end = addDays(to, 6 - to.getDay());
  return Array.from({ length: Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1 }, (_, index) => addDays(start, index));
}

export function CalendarView() {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [steps, setSteps] = useState<CalendarMissionStep[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const bounds = useMemo(() => monthBounds(month), [month]); const days = useMemo(() => monthDays(month), [month]);
  const load = useCallback(async () => { setLoading(true); setError(null); try { setSteps(await getCalendarMissionSteps(dateKey(bounds.from), dateKey(bounds.to))); } catch (reason) { setError(reason instanceof Error ? reason.message : "We could not load the calendar. Try again."); } finally { setLoading(false); } }, [bounds.from, bounds.to]);
  useEffect(() => { void load(); }, [load]);
  const eventsFor = (date: Date) => { const key = dateKey(date); return steps.filter((step) => step.startsOn.slice(0, 10) <= key && step.endsOn.slice(0, 10) >= key); };
  return <div className="grid gap-6"><PageHeader eyebrow="Approved mission work" title="Calendar" description="Pending harvest and drying actions from every approved mission. Google Calendar sync is not active." actions={<div className="flex items-center gap-2"><Button type="button" variant="outline" size="icon" aria-label="Previous month" onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))} icon={<ChevronLeft aria-hidden="true" />} /><Button type="button" variant="outline" size="icon" aria-label="Next month" onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))} icon={<ChevronRight aria-hidden="true" />} /></div>} />
    <section className="overflow-hidden rounded-lg border bg-card shadow-sm" aria-label={`${monthFormat.format(month)} calendar`}>
      <h2 className="border-b px-5 py-4 text-xl font-extrabold">{monthFormat.format(month)}</h2>
      {loading ? <div className="p-5"><LoadingShell label="Loading pending actions…" /></div> : null}
      {error ? <Alert className="m-5" variant="danger" role="alert"><AlertTitle>Calendar unavailable</AlertTitle><AlertDescription>{error}</AlertDescription><Button className="mt-3" type="button" variant="outline" onClick={() => void load()}>Retry</Button></Alert> : null}
      {!loading && !error && !steps.length ? <div className="p-5"><EmptyState icon={<Clock3 className="h-6 w-6" />} title="No pending actions this month" description="Approved harvest and drying steps will appear here when they are scheduled." /></div> : null}
      {!loading && !error && steps.length ? <><div className="grid grid-cols-7 border-b bg-muted/35">{days.slice(0, 7).map((day) => <div key={day.getDay()} className="px-1 py-2 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground sm:px-3">{weekdayFormat.format(day)}</div>)}</div><div className="grid grid-cols-7">{days.map((day) => <DayCell key={dateKey(day)} date={day} inMonth={day.getMonth() === month.getMonth()} events={eventsFor(day)} />)}</div></> : null}
    </section>
  </div>;
}

function DayCell({ date, inMonth, events }: { date: Date; inMonth: boolean; events: CalendarMissionStep[] }) {
  return <div className={`min-h-28 border-b border-r p-1.5 sm:min-h-36 sm:p-2 ${inMonth ? "bg-card" : "bg-muted/25 text-muted-foreground"}`}><p className="mb-1 text-sm font-bold tabular-nums">{date.getDate()}</p><div className="grid gap-1">{events.map((event) => <Link key={event.missionStepId} to={`/missions/${event.missionId}`} className="grid gap-0.5 rounded border border-ai-100 bg-ai-50 p-1.5 text-left text-[11px] font-semibold leading-4 text-ai-700 hover:bg-ai-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 sm:text-xs"><span className="line-clamp-2">{event.title}</span><span className="font-medium text-ai-700/80">{event.windowStart && event.windowEnd ? `${event.windowStart}–${event.windowEnd}` : "All day"}</span><Badge className="min-h-0 px-1.5 py-0 text-[10px]" variant={event.status === "IN_PROGRESS" ? "info" : "ai"}>{event.status === "IN_PROGRESS" ? "In progress" : event.stage === "HARVESTING" ? "Harvest" : "Drying"}</Badge></Link>)}</div></div>;
}
