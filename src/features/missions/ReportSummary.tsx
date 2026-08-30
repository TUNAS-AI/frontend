import type { OperationalReport, OperationalReportType } from "@/api/tunas";

const labels: Record<OperationalReportType, string> = {
  ACTIVITY_STARTED: "Activity started", ACTIVITY_COMPLETED: "Activity completed", ACTUAL_QUANTITY_REPORTED: "Actual quantity",
  WORKER_AVAILABILITY_CHANGED: "Worker availability", BUYER_REQUIREMENT_CHANGED: "Buyer requirement", DRYING_RESOURCE_CHANGED: "Drying resource", DRYING_INSPECTION: "Drying inspection",
  RAIN_OR_FIELD_EVENT: "Rain or field event", MISSION_DEVIATION: "Mission deviation", GENERAL_OPERATIONAL_NOTE: "General note",
};

type SummaryReport = { reportType: OperationalReportType; observedAt: string; payload: OperationalReport["payload"]; narrative?: string | null };

export function ReportSummary({ report }: { report: SummaryReport }) {
  return <dl className="mt-3 grid gap-2 text-sm"><div><dt className="font-semibold text-muted-foreground">Type</dt><dd>{labels[report.reportType]}</dd></div><div><dt className="font-semibold text-muted-foreground">Observed</dt><dd>{new Date(report.observedAt).toLocaleString("en-ID")}</dd></div>{Object.entries(report.payload).map(([key, item]) => <div key={key}><dt className="font-semibold text-muted-foreground">{key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase())}</dt><dd>{typeof item === "boolean" ? item ? "Yes" : "No" : key.toLowerCase().includes("at") || key === "deadline" ? new Date(String(item)).toLocaleString("en-ID") : String(item)}</dd></div>)}{report.narrative ? <div><dt className="font-semibold text-muted-foreground">Context</dt><dd>{report.narrative}</dd></div> : null}</dl>;
}
