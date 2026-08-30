import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  MapPinned,
  Pencil,
  Plus,
  Sprout,
  Trash2,
  UsersRound,
} from "lucide-react";
import {
  type CropBatch,
  type CropBatchInput,
  type FarmSnapshot,
  type FarmUpdate,
  type FieldBlock,
  type FieldBlockInput,
  type WorkingHours,
  createCropBatch,
  createFieldBlock,
  deleteCropBatch,
  deleteFieldBlock,
  updateCropBatch,
  updateFarm,
  updateFieldBlock,
} from "@/api/farm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
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
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/FieldControl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deleteFarm } from "@/api/farm/delete";
import { useAuthSession } from "@/features/auth/useAuthSession";
import { validateFieldBlockForm } from "@/features/farm/fieldBlockForm";
import { useNavigate } from "react-router";
import {
  beginTelegramConnection,
  getTelegramStatus,
  type TelegramStatus,
} from "@/api/telegram";

type FarmViewProps = { data: FarmSnapshot; onRefresh: () => Promise<void> };
type DialogState =
  "farm" | "new-field" | "edit-field" | "new-batch" | "edit-batch" | null;
type DeleteTarget =
  | { kind: "field"; record: FieldBlock }
  | { kind: "batch"; record: CropBatch }
  | null;
type WorkWindow = {
  id: string;
  day: keyof WorkingHours;
  start: string;
  end: string;
};

const weekdays: Array<keyof WorkingHours> = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const dateFormat = new Intl.DateTimeFormat("en-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function optional(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}
function numeric(value: FormDataEntryValue | null) {
  return Number(value);
}
function formatArea(area: number | null) {
  return area === null
    ? "Area not recorded"
    : `${area.toLocaleString("en-ID", { maximumFractionDigits: 2 })} ha`;
}
function formatDate(value: string | null) {
  return value
    ? dateFormat.format(new Date(`${value}T00:00:00`))
    : "Planting date not recorded";
}
function statusVariant(status: string) {
  return status.toLowerCase() === "active"
    ? ("success" as const)
    : ("neutral" as const);
}
function titleStatus(status: string) {
  return status
    ? `${status[0].toUpperCase()}${status.slice(1)}`
    : "Not recorded";
}

function TelegramIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.7 3.2 18.6 20c-.2 1.2-.9 1.5-1.9.9l-4.8-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.9 9-8.1c.4-.3-.1-.5-.6-.2L6.2 13.9l-4.8-1.5c-1-.3-1-1 .2-1.5L20.3 3.7c.9-.3 1.6.2 1.4-.5Z" /></svg>;
}

