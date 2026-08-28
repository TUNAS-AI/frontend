import { LogOut, RotateCcw, Sprout } from "lucide-react";
import { useState, type ComponentType, type ReactNode, type SVGProps } from "react";
import { NavLink, useNavigate } from "react-router";
import { deleteFarmForOnboardingReset } from "@/api/farm/reset";
import type { FarmSnapshot } from "@/api/farm";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuthSession } from "@/features/auth/useAuthSession";
import { cn } from "@/utils/cn";
import { FarmSnapshotPanel } from "@/features/farm/components/FarmSnapshotPanel";

type NavigationIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type AppNavigationItem<Id extends string = string> = {
  href?: string;
  id: Id;
  label: string;
  icon: NavigationIcon;
  primaryAction?: boolean;
};

type AppShellProps<Id extends string> = {
  activeItem: Id;
  assistant?: ReactNode;
  children: ReactNode;
  context?: ReactNode;
  contextLoading?: boolean;
  contextLabel?: string;
  farmSnapshot?: FarmSnapshot;
  farmSnapshotError?: string | null;
  farmSnapshotLoading?: boolean;
  mobileHeaderAction?: ReactNode;
  navigationItems: readonly AppNavigationItem<Id>[];
  onFarmSnapshotRetry?: () => void;
  onNavigate?: (item: Id) => void;
};

