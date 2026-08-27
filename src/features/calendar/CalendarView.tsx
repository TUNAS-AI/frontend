import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarCheck, CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, ShieldCheck } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { buildMonthGrid, formatDateLabel, formatMonthLabel, shiftMonth } from "./calendarUtils";
import type { ApprovedMissionEvent, CalendarPageData } from "./types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function EventPreview({ event }: { event: ApprovedMissionEvent }) {
  return (
    <span className={`block truncate rounded-sm border-l-2 px-2 py-1 text-xs font-bold ${event.conditional ? "border-harvest-500 bg-harvest-100/80 text-harvest-700" : "border-forest-500 bg-forest-50 text-forest-700"}`}>
      <span className="mr-1 tabular-nums">{event.startTime}</span>{event.title}
    </span>
  );
}

export function CalendarView({ data }: { data: CalendarPageData }) {
  const [visibleMonth, setVisibleMonth] = useState(data.initialMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const calendarDays = useMemo(() => buildMonthGrid(visibleMonth, data.referenceDate, data.events), [data.events, data.referenceDate, visibleMonth]);
  const selectedDay = selectedDate ? calendarDays.find((day) => day.date === selectedDate) : undefined;
  const monthLabel = visibleMonth === data.initialMonth ? data.monthLabel : formatMonthLabel(visibleMonth);

  useEffect(() => {
    document.title = "Calendar | TUNAS";
  }, []);

  function moveMonth(offset: number) {
    setSelectedDate(null);
    setVisibleMonth((current) => shiftMonth(current, offset));
  }

  function returnToReferenceDate() {
    setVisibleMonth(data.referenceDate.slice(0, 7));
    setSelectedDate(data.referenceDate);
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        badges={<><Badge variant="info">Simulated Calendar</Badge><Badge variant="source">Placeholder data</Badge></>}
        title={data.title}
        description={data.description}
        meta={<span className="flex flex-wrap items-center gap-x-5 gap-y-2"><span className="inline-flex items-center gap-2 font-semibold text-success-foreground"><ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />Only approved mission events appear</span><span>{data.freshness}</span></span>}
      />

      <section aria-labelledby="month-calendar-heading" className="grid gap-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Mission schedule</p>
            <h2 id="month-calendar-heading" className="mt-1 text-2xl font-extrabold tracking-tight" aria-live="polite">{monthLabel}</h2>
          </div>
          <div className="flex items-center gap-2" aria-label="Calendar month navigation">
            <Button type="button" size="icon" variant="outline" aria-label="Previous month" onClick={() => moveMonth(-1)}><ChevronLeft aria-hidden="true" /></Button>
            <Button type="button" size="sm" variant="outline" onClick={returnToReferenceDate}>Today</Button>
            <Button type="button" size="icon" variant="outline" aria-label="Next month" onClick={() => moveMonth(1)}><ChevronRight aria-hidden="true" /></Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border bg-card shadow-farm">
          <div className="min-w-[42rem]">
            <div className="grid grid-cols-7 border-b bg-muted/45" aria-hidden="true">
              {WEEKDAYS.map((weekday) => <div key={weekday} className="px-3 py-2.5 text-center text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{weekday}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const previewEvents = day.events.slice(0, 2);
                const moreCount = day.events.length - previewEvents.length;
                const isLastColumn = index % 7 === 6;
                const isLastRow = index >= calendarDays.length - 7;
                return (
                  <button
                    key={day.date}
                    type="button"
                    aria-current={day.isReferenceDate ? "date" : undefined}
                    aria-label={`${formatDateLabel(day.date)}. ${day.events.length} approved ${day.events.length === 1 ? "event" : "events"}. Open day details.`}
                    onClick={() => setSelectedDate(day.date)}
                    className={`group relative min-h-[8.5rem] min-w-0 p-2.5 text-left transition-colors duration-200 hover:bg-forest-50/55 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-ring/35 active:bg-forest-100/60 ${!isLastColumn ? "border-r" : ""} ${!isLastRow ? "border-b" : ""} ${day.isCurrentMonth ? "bg-card" : "bg-muted/20 text-muted-foreground"}`}
                  >
                    <span className={`absolute left-2.5 top-2.5 grid h-7 min-w-7 place-items-center rounded-md px-1 text-sm font-extrabold tabular-nums ${day.isReferenceDate ? "bg-forest-600 text-white" : "group-hover:text-forest-700"}`}>{day.dayNumber}</span>
                    {day.isReferenceDate ? <span className="absolute right-2.5 top-3 text-[10px] font-bold uppercase tracking-wide text-forest-700">Today</span> : null}
                    <span className="mt-9 grid gap-1">
                      {previewEvents.map((event) => <EventPreview key={event.id} event={event} />)}
                      {moreCount > 0 ? <span className="px-2 text-xs font-bold text-muted-foreground">+{moreCount} more</span> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-muted-foreground">
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-forest-500" />Scheduled</span>
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-harvest-500" />Conditional</span>
          <span>Times use {data.timezone}.</span>
        </div>
      </section>

      <Dialog open={selectedDate !== null} onOpenChange={(open) => { if (!open) setSelectedDate(null); }}>
        <DialogContent className="sm:max-w-3xl">
          {selectedDate ? (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info"><CalendarDays aria-hidden="true" />Day schedule</Badge>
                  <Badge variant="source">{selectedDay?.events.length ?? 0} approved {(selectedDay?.events.length ?? 0) === 1 ? "event" : "events"}</Badge>
                </div>
                <DialogTitle className="text-2xl">{formatDateLabel(selectedDate)}</DialogTitle>
                <DialogDescription>Review the approved mission work for this date. Opening the calendar does not change or approve the plan.</DialogDescription>
              </DialogHeader>

              {selectedDay?.events.length ? (
                <ol className="grid gap-3">
                  {selectedDay.events.map((event) => (
                    <li key={event.id} className="grid gap-3 rounded-lg bg-muted/35 p-4 sm:grid-cols-[5rem_minmax(0,1fr)]">
                      <div>
                        <p className="text-lg font-extrabold tabular-nums">{event.startTime}</p>
                        <p className="text-xs font-semibold tabular-nums text-muted-foreground">to {event.endTime}</p>
                      </div>
                      <article className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2"><Badge variant="success"><CalendarCheck aria-hidden="true" />Approved</Badge><Badge variant={event.conditional ? "warning" : "info"}>{event.conditional ? "Conditional" : "Scheduled"}</Badge></div>
                        <h3 className="mt-3 text-lg font-extrabold tracking-tight">{event.title}</h3>
                        <p className="mt-1 leading-6 text-muted-foreground">{event.detail}</p>
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t pt-3 text-sm font-semibold text-muted-foreground">
                          <span className="flex items-center gap-2"><Clock3 className="h-4 w-4" aria-hidden="true" />{event.startTime}–{event.endTime} {event.timezone}</span>
                          {event.blockLabel ? <span className="flex items-center gap-2"><MapPin className="h-4 w-4" aria-hidden="true" />{event.blockLabel}</span> : null}
                        </div>
                        <div className="mt-3 flex flex-col justify-between gap-3 border-t pt-3 sm:flex-row sm:items-center">
                          <div><p className="text-xs font-semibold text-muted-foreground">Linked approved mission</p><p className="font-bold">{event.missionTitle}</p><p className="text-xs text-muted-foreground">{event.approvalLabel}</p></div>
                          <Button asChild size="sm" variant="outline" trailingIcon={<ArrowRight aria-hidden="true" />}><Link to={`/missions/${event.missionId}`}>Open mission</Link></Button>
                        </div>
                      </article>
                    </li>
                  ))}
                </ol>
              ) : (
                <EmptyState icon={<CalendarDays className="h-6 w-6" />} title="No approved work scheduled" description="This date has no approved mission-linked events. Draft and unapproved work stays outside Calendar." />
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