export function FarmView({ data, onRefresh }: FarmViewProps) {
  const navigate = useNavigate();
  const { signOut } = useAuthSession();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [fieldId, setFieldId] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState(false);
  const [deleteFarmOpen, setDeleteFarmOpen] = useState(false);
  const [deletingFarm, setDeletingFarm] = useState(false);
  const [telegram, setTelegram] = useState<TelegramStatus | null>(null);
  const [telegramBusy, setTelegramBusy] = useState(false);
  const [telegramError, setTelegramError] = useState<string | null>(null);
  const field = useMemo(
    () =>
      data.fieldBlocks.find((item) => item.fieldBlockId === fieldId) ?? null,
    [data.fieldBlocks, fieldId],
  );
  const batch = useMemo(
    () => data.cropBatches.find((item) => item.cropBatchId === batchId) ?? null,
    [data.cropBatches, batchId],
  );

  useEffect(() => {
    document.title = "Farm | TUNAS";
  }, []);
  useEffect(() => {
    let live = true;
    const load = () =>
      void getTelegramStatus()
        .then((status) => {
          if (live) {
            setTelegram(status);
            setTelegramError(null);
          }
        })
        .catch((reason) => {
          if (live)
            setTelegramError(
              reason instanceof Error
                ? reason.message
                : "Telegram status could not be loaded.",
            );
        });
    load();
    window.addEventListener("focus", load);
    return () => {
      live = false;
      window.removeEventListener("focus", load);
    };
  }, []);

  async function run(
    action: string,
    work: () => Promise<unknown>,
    success: string,
  ) {
    setBusyAction(action);
    setError(null);
    setDeleteError(false);
    try {
      await work();
      await onRefresh();
      setNotice(success);
      return true;
    } catch (reason) {
      setDeleteError(action === "delete");
      setError(
        reason instanceof Error
          ? reason.message
          : action === "delete"
            ? "We could not delete that item. Try again."
            : "We could not save that change. Try again.",
      );
      return false;
    } finally {
      setBusyAction(null);
    }
  }

  async function connectTelegram() {
    setTelegramBusy(true);
    setTelegramError(null);
    try {
      const result = await beginTelegramConnection();
      setTelegram(result);
      if (result.connectionUrl)
        window.open(result.connectionUrl, "_blank", "noopener,noreferrer");
    } catch (reason) {
      setTelegramError(
        reason instanceof Error
          ? reason.message
          : "The Telegram connection could not be started.",
      );
    } finally {
      setTelegramBusy(false);
    }
  }

  async function removeFarm() {
    setError(null);
    setDeletingFarm(true);
    try {
      await deleteFarm();
      signOut();
      navigate("/login", { replace: true });
    } catch (reason) {
      setDeleteError(true);
      setError(
        reason instanceof Error
          ? reason.message
          : "We could not delete your farm. Try again.",
      );
      setDeleteFarmOpen(false);
    } finally {
      setDeletingFarm(false);
    }
  }

  function openFieldDialog(
    next: "new-field" | "edit-field",
    nextField?: FieldBlock,
  ) {
    setFieldId(nextField?.fieldBlockId ?? null);
    setDialog(next);
  }
  function openBatchDialog(
    next: "new-batch" | "edit-batch",
    nextField: FieldBlock,
    nextBatch?: CropBatch,
  ) {
    setFieldId(nextField.fieldBlockId);
    setBatchId(nextBatch?.cropBatchId ?? null);
    setDialog(next);
  }
  const batchesFor = (blockId: string) =>
    data.cropBatches.filter((item) => item.fieldBlockId === blockId);

  return (
    <div className="grid gap-6">
      <header className="overflow-hidden rounded-lg border bg-card">
        <div className="bg-primary px-5 py-6 text-primary-foreground sm:px-7 sm:py-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div className="grid max-w-2xl gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                {data.farm.name}
              </h1>
            </div>
            <Button
              type="button"
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              icon={<Pencil aria-hidden="true" />}
              onClick={() => setDialog("farm")}
            >
              Edit farm
            </Button>
          </div>
        </div>
        <dl className="grid gap-3 px-5 py-5 text-sm sm:grid-cols-2 sm:px-7">
          <Fact
            label="Location"
            value={data.farm.location || "Not recorded"}
            icon={<MapPinned aria-hidden="true" />}
          />
          <Fact
            label="Timezone"
            value={data.farm.timezone}
            icon={<CalendarDays aria-hidden="true" />}
          />
          <Fact
            label="Workers"
            value={`${data.farm.defaultWorkerCount} people`}
            icon={<UsersRound aria-hidden="true" />}
          />
          <Fact
            label="Availability"
            value={availabilityLabel(data.farm.defaultWorkingHours)}
            icon={<CalendarDays aria-hidden="true" />}
          />
        </dl>
        <div className="grid gap-4 border-t px-5 py-4 sm:grid-cols-2 sm:px-7">
          <div><h2 className="text-sm font-bold text-foreground">Rain protection</h2><p className="mt-1 text-sm text-muted-foreground">{data.farm.rainProtectionAvailable === null ? "Not recorded" : data.farm.rainProtectionAvailable ? "Available" : "Not available"}</p></div>
          {data.farm.notes ? <div><h2 className="text-sm font-bold text-foreground">Notes</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{data.farm.notes}</p></div> : null}
        </div>
      </header>

      {notice ? (
        <Alert variant="success" aria-live="polite">
          <Sprout aria-hidden="true" />
          <AlertTitle>Saved</AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="danger" role="alert">
          <AlertTitle>
            {deleteError ? "Could not delete" : "Could not save changes"}
          </AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <section
        className="grid gap-4 rounded-lg border border-[#229ED9]/30 bg-[#229ED9]/[0.06] px-4 py-4 sm:flex sm:flex-row sm:items-center sm:justify-between"
        aria-labelledby="telegram-heading"
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#229ED9] text-white">
            <TelegramIcon />
          </span>
          <div className="min-w-0">
            <h2 id="telegram-heading" className="font-extrabold">
              {telegram?.connected
                ? "Telegram alerts connected"
                : "Telegram alerts"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {telegram?.connected
                ? `Mission alerts go to ${telegram.username ? `@${telegram.username}` : telegram.firstName || "this Telegram chat"}.`
                : "Connect once to receive rain alerts for active missions."}
            </p>
          </div>
        </div>
        {telegram?.connected ? (
          <div className="flex items-center gap-3">
            {telegram.botUrl ? (
              <a
                className="inline-flex min-h-10 items-center rounded-md border border-[#229ED9]/40 bg-card px-3 text-sm font-bold text-[#147EAD] transition-colors hover:bg-[#229ED9]/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#229ED9]/25"
                href={telegram.botUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Telegram bot
              </a>
            ) : null}
            <Badge variant="success">Connected</Badge>
          </div>
        ) : (
          <Button
            className="w-full sm:w-auto"
            type="button"
            size="sm"
            disabled={telegramBusy}
            isLoading={telegramBusy}
            loadingLabel="Opening Telegram"
            onClick={() => void connectTelegram()}
            icon={<TelegramIcon />}
          >
            Connect Telegram
          </Button>
        )}
      </section>
      {telegramError ? (
        <Alert variant="danger" role="alert">
          <AlertTitle>Telegram needs attention</AlertTitle>
          <AlertDescription>{telegramError}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4" aria-labelledby="field-blocks-heading">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2
              id="field-blocks-heading"
              className="text-2xl font-extrabold tracking-tight text-primary"
            >
              Field blocks
            </h2>
          </div>
          <Button
            type="button"
            icon={<Plus aria-hidden="true" />}
            onClick={() => openFieldDialog("new-field")}
          >
            Add field block
          </Button>
        </div>
        {data.fieldBlocks.length ? (
          <div className="grid gap-3">
            {data.fieldBlocks.map((block) => (
              <FieldBlockCard
                key={block.fieldBlockId}
                block={block}
                batches={batchesFor(block.fieldBlockId)}
                busyAction={busyAction}
                onEdit={() => openFieldDialog("edit-field", block)}
                onDelete={() =>
                  setDeleteTarget({ kind: "field", record: block })
                }
                onAddBatch={() => openBatchDialog("new-batch", block)}
                onEditBatch={(item) =>
                  openBatchDialog("edit-batch", block, item)
                }
                onDeleteBatch={(item) =>
                  setDeleteTarget({ kind: "batch", record: item })
                }
                onSaveReadiness={(item, readinessStatus) => run(`readiness-${item.cropBatchId}`, () => updateCropBatch(item.cropBatchId, { readinessStatus }), "Crop readiness updated.")}
              />
            ))}
          </div>
        ) : (
          <EmptyFields onAdd={() => openFieldDialog("new-field")} />
        )}
      </section>

      <section
        className="grid gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-5"
        aria-labelledby="danger-zone-heading"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-destructive">
            Danger zone
          </p>
          <h2
            id="danger-zone-heading"
            className="mt-1 text-xl font-extrabold tracking-tight text-foreground"
          >
            Delete this farm
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            This permanently deletes the farm, its field blocks, crop batches,
            missions, and connected Telegram and Calendar data. Your Google
            identity remains so you can sign in and onboard again.
          </p>
        </div>
        <Button
          type="button"
          variant="dangerOutline"
          className="w-fit"
          icon={<Trash2 aria-hidden="true" />}
          disabled={Boolean(busyAction) || deletingFarm}
          onClick={() => setDeleteFarmOpen(true)}
        >
          Delete farm
        </Button>
      </section>

      <FarmEditDialog
        open={dialog === "farm"}
        farm={data.farm}
        busy={busyAction === "farm"}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        onSave={(input) =>
          run("farm", () => updateFarm(input), "Farm details updated.")
        }
      />
      <FieldBlockDialog
        open={dialog === "new-field" || dialog === "edit-field"}
        block={dialog === "edit-field" ? field : null}
        busy={busyAction === "field"}
        serverError={error}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        onSave={async (input) => {
          const saved = await run(
            "field",
            () =>
              field
                ? updateFieldBlock(field.fieldBlockId, input)
                : createFieldBlock(input),
            field ? "Field block updated." : "Field block added.",
          );
          if (saved) setDialog(null);
          return saved;
        }}
      />
      <CropBatchDialog
        open={dialog === "new-batch" || dialog === "edit-batch"}
        field={field}
        batch={dialog === "edit-batch" ? batch : null}
        busy={busyAction === "batch"}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        onSave={async (input) => {
          const saved = await run(
            "batch",
            () =>
              batch
                ? updateCropBatch(batch.cropBatchId, input)
                : createCropBatch(input),
            batch ? "Crop batch updated." : "Crop batch added.",
          );
          if (saved) setDialog(null);
        }}
      />
      <DeleteDialog
        target={deleteTarget}
        busy={busyAction === "delete"}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={async () => {
          if (!deleteTarget) return;
          const saved = await run(
            "delete",
            () =>
              deleteTarget.kind === "field"
                ? deleteFieldBlock(deleteTarget.record.fieldBlockId)
                : deleteCropBatch(deleteTarget.record.cropBatchId),
            deleteTarget.kind === "field"
              ? "Field block deleted."
              : "Crop batch deleted.",
          );
          if (saved) setDeleteTarget(null);
        }}
      />
      <AlertDialog
        open={deleteFarmOpen}
        onOpenChange={(open) => {
          if (!deletingFarm) setDeleteFarmOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this farm?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the farm, missions, and connected
              Telegram and Calendar data. You can sign in with Google again, but
              you must reconnect Telegram. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingFarm}>
              Keep farm
            </AlertDialogCancel>
            <AlertDialogAction
              className="border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingFarm}
              onClick={(event) => {
                event.preventDefault();
                void removeFarm();
              }}
            >
              {deletingFarm ? "Deleting farm…" : "Delete farm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 gap-3 rounded-md bg-muted/45 px-4 py-3">
      <span className="mt-0.5 text-primary" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="font-semibold text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 break-words font-bold text-foreground">
          {value}
        </dd>
      </div>
    </div>
  );
}

function FieldBlockCard({
  block,
  batches,
  busyAction,
  onEdit,
  onDelete,
  onAddBatch,
  onEditBatch,
  onDeleteBatch,
  onSaveReadiness,
}: {
  block: FieldBlock;
  batches: CropBatch[];
  busyAction: string | null;
  onEdit: () => void;
  onDelete: () => void;
  onAddBatch: () => void;
  onEditBatch: (batch: CropBatch) => void;
  onDeleteBatch: (batch: CropBatch) => void;
  onSaveReadiness: (batch: CropBatch, readiness: "READY" | "NOT_READY") => Promise<boolean>;
}) {
  return (
    <article className="overflow-hidden rounded-lg border bg-card">
      <div className="grid gap-4 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(block.status)}>
              {titleStatus(block.status)}
            </Badge>
            <span className="text-sm font-bold tabular-nums text-muted-foreground">
              {formatArea(block.areaHectares)}
            </span>
          </div>
          <h3 className="mt-3 text-xl font-extrabold tracking-tight">
            {block.name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{batches.length} {batches.length === 1 ? "crop batch" : "crop batches"}</p>
          <details className="mt-3 text-sm text-muted-foreground"><summary className="w-fit cursor-pointer font-semibold text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30">Field details</summary><div className="mt-2 grid gap-2 border-l pl-3"><p className="flex flex-wrap items-center gap-1.5"><MapPinned className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />{block.coordinates.latitude.toFixed(5)}, {block.coordinates.longitude.toFixed(5)}</p>{block.notes ? <p className="max-w-3xl leading-6">{block.notes}</p> : null}</div></details>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            icon={<Pencil aria-hidden="true" />}
            disabled={Boolean(busyAction)}
            onClick={onEdit}
          >
            Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant="dangerOutline"
            icon={<Trash2 aria-hidden="true" />}
            disabled={Boolean(busyAction)}
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>
      </div>
      <details className="border-t" open={batches.length > 0}>
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-ring/30">
          <span className="flex items-center gap-2">
            <Sprout className="h-5 w-5 text-primary" aria-hidden="true" />
            Crop batches{" "}
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-sm tabular-nums text-primary">
              {batches.length}
            </span>
          </span>
          <ChevronDown
            className="h-5 w-5 text-muted-foreground transition-transform [[open]_&]:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="border-t px-5 pb-4">
          {batches.length ? (
            <div className="grid gap-3 py-3">{batches.map((batch) => (
              <CropBatchCard
                key={batch.cropBatchId}
                batch={batch}
                busy={Boolean(busyAction)}
                readinessBusy={busyAction === `readiness-${batch.cropBatchId}`}
                onEdit={() => onEditBatch(batch)}
                onDelete={() => onDeleteBatch(batch)}
                onSaveReadiness={(readiness) => onSaveReadiness(batch, readiness)}
              />
            ))}</div>
          ) : (
            <p className="py-4 text-sm leading-6 text-muted-foreground">
              No crop batches are recorded for this field yet.
            </p>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-4 w-fit"
            icon={<Plus aria-hidden="true" />}
            disabled={Boolean(busyAction)}
            onClick={onAddBatch}
          >
            Add crop batch
          </Button>
        </div>
      </details>
    </article>
  );
}

function CropBatchCard({
  batch,
  busy,
  readinessBusy,
  onEdit,
  onDelete,
  onSaveReadiness,
}: {
  batch: CropBatch;
  busy: boolean;
  readinessBusy: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSaveReadiness: (readiness: "READY" | "NOT_READY") => Promise<boolean>;
}) {
  const [readiness, setReadiness] = useState<"" | "READY" | "NOT_READY">(batch.readinessStatus ?? "");
  useEffect(() => setReadiness(batch.readinessStatus ?? ""), [batch.readinessStatus]);
  async function saveReadiness(next: "READY" | "NOT_READY") {
    setReadiness(next);
    if (!(await onSaveReadiness(next))) setReadiness(batch.readinessStatus ?? "");
  }
  return (
    <article className="rounded-md border bg-muted/20 p-4">
      <h4 className="text-base font-extrabold">
        {batch.variety || "Variety not recorded"}
      </h4>
      <p className="mt-1 text-sm font-semibold text-muted-foreground">
        {batch.crop} · {titleStatus(batch.status)}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {batch.plantingDate
          ? `Planted ${formatDate(batch.plantingDate)}`
          : "Planting date not recorded"}
      </p>
      {batch.notes ? (
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          {batch.notes}
        </p>
      ) : null}

      <div className="mt-4 border-t pt-4">
        <p id={`readiness-${batch.cropBatchId}`} className="text-sm font-bold">
          Readiness
        </p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby={`readiness-${batch.cropBatchId}`}>
          {(["READY", "NOT_READY"] as const).map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={readiness === option ? "primary" : "outline"}
              disabled={busy || readiness === option}
              isLoading={readinessBusy && readiness === option}
              loadingLabel="Saving readiness"
              aria-pressed={readiness === option}
              onClick={() => void saveReadiness(option)}
            >
              {option === "READY" ? "Ready" : "Not ready"}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          icon={<Pencil aria-hidden="true" />}
          disabled={busy}
          onClick={onEdit}
        >
          Edit
        </Button>
        <Button
          type="button"
          size="sm"
          variant="dangerOutline"
          icon={<Trash2 aria-hidden="true" />}
          disabled={busy}
          onClick={onDelete}
        >
          Delete
        </Button>
      </div>
    </article>
  );
}
function EmptyFields({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-lg border border-dashed bg-card px-5 py-9 text-center">
      <Sprout className="mx-auto h-7 w-7 text-primary" aria-hidden="true" />
      <h3 className="mt-3 font-bold">No field blocks yet</h3>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
        Start by adding the first field block, then attach its shallot crop
        batches.
      </p>
      <Button
        className="mt-4"
        type="button"
        icon={<Plus aria-hidden="true" />}
        onClick={onAdd}
      >
        Add field block
      </Button>
    </div>
  );
}

function FarmEditDialog({
  open,
  farm,
  busy,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  farm: FarmSnapshot["farm"];
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: FarmUpdate) => Promise<boolean>;
}) {
  const [windows, setWindows] = useState<WorkWindow[]>(() =>
    flattenHours(farm.defaultWorkingHours),
  );
  useEffect(() => {
    if (open) setWindows(flattenHours(farm.defaultWorkingHours));
  }, [farm, open]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void onSave({
      name: String(form.get("name") ?? "").trim(),
      location: optional(form.get("location")),
      notes: optional(form.get("notes")),
      timezone: String(form.get("timezone") ?? "").trim(),
      defaultWorkerCount: numeric(form.get("defaultWorkerCount")),
      rainProtectionAvailable: form.get("rainProtectionAvailable") === "unknown" ? null : form.get("rainProtectionAvailable") === "yes",
      defaultWorkingHours: windows.length ? groupHours(windows) : null,
      dryingProfile: {
        method: String(form.get("dryingMethod")) as NonNullable<
          FarmSnapshot["farm"]["dryingProfile"]
        >["method"],
        capacityKg: numeric(form.get("dryingCapacityKg")),
        protectedCapacityKg: numeric(form.get("protectedCapacityKg")),
        minDays: numeric(form.get("dryingMinDays")),
        maxDays: numeric(form.get("dryingMaxDays")),
      },
      schedulingDurations: {
        readinessCheckMinutes: numeric(form.get("readinessCheckMinutes")),
        harvestMinutes: numeric(form.get("harvestMinutes")),
        transferToDryingMinutes: numeric(form.get("transferToDryingMinutes")),
        beginDryingMinutes: numeric(form.get("beginDryingMinutes")),
        dryingInspectionMinutes: numeric(form.get("dryingInspectionMinutes")),
      },
    });
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit farm</DialogTitle>
          <DialogDescription>
            Reusable work and drying details keep mission creation short.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="Farm name" required>
              <Input name="name" required defaultValue={farm.name} />
            </FieldGroup>
            <FieldGroup
               label="Workers"
              required
              helper="People usually available for farm work."
            >
              <Input
                name="defaultWorkerCount"
                type="number"
                min="1"
                step="1"
                required
                defaultValue={farm.defaultWorkerCount}
              />
            </FieldGroup>
            <FieldGroup label="Location">
              <Input name="location" defaultValue={farm.location ?? ""} />
            </FieldGroup>
            <FieldGroup label="Timezone" required>
              <Input name="timezone" required defaultValue={farm.timezone} />
            </FieldGroup>
            <FieldGroup label="Rain protection" helper="Covered space or a tarpaulin normally available.">
              <select name="rainProtectionAvailable" className="min-h-11 rounded-md border bg-card px-3" defaultValue={farm.rainProtectionAvailable === null ? "unknown" : farm.rainProtectionAvailable ? "yes" : "no"}>
                <option value="unknown">Not recorded</option>
                <option value="yes">Available</option>
                <option value="no">Not available</option>
              </select>
            </FieldGroup>
          </div>
          <section className="grid gap-3 rounded-lg border bg-muted/35 p-4">
            <div>
              <h3 className="font-bold">Drying profile</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Used automatically for new missions.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldGroup label="Drying method" required>
                <select
                  name="dryingMethod"
                  required
                  className="min-h-11 rounded-md border bg-card px-3"
                  defaultValue={farm.dryingProfile?.method ?? "FIELD_SUN"}
                >
                  <option value="FIELD_SUN">Field sun</option>
                  <option value="RACK_SUN">Rack sun</option>
                  <option value="COVERED_VENTILATED">Covered ventilated</option>
                  <option value="INSTORE">In-store</option>
                </select>
              </FieldGroup>
              <FieldGroup label="Drying capacity (kg)" required>
                <Input
                  name="dryingCapacityKg"
                  type="number"
                  min="0.001"
                  step="0.001"
                  required
                  defaultValue={farm.dryingProfile?.capacityKg ?? ""}
                />
              </FieldGroup>
              <FieldGroup label="Protected capacity (kg)" required>
                <Input
                  name="protectedCapacityKg"
                  type="number"
                  min="0"
                  step="0.001"
                  required
                  defaultValue={farm.dryingProfile?.protectedCapacityKg ?? 0}
                />
              </FieldGroup>
              <FieldGroup label="Typical minimum (days)" required>
                <Input
                  name="dryingMinDays"
                  type="number"
                  min="1"
                  step="1"
                  required
                  defaultValue={farm.dryingProfile?.minDays ?? ""}
                />
              </FieldGroup>
              <FieldGroup label="Typical maximum (days)" required>
                <Input
                  name="dryingMaxDays"
                  type="number"
                  min="1"
                  step="1"
                  required
                  defaultValue={farm.dryingProfile?.maxDays ?? ""}
                />
              </FieldGroup>
            </div>
          </section>
          <FieldGroup label="Farm notes">
            <Textarea
              name="notes"
              className="min-h-20"
              defaultValue={farm.notes ?? ""}
            />
          </FieldGroup>
          <section className="grid gap-3 rounded-lg border bg-muted/35 p-4">
            <div><h3 className="font-bold">Activity durations</h3><p className="mt-1 text-sm text-muted-foreground">Fixed minutes used to build non-overlapping mission schedules.</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <DurationInput name="readinessCheckMinutes" label="Readiness check" value={farm.schedulingDurations.readinessCheckMinutes} />
              <DurationInput name="harvestMinutes" label="Harvest" value={farm.schedulingDurations.harvestMinutes} />
              <DurationInput name="transferToDryingMinutes" label="Transfer to drying" value={farm.schedulingDurations.transferToDryingMinutes} />
              <DurationInput name="beginDryingMinutes" label="Begin drying" value={farm.schedulingDurations.beginDryingMinutes} />
              <DurationInput name="dryingInspectionMinutes" label="Drying inspection" value={farm.schedulingDurations.dryingInspectionMinutes} />
            </div>
          </section>
          <WorkWindows windows={windows} onChange={setWindows} />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={busy} loadingLabel="Saving farm">
              Save farm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DurationInput({ name, label, value }: { name: string; label: string; value: number }) {
  return <FieldGroup label={`${label} (minutes)`} required><Input name={name} type="number" min="1" step="1" required defaultValue={value} /></FieldGroup>;
}

function FieldBlockDialog({
  open,
  block,
  busy,
  serverError,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  block: FieldBlock | null;
  busy: boolean;
  serverError: string | null;
  onOpenChange: (open: boolean) => void;
  onSave: (input: FieldBlockInput) => Promise<boolean>;
}) {
  const [errors, setErrors] = useState<
    Partial<Record<"name" | "latitude" | "longitude" | "areaHectares", string>>
  >({});
  useEffect(() => {
    if (open) setErrors({});
  }, [open, block]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = validateFieldBlockForm({
      name: String(form.get("name") ?? ""),
      latitude: String(form.get("latitude") ?? ""),
      longitude: String(form.get("longitude") ?? ""),
      areaHectares: String(form.get("areaHectares") ?? ""),
      notes: String(form.get("notes") ?? ""),
      status: String(form.get("status") ?? ""),
    });
    setErrors(result.errors);
    if (!result.input) {
      const target = event.currentTarget.elements.namedItem(
        result.firstInvalid ?? "latitude",
      );
      if (target instanceof HTMLElement) target.focus();
      return;
    }
    void onSave(result.input);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {block ? "Edit field block" : "Add field block"}
          </DialogTitle>
          <DialogDescription>
            A field block needs a name and a map location. Crop batches are
            added after the field exists.
          </DialogDescription>
        </DialogHeader>
        {serverError && !Object.keys(errors).length ? (
          <Alert variant="danger" role="alert">
            <AlertTitle>Could not save field</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        ) : null}
        <form noValidate className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="Field block name" required error={errors.name}>
              <Input
                name="name"
                required
                aria-invalid={Boolean(errors.name)}
                defaultValue={block?.name ?? ""}
              />
            </FieldGroup>
            <FieldGroup label="Area (hectares)" error={errors.areaHectares}>
              <Input
                name="areaHectares"
                type="number"
                min="0.01"
                step="0.01"
                aria-invalid={Boolean(errors.areaHectares)}
                defaultValue={block?.areaHectares ?? ""}
              />
            </FieldGroup>
            <FieldGroup label="Latitude" required error={errors.latitude}>
              <Input
                name="latitude"
                type="number"
                min="-90"
                max="90"
                step="any"
                required
                aria-invalid={Boolean(errors.latitude)}
                defaultValue={block?.coordinates.latitude ?? ""}
              />
            </FieldGroup>
            <FieldGroup label="Longitude" required error={errors.longitude}>
              <Input
                name="longitude"
                type="number"
                min="-180"
                max="180"
                step="any"
                required
                aria-invalid={Boolean(errors.longitude)}
                defaultValue={block?.coordinates.longitude ?? ""}
              />
            </FieldGroup>
          </div>
          <FieldGroup label="Status">
            <Input
              name="status"
              defaultValue={block?.status ?? ""}
              placeholder="active"
            />
          </FieldGroup>
          <FieldGroup label="Field notes">
            <Textarea
              name="notes"
              className="min-h-20"
              defaultValue={block?.notes ?? ""}
            />
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={busy} loadingLabel="Saving field">
              {block ? "Save field" : "Add field"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CropBatchDialog({
  open,
  field,
  batch,
  busy,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  field: FieldBlock | null;
  batch: CropBatch | null;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: CropBatchInput) => Promise<void>;
}) {
  if (!field) return null;
  const selectedField = field;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void onSave({
      fieldBlockId: selectedField.fieldBlockId,
      variety: optional(form.get("variety")),
      plantingDate: optional(form.get("plantingDate")),
      notes: optional(form.get("notes")),
      readinessStatus: String(form.get("readinessStatus")) as "READY" | "NOT_READY",
      ...(optional(form.get("status"))
        ? { status: String(form.get("status")).trim() }
        : {}),
    });
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {batch ? "Edit crop batch" : "Add crop batch"}
          </DialogTitle>
          <DialogDescription>
            This shallot crop batch will belong to {field.name}.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submit}>
          <FieldGroup label="Variety">
            <Input
              name="variety"
              defaultValue={batch?.variety ?? ""}
              placeholder="Bima Brebes"
            />
          </FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="Planting date">
              <Input
                name="plantingDate"
                type="date"
                defaultValue={batch?.plantingDate ?? ""}
              />
            </FieldGroup>
            <FieldGroup label="Status">
              <Input
                name="status"
                defaultValue={batch?.status ?? ""}
                placeholder="active"
              />
            </FieldGroup>
            <FieldGroup label="Readiness" required>
              <select name="readinessStatus" required className="min-h-11 rounded-md border bg-card px-3" defaultValue={batch?.readinessStatus ?? ""}>
                <option value="" disabled>Select readiness</option>
                <option value="READY">Ready</option>
                <option value="NOT_READY">Not ready</option>
              </select>
            </FieldGroup>
          </div>
          <FieldGroup label="Batch notes">
            <Textarea
              name="notes"
              className="min-h-20"
              defaultValue={batch?.notes ?? ""}
            />
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={busy}
              loadingLabel="Saving crop batch"
            >
              {batch ? "Save crop batch" : "Add crop batch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({
  target,
  busy,
  onOpenChange,
  onConfirm,
}: {
  target: DeleteTarget;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}) {
  const field = target?.kind === "field";
  return (
    <AlertDialog open={Boolean(target)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {field ? "Delete this field block?" : "Delete this crop batch?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {field
              ? "This permanently deletes the field block, its crop batches, and every linked mission."
              : "This permanently deletes this crop batch and every linked mission."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              type="button"
              variant="danger"
              isLoading={busy}
              loadingLabel="Deleting"
              onClick={() => void onConfirm()}
            >
              Delete
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function WorkWindows({
  windows,
  onChange,
}: {
  windows: WorkWindow[];
  onChange: (windows: WorkWindow[]) => void;
}) {
  return (
    <section className="grid gap-3 rounded-lg border bg-muted/35 p-4">
      <div>
        <h3 className="font-bold">Work windows</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Optional availability used for planning.
        </p>
      </div>
      {windows.map((window) => (
        <div
          key={window.id}
          className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2.75rem] gap-2"
        >
          <select
            aria-label="Weekday"
            className="min-h-11 rounded-md border bg-card px-2"
            value={window.day}
            onChange={(event) =>
              onChange(
                windows.map((item) =>
                  item.id === window.id
                    ? { ...item, day: event.target.value as keyof WorkingHours }
                    : item,
                ),
              )
            }
          >
            {weekdays.map((day) => (
              <option key={day} value={day}>
                {day[0].toUpperCase()}
                {day.slice(1)}
              </option>
            ))}
          </select>
          <Input
            aria-label="Start time"
            type="time"
            required
            value={window.start}
            onChange={(event) =>
              onChange(
                windows.map((item) =>
                  item.id === window.id
                    ? { ...item, start: event.target.value }
                    : item,
                ),
              )
            }
          />
          <Input
            aria-label="End time"
            type="time"
            required
            value={window.end}
            onChange={(event) =>
              onChange(
                windows.map((item) =>
                  item.id === window.id
                    ? { ...item, end: event.target.value }
                    : item,
                ),
              )
            }
          />
          <Button
            type="button"
            size="icon"
            variant="dangerOutline"
            aria-label="Remove work window"
            onClick={() =>
              onChange(windows.filter((item) => item.id !== window.id))
            }
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="w-fit"
        icon={<Plus aria-hidden="true" />}
        onClick={() =>
          onChange([
            ...windows,
            { id: `window-${Date.now()}`, day: "monday", start: "", end: "" },
          ])
        }
      >
        Add window
      </Button>
    </section>
  );
}
function flattenHours(hours: WorkingHours | null) {
  return Object.entries(hours ?? {}).flatMap(
    ([day, ranges]) =>
      ranges?.map((range, index) => ({
        id: `${day}-${index}`,
        day: day as keyof WorkingHours,
        ...range,
      })) ?? [],
  );
}
function groupHours(windows: WorkWindow[]) {
  const result: WorkingHours = {};
  for (const window of windows)
    (result[window.day] ??= []).push({ start: window.start, end: window.end });
  return result;
}
function availabilityLabel(hours: WorkingHours | null) {
  const count = Object.values(hours ?? {}).reduce(
    (total, ranges) => total + (ranges?.length ?? 0),
    0,
  );
  return count
    ? `${count} time window${count === 1 ? "" : "s"}`
    : "Not recorded";
}
