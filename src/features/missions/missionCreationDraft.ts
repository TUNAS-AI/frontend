import type { MissionPlanPreview, MissionPreviewCandidate } from "@/api/missions";

export type MissionCreationDraft = { candidate: MissionPreviewCandidate | null; planPreview: MissionPlanPreview | null; selectedPlanId: string | null };
const key = "tunas:mission-creation-draft:v1";

function storage() { try { return window.sessionStorage; } catch { return null; } }

function restoreCandidate(candidate: MissionPreviewCandidate | null) {
  if (!candidate) return null;
  const { maturity: _maturity, ...facts } = candidate.facts as MissionPreviewCandidate["facts"] & { maturity?: unknown };
  const legacyGrade = facts.marketQuality as string | null;
  const marketQuality = legacyGrade === "A" ? "Grade A" : legacyGrade === "B" ? "Grade B" : legacyGrade === "C" ? "Grade C" : facts.marketQuality;
  return { ...candidate, facts: { ...facts, marketQuality } };
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

function editKey(missionId: string) { return `tunas:mission-edit-draft:v1:${missionId}`; }
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
