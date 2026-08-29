export const ASSISTANT_PREFILL_EVENT = "tunas:assistant-prefill";
export const LEGACY_ASSISTANT_PREFILL_EVENT = "hijau-ai:assistant-prefill";

export function openTunasAssistantWithDraft(draft: string) {
  window.dispatchEvent(new CustomEvent<string>(ASSISTANT_PREFILL_EVENT, { detail: draft }));
}

/** @deprecated Use openTunasAssistantWithDraft. */
export const openLegacyAssistantWithDraft = openTunasAssistantWithDraft;
