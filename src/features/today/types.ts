import type { StatusVariant } from "@/components/ui/semantics";
import type { MissionContextData } from "@/features/missions/types";

export type TodayTone = StatusVariant;
export type TodayIconKey = "calendar" | "field" | "result";

export type TodayPageData = {
  context: MissionContextData;
  header: {
    badges: Array<{ id: string; label: string; tone: TodayTone }>;
    greeting: string;
    title: string;
    description: string;
  };
  attentionMission: {
    id: string;
    status: { label: string; tone: TodayTone };
    title: string;
    description: string;
    riskLabel: string;
    metrics: Array<{ id: string; label: string; value: string; detail: string }>;
    action: { label: string; href: string };
    notice: string;
  };
  signals: {
    title: string;
    description: string;
    items: Array<{
      id: string;
      label: string;
      value: string;
      detail: string;
      icon: TodayIconKey;
      tone: TodayTone;
      toneLabel: string;
    }>;
  };
  nextSteps: {
    title: string;
    description: string;
    items: Array<{
      id: string;
      title: string;
      detail: string;
      status: { label: string; tone: TodayTone };
      action?: { label: string; href: string };
    }>;
  };
  assistant: {
    contextLabel: string;
    contextTone: TodayTone;
    starterMessage: string;
    inputPlaceholder: string;
    responses: Array<{ id: string; keywords: string[]; text: string }>;
    fallbackResponse: string;
  };
};
