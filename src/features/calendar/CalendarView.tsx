import { ChevronLeft, ChevronRight, Clock3, Link2, ListTodo, Unlink } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { beginGoogleCalendarConnection, disconnectGoogleCalendar, getGoogleCalendarStatus, syncGoogleCalendar, type GoogleCalendarStatus } from "@/api/googleCalendar";
import { getCalendarMissionSteps, type CalendarMissionStep } from "@/api/missions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { GoogleCalendarMark } from "@/components/ui/GoogleCalendarMark";
import { LoadingShell } from "@/components/ui/LoadingShell";
import { PageHeader } from "@/components/ui/PageHeader";

const monthFormat = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });
const weekdayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
const agendaDateFormat = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" });
const rangeDateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const addDays = (date: Date, amount: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
function monthBounds(month: Date) { return { from: new Date(month.getFullYear(), month.getMonth(), 1), to: new Date(month.getFullYear(), month.getMonth() + 1, 0) }; }
function monthDays(month: Date) { const { from, to } = monthBounds(month); const start = addDays(from, -from.getDay()); const end = addDays(to, 6 - to.getDay()); return Array.from({ length: Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1 }, (_, index) => addDays(start, index)); }
function monthFromQuery(value: string | null) { const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value ?? ""); return match ? new Date(Number(match[1]), Number(match[2]) - 1, 1) : null; }
function monthKey(month: Date) { return `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`; }
function eventsForDate(steps: CalendarMissionStep[], key: string) { return steps.filter((step) => step.startsOn.slice(0, 10) <= key && step.endsOn.slice(0, 10) >= key); }
function taskTime(step: CalendarMissionStep) {
  if (step.scheduleType === "DAILY_WINDOW" && step.windowStart && step.windowEnd) return `${step.windowStart}–${step.windowEnd}`;
  return taskRange(step);
}
function taskRange(step: CalendarMissionStep) { const from = new Date(`${step.startsOn.slice(0, 10)}T00:00:00`); const to = new Date(`${step.endsOn.slice(0, 10)}T00:00:00`); return dateKey(from) === dateKey(to) ? rangeDateFormat.format(from) : `${rangeDateFormat.format(from)}–${rangeDateFormat.format(to)}`; }

