import { LogOut, Menu, X } from "lucide-react";
import { type ComponentType, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject, type SVGProps, useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router";
import type { FarmSnapshot } from "@/api/farm";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuthSession } from "@/features/auth/useAuthSession";
import { cn } from "@/utils/cn";
import { FarmSnapshotPanel } from "@/features/farm/components/FarmSnapshotPanel";
import { TunasAssistant } from "./TunasAssistant";

type NavigationIcon = ComponentType<SVGProps<SVGSVGElement>>;

const SWIPE_DISTANCE = 56;
const SWIPE_EDGE_WIDTH = 32;

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
  assistantMissionId?: string;
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
  assistantMissionId,
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
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const mobileNavigationTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileNavigationDrawerRef = useRef<HTMLDivElement>(null);
  const mobileNavigationSwipeRef = useRef<{ open: boolean; x: number; y: number } | null>(null);
  const onSignOut = () => {
    signOut();
    navigate("/login", { replace: true });
  };
  const contextContent = context ?? (contextLoading ? <ContextLoadingShell label={contextLabel} /> : null);

  useEffect(() => {
    if (!mobileNavigationOpen) return;

    mobileNavigationDrawerRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobileNavigation();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileNavigationOpen]);

  function closeMobileNavigation(restoreFocus = true) {
    setMobileNavigationOpen(false);
    if (restoreFocus) mobileNavigationTriggerRef.current?.focus();
  }

  function startMobileNavigationSwipe(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" || (!mobileNavigationOpen && event.clientX > SWIPE_EDGE_WIDTH)) return;
    mobileNavigationSwipeRef.current = { open: mobileNavigationOpen, x: event.clientX, y: event.clientY };
  }

  function finishMobileNavigationSwipe(event: ReactPointerEvent<HTMLDivElement>) {
    const swipe = mobileNavigationSwipeRef.current;
    mobileNavigationSwipeRef.current = null;
    if (!swipe) return;

    const horizontalDistance = event.clientX - swipe.x;
    const verticalDistance = event.clientY - swipe.y;
    if (Math.abs(horizontalDistance) < SWIPE_DISTANCE || Math.abs(horizontalDistance) <= Math.abs(verticalDistance)) return;
    if (!swipe.open && horizontalDistance > 0) setMobileNavigationOpen(true);
    if (swipe.open && horizontalDistance < 0) closeMobileNavigation();
  }

  return (
    <div className="min-h-dvh text-foreground" onPointerDown={startMobileNavigationSwipe} onPointerUp={finishMobileNavigationSwipe} onPointerCancel={() => { mobileNavigationSwipeRef.current = null; }}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:min-h-11 focus:rounded-md focus:bg-card focus:px-4 focus:py-3 focus:font-semibold focus:text-forest-700 focus:shadow-lift focus:outline-none focus:ring-4 focus:ring-ring/30"
      >
        Skip to main content
      </a>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-3 pb-6 pt-3 sm:px-5 md:gap-6 md:pb-8 md:pt-5 lg:grid-cols-[264px_minmax(0,1fr)_264px] lg:px-6 lg:pt-6">
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
            />
          </div>
        </aside>

        <div className="grid min-w-0 content-start gap-4">
          <header className="sticky top-3 z-40 flex min-h-16 items-center gap-3 rounded-lg border bg-card/95 px-3 py-2 shadow-farm backdrop-blur sm:top-5 lg:hidden">
            <button
              ref={mobileNavigationTriggerRef}
              type="button"
              aria-label="Open navigation"
              aria-expanded={mobileNavigationOpen}
              aria-controls="mobile-navigation-drawer"
              onClick={() => setMobileNavigationOpen(true)}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <BrandInline />
            {mobileHeaderAction ? <div className="ml-auto">{mobileHeaderAction}</div> : null}
          </header>

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
        drawerRef={mobileNavigationDrawerRef}
        farmSnapshot={farmSnapshot}
        farmSnapshotError={farmSnapshotError}
        farmSnapshotLoading={farmSnapshotLoading}
        farmerName={session?.account.displayName ?? "Farmer"}
        items={navigationItems}
        onClose={closeMobileNavigation}
        onNavigate={onNavigate}
        onFarmSnapshotRetry={onFarmSnapshotRetry}
        onSignOut={onSignOut}
        open={mobileNavigationOpen}
      />
      {assistant}
      <TunasAssistant assistantMissionId={assistantMissionId} />
    </div>
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
  onSignOut: () => void;
};

