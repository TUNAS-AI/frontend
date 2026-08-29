import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { advanceMissionStage, completeMissionStep, confirmMissionCloseout, deleteMission, getMission, saveMissionCloseout, type Mission, type MissionCloseoutInput } from "@/api/missions";
import { AppShell } from "@/components/app/AppShell";
import { productNavigationItems } from "@/components/app/productNavigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { LoadingShell } from "@/components/ui/LoadingShell";
import { MissionDetailView } from "@/features/missions/MissionDetailView";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export function MissionDetailRoute() {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const [mission, setMission] = useState<Mission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const load = useCallback(async () => { if (!missionId) return; setLoading(true); setError(null); try { setMission(await getMission(missionId)); } catch (reason) { setError(reason instanceof Error ? reason.message : "We could not load this mission. Try again."); } finally { setLoading(false); } }, [missionId]);
  useEffect(() => { void load(); }, [load]);
  async function remove() {
    if (!mission) return;
    setDeleting(true); setDeleteError(null);
    try { const result = await deleteMission(mission.missionId); if (result.calendarCleanup.failed) toast.warning("Mission deleted", { description: `${result.calendarCleanup.failed} TUNAS calendar event${result.calendarCleanup.failed === 1 ? "" : "s"} could not be removed.` }); navigate("/missions"); }
    catch (reason) { setDeleteError(reason instanceof Error ? reason.message : "We could not delete this mission. Try again."); setDeleteOpen(false); }
    finally { setDeleting(false); }
  }
  async function update(actionName: string, work: () => Promise<Mission>) {
    setAction(actionName); setActionError(null);
    try { setMission(await work()); }
    catch (reason) { setActionError(reason instanceof Error ? reason.message : "We could not update this mission. Try again."); }
    finally { setAction(null); }
  }

  return <AppShell activeItem="missions" navigationItems={productNavigationItems}>{loading ? <LoadingShell label="Loading mission…" /> : null}{error ? <Alert variant="danger" role="alert"><AlertTitle>Mission unavailable</AlertTitle><AlertDescription>{error}</AlertDescription><Button className="mt-3 w-fit" type="button" variant="outline" onClick={() => void load()}>Retry</Button></Alert> : null}{deleteError ? <Alert variant="danger" role="alert"><AlertTitle>Mission deletion failed</AlertTitle><AlertDescription>{deleteError}</AlertDescription></Alert> : null}{actionError ? <Alert variant="danger" role="alert"><AlertTitle>Mission update failed</AlertTitle><AlertDescription>{actionError}</AlertDescription></Alert> : null}{mission && !loading ? <div className="motion-enter"><MissionDetailView mission={mission} onDelete={() => setDeleteOpen(true)} deleting={deleting} action={action} onAdvance={(stage) => void update(stage, () => advanceMissionStage(mission.missionId, stage))} onCompleteStep={(stepId) => void update(stepId, () => completeMissionStep(mission.missionId, stepId))} onSaveCloseout={(values: MissionCloseoutInput) => void update("closeout", () => saveMissionCloseout(mission.missionId, values))} onConfirmCloseout={() => void update("confirm-closeout", () => confirmMissionCloseout(mission.missionId))} /></div> : null}<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this mission?</AlertDialogTitle><AlertDialogDescription>This permanently removes the mission, its plan, schedule, and recorded outcome, including TUNAS events saved in Google Calendar. This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={deleting}>Keep mission</AlertDialogCancel><AlertDialogAction className="border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleting} onClick={(event) => { event.preventDefault(); void remove(); }}>{deleting ? "Deleting…" : "Delete mission"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></AppShell>;
}
