import type { ComponentType, SVGProps } from "react";

export type AppView = "calendar" | "add" | "fields" | "history" | "review";

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export type RiskLevel = "safe" | "watch" | "risk";

export type ActivityStatus = "recommended" | "scheduled" | "completed" | "delayed";

export type FarmField = {
  id: string;
  name: string;
  crop: "Chili" | "Shallot" | "Tomato";
  location: string;
  ageDays: number;
  stage: string;
  condition: string;
  activityWindow: string;
};

export type Recommendation = {
  id: string;
  title: string;
  fieldId: string;
  type: string;
  day: string;
  time: string;
  decision: string;
  reason: string;
  risk: RiskLevel;
  rule: string;
  preparation: string[];
  status: ActivityStatus;
};

export type WeatherItem = {
  label: string;
  value: string;
  detail: string;
  risk: RiskLevel;
};

export type CalendarEvent = {
  id: string;
  day: string;
  time: string;
  title: string;
  field: string;
  status: ActivityStatus;
};

export type HistoryItem = {
  id: string;
  date: string;
  title: string;
  detail: string;
  status: Extract<ActivityStatus, "completed" | "delayed">;
};
