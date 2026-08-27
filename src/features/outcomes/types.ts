export type OutcomeComparisonTone = "success" | "warning" | "info" | "neutral";

export type OutcomeComparison = {
  id: string;
  label: string;
  expected: string;
  actual: string;
  interpretation: string;
  tone: OutcomeComparisonTone;
  statusLabel: string;
};

export type MissionOutcome = {
  id: string;
  missionId: string;
  sourceLabel: string;
  title: string;
  missionTitle: string;
  description: string;
  cropLabel: string;
  blockLabel: string;
  closedAt: string;
  closedLabel: string;
  resultStatusLabel: string;
  resultStatusTone: "success" | "warning";
  commitment: {
    buyerName: string;
    targetLabel: string;
    actualLabel: string;
    fulfilmentPercent: number;
    statusLabel: string;
  };
  comparisons: OutcomeComparison[];
  deviation: {
    classification: "operational" | "biological" | "prediction" | "none";
    classificationLabel: string;
    title: string;
    description: string;
  };
  conclusion: string;
  evidence: Array<{ id: string; label: string; value: string; sourceLabel: string }>;
  assistant: {
    contextLabel: string;
    starterMessage: string;
    responses: Array<{ id: string; keywords: string[]; text: string }>;
    fallbackResponse: string;
  };
};

export type ResultsPageData = {
  sourceLabel: string;
  title: string;
  description: string;
  freshness: string;
  emptyState: { title: string; description: string };
  assistant: {
    contextLabel: string;
    starterMessage: string;
    responses: Array<{ id: string; keywords: string[]; text: string }>;
    fallbackResponse: string;
  };
};