export function AppShell<Id extends string>({
  activeItem,
  assistant,
  children,
  context,
  contextLoading = false,
  contextLabel = "Mission context",
  farmSnapshot,
  farmSnapshotError,
  farmSnapshotLoading,
  mobileHeaderAction,
  navigationItems,
  onFarmSnapshotRetry,
  onNavigate,
}: AppShellProps<Id>) {
  const navigate = useNavigate();
  const { signOut, session } = useAuthSession();
  const [isResetting, setIsResetting] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const onSignOut = () => {
    signOut();
    navigate("/login", { replace: true });
  };
  const resetOnboarding = async () => {
    setResetError(null);
    setIsResetting(true);
    try {
      await deleteFarmForOnboardingReset();
      signOut();
      navigate("/login", { replace: true });
    } catch (reason) {
      setResetError(reason instanceof Error ? reason.message : "We could not reset your farm setup. Try again.");
    } finally {
      setIsResetting(false);
    }
  };
  const contextContent = context ?? (contextLoading ? <ContextLoadingShell label={contextLabel} /> : null);

  return (
    <AlertDialog open={resetOpen} onOpenChange={(open) => { if (!isResetting) setResetOpen(open); }}>
      <div className="min-h-dvh text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:min-h-11 focus:rounded-md focus:bg-card focus:px-4 focus:py-3 focus:font-semibold focus:text-forest-700 focus:shadow-lift focus:outline-none focus:ring-4 focus:ring-ring/30"
      >
        Skip to main content
      </a>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-3 pb-36 pt-3 sm:px-5 md:gap-6 md:pb-8 md:pt-5 lg:grid-cols-[220px_minmax(0,1fr)_320px] lg:px-6 lg:pt-6">
        <aside className="hidden lg:block">
          <div className="sticky top-6 grid gap-5">
            <FarmSnapshotPanel
              farmerName={session?.account.displayName ?? "Farmer"}
              snapshot={farmSnapshot}
              snapshotError={farmSnapshotError}
              snapshotLoading={farmSnapshotLoading}
              onRetry={onFarmSnapshotRetry}
            />
            <DesktopNavigation
              activeItem={activeItem}
              items={navigationItems}
              onNavigate={onNavigate}
              onSignOut={onSignOut}
              onResetOnboarding={() => setResetOpen(true)}
            />
          </div>
        </aside>

        <div className="grid min-w-0 content-start gap-4">
          <header className="flex min-h-16 items-center justify-between gap-3 rounded-lg border bg-card/95 px-3 py-2 shadow-farm backdrop-blur sm:px-4 lg:hidden">
            <BrandInline />
            {mobileHeaderAction}
          </header>

          {contextContent ? (
            <details className="rounded-lg border bg-card lg:hidden">
              <summary className="min-h-11 cursor-pointer px-4 py-3 text-sm font-bold text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-ring/30">
                {contextLabel}
              </summary>
              <div className="border-t p-3">{contextContent}</div>
            </details>
          ) : null}

          <main id="main-content" className="motion-enter min-w-0" tabIndex={-1}>
            {children}
          </main>
        </div>

        {contextContent ? (
          <aside className="hidden lg:block" aria-label={contextLabel}>
            <div className="sticky top-6">{contextContent}</div>
          </aside>
        ) : null}
      </div>

      <MobileNavigation
        activeItem={activeItem}
        items={navigationItems}
        onNavigate={onNavigate}
        onSignOut={onSignOut}
        onResetOnboarding={() => setResetOpen(true)}
      />
      {assistant}
      </div>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset farm onboarding?</AlertDialogTitle>
          <AlertDialogDescription>This permanently deletes this farm, its fields, and crop batches. You will be signed out and can start onboarding again after signing in.</AlertDialogDescription>
        </AlertDialogHeader>
        {resetError ? <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive" role="alert">{resetError}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isResetting}>Keep my farm</AlertDialogCancel>
          <Button type="button" variant="danger" isLoading={isResetting} loadingLabel="Resetting onboarding" onClick={() => void resetOnboarding()}>Reset and sign out</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ContextLoadingShell({ label }: { label: string }) {
  return (
    <section className="motion-enter grid gap-4 rounded-lg border bg-card p-5 shadow-farm" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading {label.toLowerCase()}…</span>
      <div className="grid gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="grid gap-3 border-t pt-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </section>
  );
}

type NavigationProps<Id extends string> = {
  activeItem: Id;
  items: readonly AppNavigationItem<Id>[];
  onNavigate?: (item: Id) => void;
  onResetOnboarding: () => void;
  onSignOut: () => void;
};

export function DesktopNavigation<Id extends string>({
  activeItem,
  items,
  onNavigate,
  onResetOnboarding,
  onSignOut,
}: NavigationProps<Id>) {
  return (
    <nav aria-label="Primary navigation" className="grid gap-2">
      {items.map((item) => {
        const Icon = item.icon;
        const active = activeItem === item.id;
        const primaryAction = item.primaryAction;

        const className = cn(
          "flex min-h-12 w-full items-center gap-3 rounded-md border px-3 text-left text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2",
          primaryAction
            ? active
              ? "border-forest-700 bg-forest-700 text-white shadow-[0_8px_18px_rgba(29,68,40,0.24)] ring-2 ring-leaf-200 ring-offset-2 focus-visible:ring-leaf-700/35"
              : "border-leaf-700 bg-leaf-700 text-white shadow-[0_8px_18px_rgba(46,105,54,0.2)] hover:-translate-y-px hover:bg-leaf-700/90 active:translate-y-0 active:scale-[0.98] focus-visible:ring-leaf-700/35"
            : active
              ? "border-forest-300 bg-forest-50 text-forest-700 focus-visible:ring-ring/30"
              : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring/30",
        );
        const content = (
          <>
            <Icon className="h-5 w-5" aria-hidden="true" />
            {item.label}
          </>
        );

        return item.href ? (
          <NavLink key={item.id} to={item.href} aria-current={active ? "page" : undefined} className={className}>
            {content}
          </NavLink>
        ) : (
          <button
            key={item.id}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => onNavigate?.(item.id)}
            className={className}
          >
            {content}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onSignOut}
        className="mt-2 flex min-h-12 w-full items-center gap-3 rounded-md border border-transparent px-3 text-left text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:ring-offset-2"
      >
        <LogOut className="h-5 w-5" aria-hidden="true" />
        Log out
      </button>
      <button
        type="button"
        onClick={onResetOnboarding}
        className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-xs font-bold text-destructive transition-colors hover:bg-destructive/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:ring-offset-2"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Reset onboarding <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Demo</span>
      </button>
    </nav>
  );
}

export function MobileNavigation<Id extends string>({
  activeItem,
  items,
  onNavigate,
  onResetOnboarding,
  onSignOut,
}: NavigationProps<Id>) {
  return (
    <nav
      aria-label="Mobile primary navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(36,49,38,0.08)] backdrop-blur lg:hidden"
    >
      <div className="mx-auto grid max-w-lg gap-1">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const active = activeItem === item.id;
            const primaryAction = item.primaryAction;

            const className = cn(
              "grid min-h-14 min-w-0 place-items-center gap-1 rounded-md px-1 py-1 text-[11px] font-bold leading-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset",
              primaryAction
                ? active
                  ? "bg-forest-700 text-white shadow-[0_5px_14px_rgba(29,68,40,0.22)] ring-2 ring-leaf-200 focus-visible:ring-leaf-100"
                  : "bg-leaf-700 text-white shadow-[0_5px_14px_rgba(46,105,54,0.18)] hover:bg-leaf-700/90 active:scale-[0.98] focus-visible:ring-leaf-100"
                : active
                  ? "bg-forest-50 text-forest-700 focus-visible:ring-ring/30"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring/30",
            );
            const content = (
              <>
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="max-w-full truncate">{item.label}</span>
              </>
            );

            return item.href ? (
              <NavLink key={item.id} to={item.href} aria-current={active ? "page" : undefined} className={className}>
                {content}
              </NavLink>
            ) : (
              <button
                key={item.id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => onNavigate?.(item.id)}
                className={className}
              >
                {content}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-md text-[11px] font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-ring/30"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Log out
        </button>
        <button
          type="button"
          onClick={onResetOnboarding}
          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-md text-[11px] font-bold text-destructive transition-colors hover:bg-destructive/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-ring/30"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset onboarding <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Demo</span>
        </button>
      </div>
    </nav>
  );
}

function BrandInline() {
  return (
    <div className="flex items-center gap-3" aria-label="TUNAS">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-forest-500 text-white">
        <Sprout className="h-6 w-6" aria-hidden="true" />
      </div>
      <div>
        <p className="text-lg font-bold leading-tight text-foreground">TUNAS</p>
        <p className="text-sm font-semibold text-muted-foreground">Mission planning and control</p>
      </div>
    </div>
  );
}