export function CalendarView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [month, setMonth] = useState(() => monthFromQuery(searchParams.get("month")) ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [steps, setSteps] = useState<CalendarMissionStep[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<GoogleCalendarStatus | null>(null); const [connectionError, setConnectionError] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [disconnectOpen, setDisconnectOpen] = useState(false); const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [desktopAgenda, setDesktopAgenda] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches);
  const handledCallback = useRef<string | null>(null);
  const days = useMemo(() => monthDays(month), [month]);
  const load = useCallback(async () => { setLoading(true); setError(null); try { setSteps(await getCalendarMissionSteps(dateKey(days[0]), dateKey(days[days.length - 1]))); } catch (reason) { setError(reason instanceof Error ? reason.message : "We could not load the calendar. Try again."); } finally { setLoading(false); } }, [days]);
  const loadConnection = useCallback(async () => { try { setConnection(await getGoogleCalendarStatus()); } catch (reason) { setConnectionError(reason instanceof Error ? reason.message : "We could not load Google Calendar status."); } }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { void loadConnection(); }, [loadConnection]);
  useEffect(() => { const refresh = () => void load(); window.addEventListener("focus", refresh); return () => window.removeEventListener("focus", refresh); }, [load]);
  useEffect(() => { setSearchParams((current) => { const next = new URLSearchParams(current); next.set("month", monthKey(month)); return next; }, { replace: true }); }, [month, setSearchParams]);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    const updateAgendaPresentation = () => setDesktopAgenda(query.matches);
    updateAgendaPresentation();
    query.addEventListener("change", updateAgendaPresentation);
    return () => query.removeEventListener("change", updateAgendaPresentation);
  }, []);
  useEffect(() => {
    const callback = searchParams.get("calendar");
    if (!callback || handledCallback.current === callback) return;
    handledCallback.current = callback;
    if (callback === "connected") toast.success("Google Calendar connected", { description: "Your active approved schedule is syncing now." });
    if (callback === "error") toast.error("Google Calendar was not connected", { description: "Check the permission request and try again." });
    setSearchParams((current) => { const next = new URLSearchParams(current); next.delete("calendar"); return next; }, { replace: true });
  }, [searchParams, setSearchParams]);
  const agendaDay = days.find((day) => dateKey(day) === selectedDate) ?? null;
  const agendaEvents = selectedDate ? eventsForDate(steps, selectedDate) : [];

  async function connect() { setBusy(true); setConnectionError(null); try { const { authorizationUrl } = await beginGoogleCalendarConnection(); window.location.assign(authorizationUrl); } catch (reason) { setConnectionError(reason instanceof Error ? reason.message : "We could not start Google Calendar connection."); setBusy(false); } }
  async function sync() { setBusy(true); setConnectionError(null); try { const result = await syncGoogleCalendar(); await load(); if (result.failed) setConnectionError(result.failureReason ?? `${result.failed} schedule item${result.failed === 1 ? "" : "s"} could not sync. Try again.`); else toast.success("Google Calendar is up to date"); } catch (reason) { setConnectionError(reason instanceof Error ? reason.message : "We could not sync Google Calendar."); } finally { setBusy(false); } }
  async function disconnect() { setBusy(true); setConnectionError(null); try { const result = await disconnectGoogleCalendar(); setConnection({ connected: false, calendarName: null }); setDisconnectOpen(false); if (result.failed) toast.warning("Google Calendar disconnected", { description: `${result.failed} TUNAS event${result.failed === 1 ? "" : "s"} could not be removed.` }); else toast.success("Google Calendar disconnected", { description: result.removed ? `${result.removed} TUNAS event${result.removed === 1 ? "" : "s"} removed.` : undefined }); } catch (reason) { setConnectionError(reason instanceof Error ? reason.message : "We could not disconnect Google Calendar."); } finally { setBusy(false); } }

  return <div className="grid gap-6"><PageHeader eyebrow="Approved mission work" title="Calendar" description="Approved schedules are saved here whether or not you connect Google Calendar. Google is optional, and personal events are never shown." />
    <section className="grid gap-3 rounded-lg border bg-card px-4 py-3 shadow-sm sm:flex sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted"><GoogleCalendarMark aria-hidden="true" /></span><div className="min-w-0"><p className="font-bold">{connection?.connected ? "Google Calendar connected" : "Google Calendar (optional)"}</p><p className="text-sm text-muted-foreground sm:truncate">{connection?.connected ? `Syncing approved schedules to ${connection.calendarName}.` : "Connect to also send approved schedules to your primary calendar."}</p></div></div><div className="grid w-full shrink-0 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-1">{connection?.connected ? <><Button className="w-full sm:w-auto" type="button" variant="outline" size="sm" disabled={busy} isLoading={busy} loadingLabel="Syncing Google Calendar" onClick={() => void sync()} icon={<Link2 aria-hidden="true" />}>Sync now</Button><Button className="w-full sm:w-auto" type="button" variant="ghost" size="sm" disabled={busy} onClick={() => setDisconnectOpen(true)} icon={<Unlink aria-hidden="true" />}>Disconnect</Button></> : <Button className="w-full sm:w-auto" type="button" size="sm" disabled={busy} isLoading={busy} loadingLabel="Opening Google" onClick={() => void connect()} icon={<GoogleCalendarMark aria-hidden="true" />}>Connect Google Calendar</Button>}</div></section>
    {connectionError ? <Alert variant="danger" role="alert"><AlertTitle>Google Calendar needs attention</AlertTitle><AlertDescription>{connectionError}</AlertDescription></Alert> : null}
    <section className="overflow-hidden rounded-lg border bg-card shadow-sm" aria-label={`${monthFormat.format(month)} calendar`}><div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5"><h2 className="text-lg font-extrabold sm:text-xl">{monthFormat.format(month)}</h2><div className="flex items-center gap-1"><Button type="button" variant="ghost" size="icon" aria-label="Previous month" onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))} icon={<ChevronLeft aria-hidden="true" />} /><Button type="button" variant="ghost" size="icon" aria-label="Next month" onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))} icon={<ChevronRight aria-hidden="true" />} /></div></div>{loading ? <div className="p-5"><LoadingShell label="Loading scheduled work…" /></div> : null}{error ? <Alert className="m-5" variant="danger" role="alert"><AlertTitle>Calendar unavailable</AlertTitle><AlertDescription>{error}</AlertDescription><Button className="mt-3" type="button" variant="outline" onClick={() => void load()}>Retry</Button></Alert> : null}{!loading && !error ? <><div className="grid grid-cols-7 border-b bg-muted/35">{days.slice(0, 7).map((day) => <div key={day.getDay()} className="px-1 py-2 text-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground sm:px-3 sm:text-xs">{weekdayFormat.format(day)}</div>)}</div><div className="grid grid-cols-7">{days.map((day) => <DayCell key={dateKey(day)} date={day} inMonth={day.getMonth() === month.getMonth()} selected={selectedDate === dateKey(day)} events={eventsForDate(steps, dateKey(day))} onSelect={() => setSelectedDate(dateKey(day))} />)}</div>{!steps.length ? <p className="border-t px-4 py-3 text-center text-sm text-muted-foreground">No approved work is scheduled this month. Select a date to view its agenda.</p> : null}</> : null}</section>
    {agendaDay ? <section className="motion-enter grid gap-4 rounded-lg border bg-card p-4 shadow-sm sm:hidden" aria-live="polite"><div className="grid gap-1"><h2 className="text-lg font-extrabold">Agenda · {agendaDateFormat.format(agendaDay)}</h2><p className="text-sm leading-6 text-muted-foreground">{agendaEvents.length ? "Approved harvest and drying work for this day." : "No approved work is scheduled for this day."}</p></div><CalendarAgenda events={agendaEvents} /></section> : null}
    <Dialog open={desktopAgenda && Boolean(agendaDay)} onOpenChange={(open) => { if (!open) setSelectedDate(null); }}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>{agendaDay ? `Agenda · ${agendaDateFormat.format(agendaDay)}` : "Daily agenda"}</DialogTitle><DialogDescription>{agendaEvents.length ? "Approved harvest and drying work for this day." : "No approved work is scheduled for this day."}</DialogDescription></DialogHeader><CalendarAgenda events={agendaEvents} /></DialogContent></Dialog>
    <AlertDialog open={disconnectOpen} onOpenChange={setDisconnectOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Disconnect Google Calendar?</AlertDialogTitle><AlertDialogDescription>TUNAS will remove its saved events from Google Calendar, then stop future syncs and remove its stored connection.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Keep connected</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={busy} onClick={() => void disconnect()}>Disconnect</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

function CalendarAgenda({ events }: { events: CalendarMissionStep[] }) {
  return events.length ? <ol className="grid gap-3">{events.map((event) => <li key={event.missionStepId} className="grid gap-3 rounded-lg border bg-muted/25 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div className="grid gap-1"><h3 className="font-bold">{event.title}</h3><p className="text-sm text-muted-foreground">{taskRange(event)} · {taskTime(event)}</p></div><Badge variant={event.status === "IN_PROGRESS" ? "info" : event.stage === "HARVESTING" ? "success" : "ai"}>{event.status === "IN_PROGRESS" ? "In progress" : event.stage === "HARVESTING" ? "Harvest" : "Drying"}</Badge></div><p className="text-sm leading-6 text-muted-foreground">{event.description}</p><Link to={`/missions/${event.missionId}`} className="flex w-fit items-center gap-1.5 text-sm font-bold text-primary underline-offset-4 hover:underline"><ListTodo className="h-4 w-4" aria-hidden="true" />Open mission</Link></li>)}</ol> : <EmptyState className="border-0 bg-muted/25 py-7" icon={<Clock3 className="h-6 w-6" />} title="No scheduled work" description="This date has no approved harvest or drying tasks." />;
}

function DayCell({ date, events, inMonth, onSelect, selected }: { date: Date; events: CalendarMissionStep[]; inMonth: boolean; onSelect: () => void; selected: boolean }) {
  return <button type="button" aria-label={`${date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}${events.length ? `, ${events.length} scheduled task${events.length === 1 ? "" : "s"}` : ", no scheduled tasks"}`} aria-pressed={selected} onClick={onSelect} className={`min-h-16 overflow-hidden border-b border-r p-1 text-left transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 sm:min-h-[5rem] sm:p-2 ${inMonth ? "bg-card hover:bg-field-50/60" : "bg-muted/25 text-muted-foreground hover:bg-muted/45"} ${selected ? "bg-field-100 ring-2 ring-inset ring-primary/35" : ""}`}><span className="mb-1 flex items-center justify-between"><span className="text-sm font-bold tabular-nums">{date.getDate()}</span>{events.length ? <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary sm:hidden">{events.length}</span> : null}</span><span className="hidden gap-1 sm:grid">{events.map((event) => <span key={event.missionStepId} className={`break-words rounded px-1.5 py-1 text-[11px] font-semibold leading-4 ${event.stage === "HARVESTING" ? "bg-leaf-100 text-leaf-700" : "bg-ai-50 text-ai-700"}`}>{event.title}</span>)}</span></button>;
}
