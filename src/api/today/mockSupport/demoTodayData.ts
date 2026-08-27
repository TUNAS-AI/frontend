import { DEMO_CONTEXT } from "@/api/missions/mockSupport/demoMissionData";
import { DEMO_MISSIONS_LIST_DATA } from "@/api/missions/mockSupport/demoMissionsListData";
import { DEMO_FARM_DATA } from "@/api/farm/mockSupport/demoFarmData";
import { DEMO_CALENDAR_DATA } from "@/api/calendar/mockSupport/demoCalendarData";
import { DEMO_MISSION_OUTCOMES } from "@/api/outcomes/mockSupport/demoOutcomesData";
import type { TodayPageData } from "@/features/today/types";

const approvalMission = DEMO_MISSIONS_LIST_DATA.missions.find((mission) => mission.id === "mission-east-chili-harvest");
const activeMission = DEMO_MISSIONS_LIST_DATA.missions.find((mission) => mission.id === "mission-drainage-recovery");
const latestObservation = DEMO_FARM_DATA.observations[0];
const nextApprovedEvent = DEMO_CALENDAR_DATA.events.find((event) => event.date === "2026-07-14" && event.startTime === "15:30");
const recentOutcome = DEMO_MISSION_OUTCOMES[0];

if (!approvalMission || !activeMission || !latestObservation || !nextApprovedEvent || !recentOutcome) {
  throw new Error("Today placeholder sources are incomplete.");
}

export const DEMO_TODAY_DATA: TodayPageData = {
  context: DEMO_CONTEXT,
  header: {
    badges: [
      { id: "today", label: "Today", tone: "info" },
      { id: "source", label: "Placeholder data", tone: "source" },
    ],
    greeting: "Good afternoon · Sari Tani Farm",
    title: "Two mission items need your attention.",
    description: "Review the unapproved buyer mission and check the remaining task in the active drainage plan. Supporting farm, Calendar, and Result records are summarized below.",
  },
  attentionMission: {
    id: "mission-east-chili-harvest",
    status: { label: approvalMission.statusLabel, tone: "warning" },
    title: approvalMission.title,
    description: approvalMission.description,
    riskLabel: approvalMission.riskLabel,
    metrics: [
      { id: "buyer-target", label: "Buyer target", value: "80 kg", detail: "Market quality A" },
      { id: "deadline", label: "Deadline", value: "15 July", detail: "14:00 · WIB" },
      { id: "constraint", label: "Main constraint", value: "Rain", detail: "Estimated before noon" },
    ],
    action: { label: "Review mission", href: "/missions/new" },
    notice: "This mission is not approved. It has no Calendar event.",
  },
  signals: {
    title: "Connected records for today",
    description: "These summaries are composed from the same typed Farm, approved Calendar, and Results placeholder sources used by their full pages.",
    items: [
      { id: "field", label: "Latest field observation", value: latestObservation.title, detail: `North Block · ${latestObservation.sourceLabel}`, icon: "field", tone: "warning", toneLabel: "Recheck needed" },
      { id: "calendar", label: "Next approved event", value: nextApprovedEvent.title, detail: `${nextApprovedEvent.startTime}–${nextApprovedEvent.endTime} ${nextApprovedEvent.timezone} · ${nextApprovedEvent.blockLabel}`, icon: "calendar", tone: "info", toneLabel: "Approved" },
      { id: "result", label: "Recent mission result", value: recentOutcome.commitment.actualLabel, detail: `${recentOutcome.commitment.statusLabel} · ${recentOutcome.commitment.fulfilmentPercent}% of buyer target`, icon: "result", tone: "success", toneLabel: "Closed" },
    ],
  },
  nextSteps: {
    title: "Where to go next",
    description: "Open the authoritative page for each decision or record.",
    items: [
      { id: "review-harvest", title: approvalMission.title, detail: "Review and approve a strategy before scheduling.", status: { label: approvalMission.statusLabel, tone: "warning" }, action: { label: "Review mission", href: "/missions/new" } },
      { id: "continue-drainage", title: activeMission.title, detail: "Review the time-assumed tasks and remaining crop-condition record.", status: { label: activeMission.statusLabel, tone: "success" }, action: { label: "Open mission", href: "/missions/mission-drainage-recovery" } },
      { id: "review-result", title: recentOutcome.title, detail: "Compare the confirmed closeout with the approved expectation.", status: { label: recentOutcome.resultStatusLabel, tone: "success" }, action: { label: "Review result", href: `/outcomes/${recentOutcome.missionId}` } },
    ],
  },
  assistant: {
    contextLabel: "Today context loaded",
    contextTone: "info",
    starterMessage: "Ask about today's priority, active mission, approved Calendar work, latest farm observation, or recent result.",
    inputPlaceholder: "Ask about today…",
    responses: [
      { id: "status", keywords: ["status", "approval", "priority", "first"], text: "The East Block chili mission is still awaiting approval and should be reviewed first because it carries deadline and rain risk." },
      { id: "quantity", keywords: ["amount", "weight", "quantity", "target", "how much"], text: "The placeholder buyer target is 80 kg at market quality A. The expected harvest amount is also 80 kg, but the final saleable range depends on the selected strategy." },
      { id: "active", keywords: ["active", "drainage", "task"], text: "The drainage recovery mission is active. Two elapsed tasks are treated as completed by schedule, and the crop-condition record remains the next unresolved task." },
      { id: "calendar", keywords: ["calendar", "event", "scheduled"], text: "The next approved placeholder event is Record crop condition at 15:30 WIB in North Block. It remains conditional on the water-level recheck." },
      { id: "observation", keywords: ["observation", "field", "water"], text: "The latest farm observation reports standing water in North Block. It is farmer-reported and needs a recheck before crop conclusions." },
      { id: "result", keywords: ["result", "outcome", "completed", "42"], text: "The recent tomato trial recorded 42 kg saleable and fulfilled 105% of its buyer target. One result is not enough for a benchmark." },
    ],
    fallbackResponse: "Today's first priority is the unapproved East Block chili mission. The active drainage mission, next approved Calendar event, latest field observation, and recent tomato result are also available from their full pages.",
  },
};