type MobileNavigationProps<Id extends string> = NavigationProps<Id> & {
  drawerRef: RefObject<HTMLDivElement | null>;
  farmerName: string;
  farmSnapshot?: FarmSnapshot;
  farmSnapshotError?: string | null;
  farmSnapshotLoading?: boolean;
  onClose: (restoreFocus?: boolean) => void;
  onFarmSnapshotRetry?: () => void;
  open: boolean;
};

export function DesktopNavigation<Id extends string>({
  activeItem,
  items,
  onNavigate,
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
    </nav>
  );
}

export function MobileNavigation<Id extends string>({
  activeItem,
  drawerRef,
  farmerName,
  farmSnapshot,
  farmSnapshotError,
  farmSnapshotLoading,
  items,
  onClose,
  onNavigate,
  onFarmSnapshotRetry,
  onSignOut,
  open,
}: MobileNavigationProps<Id>) {
  return (
    <div className={`fixed inset-0 z-50 lg:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!open}>
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="Close navigation"
        onClick={() => onClose()}
        className={`absolute inset-0 bg-forest-700/30 backdrop-blur-[1px] transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <div
        ref={drawerRef}
        id="mobile-navigation-drawer"
        role="dialog"
        aria-label="Mobile navigation"
        aria-modal="true"
        inert={!open}
        tabIndex={-1}
        className={`relative flex h-full w-[min(20rem,calc(100vw-2.5rem))] flex-col border-r border-forest-300/70 bg-card p-4 shadow-[18px_0_42px_rgba(36,49,38,0.2)] transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ transitionTimingFunction: "var(--motion-ease-out)" }}
      >
        <div className="flex items-center justify-between gap-4">
          <img src="/images/tunas-ai-logo.png" alt="TUNAS" className="h-9 w-auto object-contain" />
          <button
            type="button"
            tabIndex={open ? 0 : -1}
            aria-label="Close navigation"
            onClick={() => onClose()}
            className="grid h-11 w-11 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Mobile primary navigation" className="mt-6 grid gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = activeItem === item.id;
            const primaryAction = item.primaryAction;

            const className = cn(
              "flex min-h-12 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset",
              primaryAction
                ? active
                  ? "bg-forest-700 text-white shadow-[0_5px_14px_rgba(29,68,40,0.22)] focus-visible:ring-leaf-100"
                  : "bg-leaf-700 text-white shadow-[0_5px_14px_rgba(46,105,54,0.18)] hover:bg-leaf-700/90 focus-visible:ring-leaf-100"
                : active
                  ? "bg-forest-50 text-forest-700 focus-visible:ring-ring/30"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring/30",
            );
            const content = (
              <>
                <Icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </>
            );

            return item.href ? (
              <NavLink key={item.id} to={item.href} aria-current={active ? "page" : undefined} onClick={() => onClose(false)} className={className}>
                {content}
              </NavLink>
            ) : (
              <button
                key={item.id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => { onClose(false); onNavigate?.(item.id); }}
                className={className}
              >
                {content}
              </button>
            );
          })}
        </nav>
        <div className="mt-6">
          <FarmSnapshotPanel
            farmerName={farmerName}
            snapshot={farmSnapshot}
            snapshotError={farmSnapshotError}
            snapshotLoading={farmSnapshotLoading}
            onRetry={onFarmSnapshotRetry}
            showBrand={false}
          />
        </div>
        <button
          type="button"
          tabIndex={open ? 0 : -1}
          onClick={() => { onClose(false); onSignOut(); }}
          className="mt-auto flex min-h-12 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-ring/30"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          Log out
        </button>
      </div>
    </div>
  );
}

function BrandInline() {
  return (
    <div className="flex items-center gap-3" aria-label="TUNAS">
      <img src="/images/tunas-ai-logo.png" alt="TUNAS" className="h-9 w-auto shrink-0 object-contain" />
    </div>
  );
}
