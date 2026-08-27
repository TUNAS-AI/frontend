import type { MissionOutcome, ResultsPageData } from "@/features/outcomes/types";

export const DEMO_RESULTS_PAGE_DATA: ResultsPageData = {
  sourceLabel: "Placeholder result records",
  title: "Results",
  description: "Track completed missions and review expected-versus-actual evidence. Reliable benchmarks appear only after enough comparable results exist.",
  freshness: "Updated 14 July 2026 at 13:00 WIB · Placeholder data",
  emptyState: { title: "No completed mission results", description: "Close a mission with confirmed outcome information before using Results." },
  assistant: {
    contextLabel: "Results tracker loaded",
    starterMessage: "Ask about completed missions, buyer fulfilment, expected-versus-actual comparisons, or whether there is enough evidence for a benchmark.",
    responses: [
      { id: "completed", keywords: ["completed", "closed", "mission", "result"], text: "One placeholder mission has a confirmed result: the tomato market-quality trial." },
      { id: "buyer", keywords: ["buyer", "commitment", "fulfilled"], text: "The one recorded buyer commitment was fulfilled at 105% of its 40 kg saleable target." },
      { id: "benchmark", keywords: ["benchmark", "trend", "pattern", "calibration"], text: "There is only one comparable mission result, so TUNAS does not claim a benchmark, trend, or calibration pattern yet." },
      { id: "difference", keywords: ["difference", "expected", "actual", "late"], text: "Saleable amount and market-quality A output stayed within their expected ranges. Completion was 20 minutes later because sorting started late." },
    ],
    fallbackResponse: "Results currently contains one confirmed placeholder mission. It is useful as an individual comparison, but not enough evidence for a farm-wide benchmark.",
  },
};

export const DEMO_MISSION_OUTCOMES: readonly MissionOutcome[] = [
  {
    id: "outcome-tomato-market-trial",
    missionId: "mission-tomato-market-trial",
    sourceLabel: "Placeholder result record",
    title: "Tomato market-quality trial result",
    missionTitle: "Close tomato market-quality trial",
    description: "Review the recorded result against the approved plan without treating one completed mission as a reliable farm-wide trend.",
    cropLabel: "Tomato · Trial TM-02",
    blockLabel: "South Raised Beds",
    closedAt: "2026-07-08T10:35:00+07:00",
    closedLabel: "Closed 8 July 2026 · 10:35 WIB",
    resultStatusLabel: "Target fulfilled",
    resultStatusTone: "success",
    commitment: {
      buyerName: "Bandung Market Trial",
      targetLabel: "40 kg saleable",
      actualLabel: "42 kg saleable",
      fulfilmentPercent: 105,
      statusLabel: "Fulfilled",
    },
    comparisons: [
      { id: "saleable", label: "Saleable amount", expected: "40–46 kg", actual: "42 kg", interpretation: "Actual saleable amount stayed within the expected range.", tone: "success", statusLabel: "Within range" },
      { id: "quality", label: "Market quality A", expected: "32–38 kg", actual: "34 kg", interpretation: "Accepted market-quality A quantity stayed within the expected range.", tone: "success", statusLabel: "Within range" },
      { id: "rejection", label: "Rejected or lost", expected: "Up to 8 kg", actual: "8 kg", interpretation: "Recorded rejection reached the upper expected bound.", tone: "warning", statusLabel: "Upper bound" },
      { id: "timing", label: "Working window", expected: "06:30–10:00", actual: "06:40–10:20", interpretation: "Completion was 20 minutes later than planned because sorting started late.", tone: "warning", statusLabel: "20 min later" },
    ],
    deviation: {
      classification: "operational",
      classificationLabel: "Operational deviation",
      title: "Sorting started later than planned",
      description: "The handling surface was still wet at the planned start, so sorting began after it was cleared. This timing difference should not be treated as biological or prediction error.",
    },
    conclusion: "The buyer target was fulfilled and the main amount and market-quality estimates remained within range. This single result is useful mission evidence but is not enough to calibrate future predictions.",
    evidence: [
      { id: "amount-source", label: "Actual saleable amount", value: "42 kg", sourceLabel: "User confirmed at closeout" },
      { id: "quality-source", label: "Market quality A", value: "34 kg", sourceLabel: "User confirmed at closeout" },
      { id: "rejection-source", label: "Rejected amount", value: "8 kg", sourceLabel: "User confirmed at closeout" },
    ],
    assistant: {
      contextLabel: "Mission result loaded",
      starterMessage: "Ask how the actual result compared with the plan, whether the buyer target was fulfilled, or what caused the timing difference.",
      responses: [
        { id: "amount", keywords: ["amount", "weight", "saleable", "42"], text: "The mission recorded 42 kg saleable against an expected range of 40–46 kg, so the actual amount stayed within range." },
        { id: "quality", keywords: ["quality", "grade", "accepted", "34"], text: "Market-quality A actual output was 34 kg against an expected 32–38 kg, which stayed within range." },
        { id: "buyer", keywords: ["buyer", "target", "commitment", "fulfilled"], text: "The 40 kg saleable buyer target was fulfilled with 42 kg, or 105% of target." },
        { id: "deviation", keywords: ["deviation", "late", "timing", "why"], text: "Sorting started late because the handling surface was wet. This is recorded as an operational deviation, not crop-performance or prediction error." },
      ],
      fallbackResponse: "This placeholder result fulfilled the buyer target. Saleable amount and market-quality A output stayed within their expected ranges, while completion was 20 minutes later because of an operational sorting delay.",
    },
  },
];

export function getDemoMissionOutcome(missionId: string) {
  return DEMO_MISSION_OUTCOMES.find((outcome) => outcome.missionId === missionId) ?? null;
}
