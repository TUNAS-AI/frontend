import type { MissionPlanPreview, MissionPreviewCandidate } from "@/api/missions";

export type MissionCreationDraft = { candidate: MissionPreviewCandidate | null; planPreview: MissionPlanPreview | null; selectedPlanId: string | null };
const key = "tunas:mission-creation-draft:v2";

function storage() { try { return window.sessionStorage; } catch { return null; } }

function restoreCandidate(candidate: MissionPreviewCandidate | null) {
  if (!candidate) return null;
  return "readinessStatus" in candidate.facts && "dryingEstimatedMaxDays" in candidate.facts ? candidate : null;
}

export function restoreMissionCreationDraft(): MissionCreationDraft {
  try {
    const value = storage()?.getItem(key);
    if (!value) return { candidate: null, planPreview: null, selectedPlanId: null };
    const parsed = JSON.parse(value) as MissionCreationDraft;
    if (!parsed || typeof parsed !== "object") throw new Error("Invalid mission draft");
    const planPreview = parsed.planPreview?.status === "feasible" || parsed.planPreview?.status === "infeasible" ? parsed.planPreview : null;
    return { candidate: restoreCandidate(parsed.candidate ?? null), planPreview, selectedPlanId: planPreview?.status === "feasible" ? parsed.selectedPlanId ?? null : null };
  } catch { storage()?.removeItem(key); return { candidate: null, planPreview: null, selectedPlanId: null }; }
}

export function persistMissionCreationDraft(draft: MissionCreationDraft) { try { storage()?.setItem(key, JSON.stringify(draft)); } catch { /* Draft recovery is best effort. */ } }
export function clearMissionCreationDraft() { try { storage()?.removeItem(key); } catch { /* Storage can be unavailable. */ } }

function editKey(missionId: string) { return `tunas:mission-edit-draft:v2:${missionId}`; }
export function restoreMissionEditDraft(missionId: string): MissionCreationDraft {
  try {
    const value = storage()?.getItem(editKey(missionId));
    if (!value) return { candidate: null, planPreview: null, selectedPlanId: null };
    const parsed = JSON.parse(value) as MissionCreationDraft;
    const planPreview = parsed.planPreview?.status === "feasible" || parsed.planPreview?.status === "infeasible" ? parsed.planPreview : null;
    return { candidate: restoreCandidate(parsed.candidate ?? null), planPreview, selectedPlanId: planPreview?.status === "feasible" ? parsed.selectedPlanId ?? null : null };
  } catch { storage()?.removeItem(editKey(missionId)); return { candidate: null, planPreview: null, selectedPlanId: null }; }
}
export function persistMissionEditDraft(missionId: string, draft: MissionCreationDraft) { try { storage()?.setItem(editKey(missionId), JSON.stringify(draft)); } catch { /* Draft recovery is best effort. */ } }
export function clearMissionEditDraft(missionId: string) { try { storage()?.removeItem(editKey(missionId)); } catch { /* Storage can be unavailable. */ } }
