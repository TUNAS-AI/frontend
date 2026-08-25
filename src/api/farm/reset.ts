import { apiFetch } from "../http.ts";

type ApiErrorBody = { error?: string };

export async function deleteFarmForOnboardingReset() {
  const response = await apiFetch("/api/farm", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmation: "DELETE_FARM" }),
  });
  if (response.ok) return;
  const body = await response.json().catch((): ApiErrorBody => ({}));
  throw new Error(body.error || "We could not reset your farm setup. Try again.");
}
