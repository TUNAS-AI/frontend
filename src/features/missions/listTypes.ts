import type { RiskLevel } from "./types";

export type MissionListStatus = "draft" | "awaiting-clarification" | "awaiting-approval" | "active" | "closed";
export type MissionListTone = "neutral" | "warning" | "info" | "success" | "ai";

export type MissionListItem = {
  id: string;
  title: string;
  description: string;
  status: MissionListStatus;
  statusLabel: string;
  statusTone: MissionListTone;
  risk: RiskLevel;
  riskLabel: string;
  context: Array<{ id: string; label: string; value: string }>;
  deadline?: { label: string; dateTime: string };
  updated: { label: string; dateTime: string };
  action?: { label: string; href: string };
  unavailableActionLabel?: string;
};

export type MissionsPageData = {
  sourceBadge: string;
  title: string;
  description: string;
  freshness: string;
  primaryAction: { label: string; href: string };
  overview: Array<{
    id: string;
    label: string;
    description: string;
    statuses: MissionListStatus[];
  }>;
  filters: Array<{
    id: string;
    label: string;
    statuses: MissionListStatus[];
  }>;
  missions: MissionListItem[];
  emptyState: { title: string; description: string };
  assistant: {
    contextLabel: string;
    starterMessage: string;
    inputPlaceholder: string;
    responses: Array<{ id: string; keywords: string[]; text: string }>;
    fallbackResponse: string;
  };
};
