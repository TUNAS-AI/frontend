import type { OperationalReport, OperationalReportType } from "@/api/tunas";

const labels: Record<OperationalReportType, string> = {
  ACTIVITY_STARTED: "Activity started", ACTIVITY_COMPLETED: "Activity completed", ACTUAL_QUANTITY_REPORTED: "Actual quantity",
  WORKER_AVAILABILITY_CHANGED: "Worker availability", BUYER_REQUIREMENT_CHANGED: "Buyer requirement", DRYING_RESOURCE_CHANGED: "Drying resource", DRYING_INSPECTION: "Drying inspection",
  RAIN_OR_FIELD_EVENT: "Rain or field event", MISSION_DEVIATION: "Mission deviation", GENERAL_OPERATIONAL_NOTE: "General note",
};
export { labels as reportTypeLabels };

type SummaryReport = { reportType: OperationalReportType; observedAt: string; payload: OperationalReport["payload"]; narrative?: string | null };

export function ReportSummary({ report }: { report: SummaryReport }) {
  return <dl className="mt-3 grid gap-2 text-sm"><div><dt className="font-semibold text-muted-foreground">Report</dt><dd>{reportSummary(report)}</dd></div><div><dt className="font-semibold text-muted-foreground">Observed</dt><dd>{formatDate(report.observedAt)}</dd></div>{report.narrative ? <div><dt className="font-semibold text-muted-foreground">Context</dt><dd>{report.narrative}</dd></div> : null}</dl>;
}

export function reportSummary(report: SummaryReport) {
  const payload = report.payload as Record<string, unknown>;
  if (report.reportType === "ACTIVITY_STARTED") return "Scheduled activity started";
  if (report.reportType === "ACTIVITY_COMPLETED") return "Scheduled activity completed";
  if (report.reportType === "ACTUAL_QUANTITY_REPORTED") return `${number(payload.quantityKg)} kg ${payload.quantityBasis === "DRIED" ? "dried" : "harvested"} recorded`;
  if (report.reportType === "WORKER_AVAILABILITY_CHANGED") return `${number(payload.availableWorkers)} workers available${payload.effectiveAt ? ` from ${formatDate(String(payload.effectiveAt))}` : ""}`;
  if (report.reportType === "BUYER_REQUIREMENT_CHANGED") return `Buyer target updated to ${number(payload.targetQuantityKg)} kg${payload.buyerPickupAt ? ` by ${formatDate(String(payload.buyerPickupAt))}` : ""}`;
  if (report.reportType === "DRYING_RESOURCE_CHANGED") return payload.available ? `Drying resource available${payload.protectionAvailable === true ? " with rain protection" : ""}` : "Drying resource unavailable";
  if (report.reportType === "DRYING_INSPECTION") return `Drying inspection marked ${String(payload.decision ?? "recorded").toLowerCase()}`;
  if (report.reportType === "RAIN_OR_FIELD_EVENT") return String(payload.event || "Rain or field event recorded");
  if (report.reportType === "MISSION_DEVIATION") return String(payload.description || "Mission deviation recorded");
  return String(payload.text || labels[report.reportType]);
}

function number(value: unknown) { return typeof value === "number" ? value.toLocaleString("en-ID") : String(value ?? "Not recorded"); }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-ID", { dateStyle: "medium", timeStyle: "short" }); }
