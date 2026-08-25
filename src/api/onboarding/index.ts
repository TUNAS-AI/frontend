import { apiFetch } from "@/api/http";
import type { OnboardingPayload } from "@/features/auth/onboarding";

type ApiErrorBody = { error?: string };

export async function submitOnboarding(payload: OnboardingPayload) {
  const response = await apiFetch("/api/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.json().catch((): ApiErrorBody => ({}));
    throw new Error(body.error || "We could not save your farm setup. Try again.");
  }
  return response.json() as Promise<{ farmId: string }>;
}
