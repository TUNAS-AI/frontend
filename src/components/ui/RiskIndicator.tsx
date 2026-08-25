import { CircleAlert, CircleCheck, CircleHelp, TriangleAlert } from "lucide-react";
import { Badge } from "./Badge";

export type RiskLevel = "low" | "medium" | "high" | "unknown";

const riskPresentation = {
  low: { icon: CircleCheck, label: "Low risk", variant: "success" },
  medium: { icon: TriangleAlert, label: "Medium risk", variant: "warning" },
  high: { icon: CircleAlert, label: "High risk", variant: "danger" },
  unknown: { icon: CircleHelp, label: "Risk unknown", variant: "neutral" },
} as const;

type RiskIndicatorProps = {
  level: RiskLevel;
  label?: string;
};

export function RiskIndicator({ level, label }: RiskIndicatorProps) {
  const presentation = riskPresentation[level];
  const Icon = presentation.icon;

  return (
    <Badge variant={presentation.variant}>
      <Icon aria-hidden="true" />
      {label ?? presentation.label}
    </Badge>
  );
}
