import type { CalendarPageData } from "@/features/calendar/types";

export const DEMO_CALENDAR_DATA: CalendarPageData = {
  sourceLabel: "Simulated Calendar · Placeholder data",
  title: "Calendar",
  description: "Review scheduled work created from explicitly approved missions. Drafts, interpretations, and unapproved plans do not appear here.",
  initialMonth: "2026-07",
  monthLabel: "July 2026",
  referenceDate: "2026-07-14",
  timezone: "Asia/Jakarta · WIB (UTC+7)",
  freshness: "Updated 14 July 2026 at 08:30 WIB · No external calendar connection",
  events: [
    { id: "event-clear-secondary", missionId: "mission-drainage-recovery", missionTitle: "Stabilize drainage after heavy rain", title: "Clear secondary drainage channel", detail: "Continue the approved drainage step without disturbing crop rows.", date: "2026-07-14", dateLabel: "Tuesday, 14 July", startTime: "07:30", endTime: "09:30", timezone: "WIB", blockLabel: "North Block", approvalLabel: "Approved recovery plan", approvalStatus: "approved", conditional: false },
    { id: "event-recheck-water", missionId: "mission-drainage-recovery", missionTitle: "Stabilize drainage after heavy rain", title: "Recheck standing water", detail: "Confirm whether the affected area is draining before crop reassessment.", date: "2026-07-14", dateLabel: "Tuesday, 14 July", startTime: "10:30", endTime: "11:00", timezone: "WIB", blockLabel: "North Block", approvalLabel: "Approved recovery plan", approvalStatus: "approved", conditional: false },
    { id: "event-record-condition", missionId: "mission-drainage-recovery", missionTitle: "Stabilize drainage after heavy rain", title: "Record crop condition", detail: "Add an observation only after the water-level recheck is complete.", date: "2026-07-14", dateLabel: "Tuesday, 14 July", startTime: "15:30", endTime: "16:00", timezone: "WIB", blockLabel: "North Block", approvalLabel: "Approved recovery plan", approvalStatus: "approved", conditional: true },
    { id: "event-drainage-followup", missionId: "mission-drainage-recovery", missionTitle: "Stabilize drainage after heavy rain", title: "Review drainage recovery outcome", detail: "Compare the final field observation with the condition recorded when execution began.", date: "2026-07-15", dateLabel: "Wednesday, 15 July", startTime: "07:00", endTime: "07:30", timezone: "WIB", blockLabel: "North Block", approvalLabel: "Approved recovery plan", approvalStatus: "approved", conditional: true },
  ],
  assistant: {
    contextLabel: "Approved events loaded",
    starterMessage: "Ask what is scheduled, which mission an event belongs to, or why a conditional event may not proceed.",
    responses: [
      { id: "today", keywords: ["today", "14", "scheduled", "next"], text: "Three approved placeholder events are scheduled for 14 July. The drainage channel step begins at 07:30 WIB, the water recheck is at 10:30 WIB, and the conditional crop observation is at 15:30 WIB." },
      { id: "conditional", keywords: ["conditional", "condition", "why"], text: "The crop-condition event proceeds only after standing water is rechecked. The next-day outcome review also depends on updated field evidence." },
      { id: "mission", keywords: ["mission", "drainage", "linked"], text: "All visible placeholder events belong to the approved mission ‘Stabilize drainage after heavy rain’. Open the mission from an event to review its plan and execution state." },
      { id: "external", keywords: ["google", "external", "sync", "real"], text: "This is a Simulated Calendar. It has no Google Calendar connection and creates no external events." },
    ],
    fallbackResponse: "This Simulated Calendar shows four approved mission-linked placeholder events across 14 and 15 July 2026. Unapproved work is intentionally excluded.",
  },
};
