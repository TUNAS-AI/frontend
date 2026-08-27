import { onboardingPageCopy } from "@/api/auth";
import { OnboardingView } from "@/features/auth/OnboardingView";
import { useNavigate } from "react-router";
import { useAuthSession } from "@/features/auth/useAuthSession";

export function OnboardingRoute() {
  const navigate = useNavigate();
  const { session, saveSession } = useAuthSession();
  if (!session) return null;

  return (
    <OnboardingView
      copy={onboardingPageCopy}
      session={session}
      onComplete={() => {
        if (!saveSession({ ...session, hasFarm: true, sourceLabel: "Backend onboarding" })) return false;
        navigate("/today");
        return true;
      }}
    />
  );
}
