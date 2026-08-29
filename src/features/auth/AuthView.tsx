import { useState } from "react";
import { LockKeyhole } from "lucide-react";
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
    <main className="auth-shell motion-enter grid min-h-dvh bg-card text-foreground lg:grid-cols-[minmax(0,1.18fr)_minmax(28rem,0.82fr)]">
      <section className="auth-mobile-hero relative h-32 overflow-hidden sm:h-40 lg:hidden" aria-hidden="true">
        <img
          src="/images/tunas-login-harvest-hero.png"
          alt=""
          className="h-full w-full object-cover object-[62%_54%]"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-700/25 via-transparent to-transparent" />
      </section>

      <section className="auth-hero relative hidden min-h-dvh overflow-hidden lg:block" aria-label="About TUNAS">
          <img
            src="/images/tunas-login-harvest-hero.png"
            alt="A farmer inspecting freshly harvested shallots in a field"
            className="absolute inset-0 h-full w-full object-cover object-[58%_center]"
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-forest-700/85 via-forest-700/48 to-[#132719]/84" aria-hidden="true" />
          <div className="relative flex min-h-dvh flex-col px-10 py-10 xl:px-16 xl:py-14">
            <div className="flex items-center gap-3" aria-label={copy.brandName}>
              <img src="/images/tunas-ai-logo-white.png" alt="TUNAS" className="h-16 w-auto object-contain xl:h-20" />
            </div>
            <div className="mt-auto max-w-xl pb-5">
              <p className="auth-hero-eyebrow text-sm font-bold tracking-[0.16em] text-leaf-100">HARVEST, WITH A CLEAR PLAN</p>
              <h2 className="auth-hero-headline mt-4 text-balance text-5xl font-extrabold leading-[1.04] tracking-[-0.055em] text-white xl:text-6xl">
                {copy.headline.split(/(harvest)/i).map((part, index) => part.toLowerCase() === "harvest" ? (
                  <span key={index} className="bg-gradient-to-r from-leaf-100 via-leaf-300 to-[#88c978] bg-clip-text text-transparent">{part}</span>
                ) : part)}
              </h2>
              <p className="auth-hero-description mt-5 max-w-md text-base font-medium leading-7 text-white/85">{copy.description}</p>
            </div>
          </div>
      </section>

      <section className="auth-panel relative flex min-h-[calc(100dvh-8rem)] flex-col overflow-hidden bg-[#fbfaf5] px-6 py-8 sm:px-10 sm:py-10 lg:grid lg:min-h-dvh lg:place-items-center lg:px-14" aria-label="TUNAS sign in">
        <div className="absolute right-0 top-0 h-72 w-72 translate-x-1/2 -translate-y-1/2 rounded-full bg-leaf-100/55 blur-3xl" aria-hidden="true" />
        <div className="relative w-full max-w-md lg:-translate-y-8">
          <div className="flex lg:hidden" aria-label={copy.brandName}>
            <img src="/images/tunas-ai-logo.png" alt="TUNAS" className="h-16 w-auto object-contain" />
          </div>
          <div className="mt-8 lg:mt-0">
            <p className="text-xs font-bold tracking-[0.16em] text-leaf-700">WELCOME BACK</p>
            <h1 className="mt-3 text-balance text-4xl font-extrabold tracking-[-0.05em] text-forest-700 sm:text-[2.75rem]">{copy.loginTitle}</h1>
            <p className="mt-4 max-w-sm text-sm font-medium leading-6 text-muted-foreground">{copy.loginDescription}</p>
          </div>
          <Button type="button" className="mt-10 min-h-14 w-full rounded-xl text-base hover:-translate-y-0.5 hover:shadow-lift active:translate-y-0" variant="outline" icon={<GoogleMark />} isLoading={busy} loadingLabel="Opening Google sign-in" onClick={signIn}>
            {copy.googleSignInLabel}
          </Button>
          <p className="mt-7 flex max-w-sm items-start gap-2 text-xs font-medium leading-5 text-muted-foreground"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" aria-hidden="true" />{copy.privacyNote}</p>
        </div>
        <aside className="auth-assistant pointer-events-none mt-10 flex w-full items-end justify-end lg:absolute lg:bottom-0 lg:right-0 lg:mt-0" aria-label="TUNAS AI assistant">
          <div className="relative z-10 mr-4 -translate-y-5 sm:mr-6 sm:-translate-y-8 lg:mr-10 lg:-translate-y-12">
            <div className="auth-chat-bubble relative max-w-[12.5rem] rounded-2xl rounded-br-sm bg-forest-600 px-4 py-3 text-xs leading-5 text-white shadow-lift ring-1 ring-forest-700/15 after:absolute after:-bottom-5 after:right-0 after:h-6 after:w-8 after:bg-forest-600 after:[clip-path:polygon(0_0,100%_0,100%_100%)] after:content-[''] sm:max-w-[20rem] sm:px-5 sm:py-4 sm:text-sm sm:leading-6">
              <p className="font-semibold text-white">TUNAS AI helps turn field conditions into a plan you can review and approve.</p>
            </div>
          </div>
          <img src="/images/mascot-peeking.png" alt="TUNAS AI mascot waving beside its message below the sign-in form" className="auth-mascot-peek -mr-8 -mb-8 h-28 w-auto object-contain sm:-mr-12 sm:-mb-10 sm:h-40 lg:-mr-3 lg:mb-0 lg:h-56" />
        </aside>
      </section>
    </main>
  );
}
