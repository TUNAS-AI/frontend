import { Badge } from "./Badge";

export type ConfidenceLevel = "high" | "medium" | "low" | "unknown";

const confidenceLabels: Record<ConfidenceLevel, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
  unknown: "Confidence unknown",
};

type ConfidenceIndicatorProps = {
  level: ConfidenceLevel;
  label?: string;
  showScale?: boolean;
};

export function ConfidenceIndicator({ level, label, showScale = true }: ConfidenceIndicatorProps) {
  const activeSegments = level === "high" ? 3 : level === "medium" ? 2 : level === "low" ? 1 : 0;
  const accessibleLabel = label ?? confidenceLabels[level];

  return (
    <div className="inline-flex flex-wrap items-center gap-2" aria-label={accessibleLabel}>
      <Badge variant={level === "unknown" ? "neutral" : "ai"}>{accessibleLabel}</Badge>
      {showScale ? (
        <span className="inline-flex gap-1" aria-hidden="true">
          {[1, 2, 3].map((segment) => (
            <span
              key={segment}
              className={cnSegment(segment <= activeSegments)}
            />
          ))}
        </span>
      ) : null}
    </div>
  );
}

function cnSegment(active: boolean) {
  return `h-2 w-5 rounded-full ${active ? "bg-forest-500" : "bg-muted"}`;
}
