import { MapPinned, Sprout, UserRound } from "lucide-react";
import type { UserProfile } from "@/types/userProfile";

export function AppIdentityPanel({ profile }: { profile: UserProfile }) {
  const initials = profile.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <section aria-label="TUNAS farm account" className="overflow-hidden rounded-2xl border border-forest-300/70 bg-card shadow-farm">
      <div className="relative overflow-hidden bg-forest-700 px-4 pb-4 pt-4 text-white">
        <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full border border-white/10 bg-white/5" aria-hidden="true" />
        <div className="absolute -bottom-14 left-14 h-24 w-24 rounded-full bg-forest-500/40 blur-2xl" aria-hidden="true" />
        <div className="relative flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/15 bg-white/10 shadow-inner"><Sprout className="h-5 w-5" aria-hidden="true" /></span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">TUNAS</p>
            <p className="mt-0.5 text-sm font-semibold leading-5 text-white/90">Mission planning and control</p>
          </div>
        </div>
      </div>

      <div className="relative px-4 pb-4 pt-3">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-forest-200 bg-forest-100 font-extrabold text-forest-700 shadow-sm" aria-hidden="true">{initials}</span>
          <div className="min-w-0">
            <p className="flex items-center gap-2 truncate font-bold text-foreground"><UserRound className="h-4 w-4 shrink-0 text-forest-700" aria-hidden="true" />{profile.displayName}</p>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{profile.emailLabel}</p>
          </div>
        </div>

        <div className="mt-3 grid gap-2 border-t border-field-100 pt-3 text-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Current farm</p>
          <p className="flex items-center gap-2 font-semibold text-foreground"><Sprout className="h-4 w-4 shrink-0 text-forest-700" aria-hidden="true" />{profile.farmName}</p>
          <p className="flex items-center gap-2 text-muted-foreground"><MapPinned className="h-4 w-4 shrink-0" aria-hidden="true" />{profile.locationLabel}</p>
        </div>
      </div>
    </section>
  );
}
