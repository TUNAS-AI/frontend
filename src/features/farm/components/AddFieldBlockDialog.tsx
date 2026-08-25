import type { FormEvent } from "react";
import { FieldGroup } from "@/components/ui/FieldControl";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FarmBlockDraft } from "../types";
import { Button } from "@/components/ui/Button";

type AddFieldBlockDialogProps = {
  onCreate: (draft: FarmBlockDraft) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function AddFieldBlockDialog({ onCreate, onOpenChange, open }: AddFieldBlockDialogProps) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onCreate({
      name: String(form.get("name") ?? "").trim(),
      location: String(form.get("location") ?? "").trim(),
      areaHectares: String(form.get("areaHectares") ?? "").trim(),
      accessNotes: String(form.get("accessNotes") ?? "").trim(),
      drainageNotes: String(form.get("drainageNotes") ?? "").trim(),
      notes: String(form.get("notes") ?? "").trim(),
    });
    event.currentTarget.reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle>Add a field block</DialogTitle><DialogDescription>This creates a local placeholder record only. Add a shallot crop batch after the field block is created.</DialogDescription></DialogHeader>
        <form className="grid gap-4" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldGroup label="Field block name" required><Input name="name" required autoComplete="off" placeholder="North Block" /></FieldGroup>
          <FieldGroup label="Area (hectares)" required><Input name="areaHectares" required type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.8" /></FieldGroup>
        </div>
        <FieldGroup label="Location" required><Input name="location" required autoComplete="address-level2" placeholder="Lembang, West Java" /></FieldGroup>
        <FieldGroup label="Access notes" required helper="Describe practical access for harvest work."><Textarea name="accessNotes" required className="min-h-20" placeholder="Vehicle and hand-cart access details." /></FieldGroup>
        <FieldGroup label="Drainage notes" required helper="Record what the farmer knows; do not infer crop condition."><Textarea name="drainageNotes" required className="min-h-20" placeholder="Drainage channel or standing-water details." /></FieldGroup>
        <FieldGroup label="Other field notes"><Textarea name="notes" className="min-h-20" placeholder="Optional farmer-reported context." /></FieldGroup>
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">Create field block</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
