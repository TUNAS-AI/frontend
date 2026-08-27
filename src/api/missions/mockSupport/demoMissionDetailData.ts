import type { MissionDetailPageData } from "@/features/missions/detailTypes";

export const DEMO_MISSION_DETAILS: readonly MissionDetailPageData[] = [
  {
    id: "mission-drainage-recovery",
    sourceLabel: "Placeholder execution record",
    title: "Stabilize drainage after heavy rain",
    objective: "Clear blocked drainage paths, verify standing water is falling, and record the North Block crop condition before reassessment.",
    statusLabel: "Active",
    risk: "medium",
    riskLabel: "Medium field risk",
    freshness: "Execution evaluated 14 July 2026 at 12:00 WIB · Placeholder data",
    executionAsOf: "2026-07-14T12:00:00+07:00",
    schedule: { type: "daily-window", startTime: "06:45", endTime: "17:00" },
    deadline: { label: "Today · 17:00 WIB", dateTime: "2026-07-13T17:00:00+07:00" },
    originalRequest: "Hujan deras semalam membuat air menggenang di Blok Utara. Bantu saya menstabilkan drainase dan periksa kondisi cabai hari ini.",
    context: [
      { id: "block", label: "Field block", value: "North Block", provenance: "confirmed", confidence: "high" },
      { id: "batch", label: "Crop batch", value: "Chili · NB-CH-03", provenance: "confirmed", confidence: "high" },
      { id: "condition", label: "Field condition", value: "Standing water after heavy rain", provenance: "farmer-reported", confidence: "medium" },
      { id: "weather", label: "Weather context", value: "Further light rain possible", provenance: "estimate", confidence: "low" },
    ],
    plan: {
      name: "Drainage recovery and reassessment",
      summary: "Restore water movement first, preserve completed work, then reassess only the crop area still affected.",
      constraint: "Do not infer crop damage until the field condition is observed again.",
      expectedResult: "Open drainage paths and a documented crop-condition checkpoint by 17:00 WIB.",
    },
    nextAction: {
      title: "Clear the blocked secondary channel",
      description: "Continue the approved drainage step, then confirm whether standing water is decreasing before moving to crop reassessment.",
    },
    steps: [
      { id: "inspect-outlets", title: "Inspect drainage outlets", description: "Check the North Block outlet and identify visible obstructions.", status: "completed", statusLabel: "Completed", completedLabel: "Farmer confirmed at 06:58 WIB", completionSource: "user-confirmed", scheduledStart: "2026-07-14T06:45:00+07:00", scheduledEnd: "2026-07-14T07:00:00+07:00" },
      { id: "open-primary", title: "Open the primary drain", description: "Remove the first obstruction and restore the main flow path.", status: "completed", statusLabel: "Completed", completedLabel: "Farmer confirmed at 07:25 WIB", completionSource: "user-confirmed", scheduledStart: "2026-07-14T07:00:00+07:00", scheduledEnd: "2026-07-14T07:30:00+07:00" },
      { id: "clear-secondary", title: "Clear the blocked secondary channel", description: "Remove remaining material without disturbing the crop rows.", status: "in-progress", statusLabel: "In progress", scheduledLabel: "07:30–09:30 WIB", scheduledStart: "2026-07-14T07:30:00+07:00", scheduledEnd: "2026-07-14T09:30:00+07:00" },
      { id: "recheck-water", title: "Recheck standing water", description: "Confirm whether the affected area is draining before reassessment.", status: "scheduled", statusLabel: "Scheduled", scheduledLabel: "10:30–11:00 WIB", scheduledStart: "2026-07-14T10:30:00+07:00", scheduledEnd: "2026-07-14T11:00:00+07:00" },
      { id: "record-condition", title: "Record crop condition", description: "Add an observation for the affected chili batch and flag any material change.", status: "waiting-confirmation", statusLabel: "Waiting for confirmation", scheduledLabel: "After water-level recheck · planned 15:30 WIB", scheduledStart: "2026-07-14T15:30:00+07:00", scheduledEnd: "2026-07-14T16:00:00+07:00" },
    ],
    impact: {
      title: "Reassessment still required",
      description: "The field observation is farmer-reported and the weather context is a low-confidence estimate. Do not close or replan the mission until standing water is checked again.",
      tone: "warning",
    },
    approvalHistory: [
      { id: "approval-plan", label: "Recovery plan approved", detail: "Five mission steps approved in the Simulated Calendar.", dateTime: "2026-07-13T06:35:00+07:00", timeLabel: "13 July 2026 · 06:35 WIB" },
      { id: "approval-start", label: "Execution started", detail: "No material Calendar or plan changes have been requested.", dateTime: "2026-07-13T06:45:00+07:00", timeLabel: "13 July 2026 · 06:45 WIB" },
    ],
    assistant: {
      contextLabel: "Active mission loaded",
      starterMessage: "Ask about the current step, field risk, approved plan, or what would require replanning.",
      responses: [
        { id: "next", keywords: ["next", "now", "current", "step"], text: "The current approved step is to clear the blocked secondary channel. After that, recheck standing water before recording the crop condition." },
        { id: "risk", keywords: ["risk", "rain", "water", "weather"], text: "Field risk is medium. Standing water is farmer-reported and further light rain is only a low-confidence estimate, so the mission requires a fresh field check before any material replan." },
        { id: "change", keywords: ["change", "replan", "adjust"], text: "Completed drainage steps must remain unchanged. A material change to the remaining steps or Calendar would require a new impact assessment and explicit approval." },
        { id: "plan", keywords: ["plan", "why", "strategy"], text: "The approved strategy restores drainage first and delays crop conclusions until standing water is checked again. This avoids treating an unverified condition as crop damage." },
      ],
      fallbackResponse: "This active placeholder mission has completed two of five steps. The secondary drainage channel is in progress, and crop reassessment remains blocked until standing water is checked again.",
    },
    closeout: {
      prompt: "Confirm what happened before closing this drainage recovery mission.",
      outcomeHelper: "Record the final field condition and whether drainage movement was restored.",
      deviationHelper: "If the plan was not followed, explain what changed. Leave blank when there was no material deviation.",
    },
  },
];

export function getDemoMissionDetail(missionId: string) {
  return DEMO_MISSION_DETAILS.find((mission) => mission.id === missionId) ?? null;
}
