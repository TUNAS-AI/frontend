import { useState } from "react";
import { CheckCircle2, ClipboardCheck } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { FieldGroup, Select } from "@/components/ui/FieldControl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { MissionCloseoutDraft, MissionDetailPageData } from "../detailTypes";

type MissionCloseoutPanelProps = {
  data: MissionDetailPageData;
  onConfirm: (draft: MissionCloseoutDraft) => void;
};

export function MissionCloseoutPanel({ data, onConfirm }: MissionCloseoutPanelProps) {
  const [tasksCompleted, setTasksCompleted] = useState<"yes" | "no">("yes");
  const [actualAmount, setActualAmount] = useState("");
  const [outcome, setOutcome] = useState("");
  const [deviation, setDeviation] = useState("");
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const draft: MissionCloseoutDraft = {
    tasksCompleted,
    actualAmount: data.closeout.actualAmount ? actualAmount : undefined,
    outcome: outcome.trim(),
    deviation: deviation.trim(),
  };

  function reviewCloseout() {
    if (!outcome.trim()) {
      setError("Record the final outcome before reviewing closeout.");
      return;
    }
    if (data.closeout.actualAmount && !actualAmount.trim()) {
      setError(`Enter the ${data.closeout.actualAmount.label.toLowerCase()} before reviewing closeout.`);
      return;
    }
    if (tasksCompleted === "no" && !deviation.trim()) {
      setError("Explain what was not completed or changed.");
      return;
    }
    setError("");
    setConfirmOpen(true);
  }

  return (
    <section aria-labelledby="mission-closeout-heading">
      <Card className="border-forest-300 shadow-farm">
        <CardHeader className="border-b bg-forest-50/60">
          <div className="flex items-center gap-2 text-sm font-bold text-forest-700"><ClipboardCheck className="h-5 w-5" aria-hidden="true" />Closeout review</div>
          <CardTitle id="mission-closeout-heading" className="text-2xl">Confirm the mission result</CardTitle>
          <p className="max-w-3xl leading-6 text-muted-foreground">{data.closeout.prompt}</p>
        </CardHeader>
        <CardContent className="grid gap-5 pt-5 sm:pt-6">
          {error ? <Alert variant="danger" role="alert"><CheckCircle2 aria-hidden="true" /><AlertTitle>Closeout information required</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="Were the planned tasks completed?" required>
              <Select value={tasksCompleted} onChange={(event) => setTasksCompleted(event.target.value as "yes" | "no")}><option value="yes">Yes, the plan was completed</option><option value="no">No, some work was missed or changed</option></Select>
            </FieldGroup>
            {data.closeout.actualAmount ? <FieldGroup label={`${data.closeout.actualAmount.label} (${data.closeout.actualAmount.unit})`} helper={`Expected: ${data.closeout.actualAmount.expectedLabel}`} required><Input type="number" min="0" inputMode="decimal" value={actualAmount} onChange={(event) => setActualAmount(event.target.value)} /></FieldGroup> : null}
          </div>
          <FieldGroup label="Final outcome" helper={data.closeout.outcomeHelper} required><Textarea className="min-h-28 text-base" value={outcome} onChange={(event) => setOutcome(event.target.value)} /></FieldGroup>
          <FieldGroup label="Deviation or problem" helper={data.closeout.deviationHelper} required={tasksCompleted === "no"}><Textarea className="min-h-24 text-base" value={deviation} onChange={(event) => setDeviation(event.target.value)} /></FieldGroup>
          <div className="flex flex-wrap items-center gap-3"><Button type="button" onClick={reviewCloseout}>Review and close</Button><p className="text-xs text-muted-foreground">This demo does not persist the result.</p></div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Close this mission?</AlertDialogTitle><AlertDialogDescription>This final confirmation changes the mission to Closed in this demo session. It does not change an external Calendar or backend record.</AlertDialogDescription></AlertDialogHeader>
          <dl className="grid gap-3 rounded-md bg-muted/50 p-4 text-sm"><div><dt className="font-semibold text-muted-foreground">Planned tasks</dt><dd className="font-bold">{tasksCompleted === "yes" ? "Completed" : "Not fully completed"}</dd></div>{data.closeout.actualAmount ? <div><dt className="font-semibold text-muted-foreground">{data.closeout.actualAmount.label}</dt><dd className="font-bold tabular-nums">{actualAmount} {data.closeout.actualAmount.unit}</dd></div> : null}<div><dt className="font-semibold text-muted-foreground">Outcome</dt><dd className="font-bold">{outcome}</dd></div>{deviation ? <div><dt className="font-semibold text-muted-foreground">Deviation</dt><dd>{deviation}</dd></div> : null}</dl>
          <AlertDialogFooter><AlertDialogCancel>Continue editing</AlertDialogCancel><AlertDialogAction onClick={() => onConfirm(draft)}>Confirm closeout</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
