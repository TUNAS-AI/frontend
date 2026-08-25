import { API_URL, apiFetch } from "@/api/http";
import { completeGoogleCallback, getPostAuthenticationPath } from "@/features/auth/authSession";
import type { AuthPageCopy } from "@/features/auth/types";

export {
  DEMO_ONBOARDING_PAGE_COPY as onboardingPageCopy,
} from "./mockSupport/demoAuthData";

export const authPageCopy: AuthPageCopy = {
  brandName: "TUNAS",
  brandTagline: "Shallot harvest planning for Indonesian farms",
  headline: "Plan every harvest with confidence.",
  description: "Keep farm, field, shallot batch, and buyer details clear and ready for daily work.",
  loginTitle: "Sign in to TUNAS",
  loginDescription: "Continue to your farm's harvest plans and decisions.",
  googleSignInLabel: "Continue with Google",
  privacyNote: "We use your Google account only to sign you in.",
};

export function startGoogleSignIn() {
  window.location.assign(`${API_URL}/api/auth/google`);
}

export async function completeFrontendGoogleCallback(fragment: string) {
  return completeGoogleCallback(fragment, apiFetch);
}

export { getPostAuthenticationPath };
