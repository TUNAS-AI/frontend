import { useState } from "react";
import { LockKeyhole, Sprout } from "lucide-react";
import { startGoogleSignIn } from "@/api/auth";
import { Button } from "@/components/ui/Button";
import type { AuthPageCopy } from "./types";

type AuthViewProps = {
  copy: AuthPageCopy;
};

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5a4.7 4.7 0 0 1-2 3.1v2.5h3.2c1.9-1.8 3.1-4.4 3.1-7.4Z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.2-2.5c-.9.6-2 .9-3.5.9-2.7 0-5-1.8-5.8-4.3H2.9v2.6A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.2 13.7a6 6 0 0 1 0-3.4V7.7H2.9a10 10 0 0 0 0 8.6l3.3-2.6Z" />
      <path fill="#EA4335" d="M12 6c1.5 0 2.9.5 3.9 1.5l2.9-2.9C17 2.9 14.7 2 12 2a10 10 0 0 0-9.1 5.7l3.3 2.6C7 7.8 9.3 6 12 6Z" />
    </svg>
  );
}

export function AuthView({ copy }: AuthViewProps) {
  const [busy, setBusy] = useState(false);

  function signIn() {
    setBusy(true);
    startGoogleSignIn();
  }

  return (
    <main className="auth-shell motion-enter grid min-h-dvh place-items-center bg-background p-4 text-foreground sm:p-6">
      <section className="auth-frame grid w-full max-w-6xl overflow-hidden rounded-2xl border bg-card shadow-farm md:grid-cols-[1.05fr_1fr]" aria-label="TUNAS sign in">
        <div className="auth-hero relative hidden min-h-[30rem] overflow-hidden md:block">
          <img
            src="/images/tunas-login-harvest-hero.png"
            alt="A farmer inspecting freshly harvested shallots in a field"
            className="absolute inset-0 h-full w-full object-cover object-[58%_center]"
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-forest-700/80 via-black/55 to-black/30" aria-hidden="true" />
          <div className="relative max-w-md px-8 py-10 lg:px-12 lg:py-14">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-forest-700 text-white shadow-lift"><Sprout className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <p className="font-extrabold tracking-[0.06em] text-white">{copy.brandName}</p>
                <p className="mt-0.5 text-xs font-semibold text-white/80">{copy.brandTagline}</p>
              </div>
            </div>
            <p className="mt-12 text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] text-white lg:text-5xl">{copy.headline}</p>
            <p className="mt-4 max-w-sm text-base font-medium leading-7 text-white/80">{copy.description}</p>
          </div>
        </div>

        <div className="auth-panel grid place-items-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-sm">
            <div className="flex justify-center md:hidden"><span className="grid h-11 w-11 place-items-center rounded-xl bg-forest-700 text-white shadow-lift"><Sprout className="h-5 w-5" aria-hidden="true" /></span></div>
            <div className="text-center">
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-leaf-700 md:mt-0">Welcome back</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.04em] text-forest-700">{copy.loginTitle}</h1>
              <p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">{copy.loginDescription}</p>
            </div>
            <Button type="button" className="mt-9 min-h-14 w-full rounded-xl text-base" variant="outline" icon={<GoogleMark />} isLoading={busy} loadingLabel="Opening Google sign-in" onClick={signIn}>
              {copy.googleSignInLabel}
            </Button>
            <p className="mt-7 flex items-center justify-center gap-2 text-center text-xs font-medium leading-5 text-muted-foreground"><LockKeyhole className="h-4 w-4 shrink-0 text-forest-700" aria-hidden="true" />{copy.privacyNote}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
