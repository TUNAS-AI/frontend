import { useEffect, useRef, useState } from "react";
import { AlertCircle, Sprout } from "lucide-react";
import { useNavigate } from "react-router";
import { completeFrontendGoogleCallback, getPostAuthenticationPath } from "@/api/auth";
import { Button } from "@/components/ui/Button";
import { useAuthSession } from "@/features/auth/useAuthSession";

export function AuthCallbackRoute() {
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const navigate = useNavigate();
  const { saveSession } = useAuthSession();

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const fragment = window.location.hash;
    window.history.replaceState(null, "", window.location.pathname);
    void completeFrontendGoogleCallback(fragment)
      .then((session) => {
        if (!saveSession(session)) throw new Error("Your browser could not save the sign-in session. Please allow session storage and try again.");
        navigate(getPostAuthenticationPath(session), { replace: true });
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Google sign-in could not be completed. Please try again."));
  }, [navigate, saveSession]);

  return (
    <main className="grid min-h-dvh place-items-center bg-background p-5 text-foreground">
      <section className="w-full max-w-md rounded-2xl border bg-card p-7 text-center shadow-farm" aria-live="polite">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-forest-700 text-white shadow-lift"><Sprout className="h-5 w-5" aria-hidden="true" /></span>
        {error ? (
          <>
            <AlertCircle className="mx-auto mt-5 h-6 w-6 text-destructive" aria-hidden="true" />
            <h1 className="mt-3 text-xl font-extrabold text-forest-700">Google sign-in could not finish</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{error}</p>
            <Button className="mt-6 w-full" onClick={() => navigate("/login", { replace: true })}>Back to sign in</Button>
          </>
        ) : (
          <>
            <h1 className="mt-5 text-xl font-extrabold text-forest-700">Signing you in</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Checking your account and farm setup.</p>
          </>
        )}
      </section>
    </main>
  );
}
