import { CircleAlert, FileCheck2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ConfidenceIndicator } from "@/components/ui/ConfidenceIndicator";
import { Input } from "@/components/ui/input";
import type { MissionFact, MissionInterpretation } from "../types";

const provenanceLabels: Record<MissionFact["provenance"], string> = {
  confirmed: "Context-confirmed",
  "farmer-reported": "Farmer-reported",
  estimate: "Estimate",
  inferred: "Inferred",
  missing: "Missing",
  contradiction: "Contradiction",
};

export function InterpretationReview({ interpretation, onChange, fieldError }: { interpretation: MissionInterpretation; onChange: (facts: MissionFact[]) => void; fieldError?: { key: MissionFact["key"]; message: string } | null }) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Parsed interpretation</CardTitle>
            <Badge variant="info"><FileCheck2 aria-hidden="true" />Original preserved</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <blockquote lang="id" className="break-words rounded-md border-l-4 border-forest-400 bg-forest-50 p-4 text-base font-medium leading-7">“{interpretation.originalMessage}”</blockquote>
          <div className="grid gap-3 sm:grid-cols-2">
            {interpretation.facts.map((fact) => (
              <div key={fact.key} className="min-w-0 rounded-md border bg-background p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {fact.editable ? <label htmlFor={`mission-fact-${fact.key}`} className="text-sm font-bold">{fact.label}</label> : <span className="text-sm font-bold">{fact.label}</span>}
                  <Badge variant={fact.provenance === "missing" ? "warning" : fact.provenance === "farmer-reported" ? "success" : "source"}>{provenanceLabels[fact.provenance]}</Badge>
                </div>
                {fact.editable ? (
                  <Input
                    id={`mission-fact-${fact.key}`}
                    required={fact.required}
                    aria-required={fact.required}
                    aria-invalid={fieldError?.key === fact.key}
                    aria-errormessage={fieldError?.key === fact.key ? `mission-fact-error-${fact.key}` : undefined}
                    value={fact.value}
                    onChange={(event) => onChange(interpretation.facts.map((item) => item.key === fact.key ? {
                      ...item,
                      value: event.target.value,
                      provenance: event.target.value.trim() ? "farmer-reported" : "missing",
                      confidence: event.target.value.trim() ? item.confidence : "unknown",
                    } : item))}
                  />
                ) : <p className="min-h-11 break-words rounded-md border border-dashed px-3 py-2 font-semibold">{fact.value || "Not provided"}</p>}
                {fieldError?.key === fact.key ? <p id={`mission-fact-error-${fact.key}`} className="mt-2 text-sm font-semibold text-destructive">{fieldError.message}</p> : null}
                <div className="mt-2"><ConfidenceIndicator level={fact.confidence} showScale={false} /></div>
                {fact.note ? <p className="mt-2 text-sm text-muted-foreground">{fact.note}</p> : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {(interpretation.missingKeys.length || interpretation.contradictions.length) ? (
        <Alert variant="warning">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>Information needs review</AlertTitle>
          <AlertDescription>
            {interpretation.contradictions.map((item) => <p key={item}>{item}</p>)}
            {interpretation.missingKeys.includes("harvestAmount") ? <p>Expected harvest amount is missing and materially affects feasibility.</p> : null}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
