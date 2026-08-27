import type { MissionOutcome } from "./types";

export function getResultsSummary(outcomes: readonly MissionOutcome[]) {
  const comparisonCount = outcomes.reduce((total, outcome) => total + outcome.comparisons.length, 0);
  const withinRangeCount = outcomes.reduce((total, outcome) => total + outcome.comparisons.filter((comparison) => comparison.tone === "success").length, 0);
  return {
    completedMissions: outcomes.length,
    fulfilledCommitments: outcomes.filter((outcome) => outcome.commitment.fulfilmentPercent >= 100).length,
    comparisonCount,
    withinRangeCount,
    hasBenchmarkEvidence: outcomes.length >= 3,
  };
}
