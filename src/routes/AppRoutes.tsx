import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router";
import { getPostAuthenticationPath } from "@/features/auth/authSession";
import { useAuthSession } from "@/features/auth/useAuthSession";

const FarmRoute = lazy(() => import("./FarmRoute").then(({ FarmRoute: Route }) => ({ default: Route })));
const CalendarRoute = lazy(() => import("./CalendarRoute").then(({ CalendarRoute: Route }) => ({ default: Route })));
const OutcomeDetailRoute = lazy(() => import("./OutcomeDetailRoute").then(({ OutcomeDetailRoute: Route }) => ({ default: Route })));
const ResultsRoute = lazy(() => import("./ResultsRoute").then(({ ResultsRoute: Route }) => ({ default: Route })));
const MissionsRoute = lazy(() => import("./MissionsRoute").then(({ MissionsRoute: Route }) => ({ default: Route })));
const MissionDetailRoute = lazy(() => import("./MissionDetailRoute").then(({ MissionDetailRoute: Route }) => ({ default: Route })));
const NewMissionRoute = lazy(() => import("./NewMissionRoute").then(({ NewMissionRoute: Route }) => ({ default: Route })));
const NotFoundRoute = lazy(() => import("./NotFoundRoute").then(({ NotFoundRoute: Route }) => ({ default: Route })));
const TodayRoute = lazy(() => import("./TodayRoute").then(({ TodayRoute: Route }) => ({ default: Route })));
const AuthRoute = lazy(() => import("./AuthRoute").then(({ AuthRoute: Route }) => ({ default: Route })));
const AuthCallbackRoute = lazy(() => import("./AuthCallbackRoute").then(({ AuthCallbackRoute: Route }) => ({ default: Route })));
const OnboardingRoute = lazy(() => import("./OnboardingRoute").then(({ OnboardingRoute: Route }) => ({ default: Route })));

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteNotice label="Loading TUNAS…" />}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackRoute />} />
        <Route element={<AnonymousOnlyRoute />}>
          <Route path="/login" element={<AuthRoute />} />
        </Route>
        <Route element={<OnboardingOnlyRoute />}>
          <Route path="/onboarding" element={<OnboardingRoute />} />
        </Route>
        <Route element={<FarmRequiredRoute />}>
          <Route index element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<TodayRoute />} />
          <Route path="/missions" element={<MissionsRoute />} />
          <Route path="/missions/new" element={<NewMissionRoute />} />
          <Route path="/missions/:missionId" element={<MissionDetailRoute />} />
          <Route path="/farm" element={<FarmRoute />} />
          <Route path="/calendar" element={<CalendarRoute />} />
          <Route path="/outcomes" element={<ResultsRoute />} />
          <Route path="/outcomes/:missionId" element={<OutcomeDetailRoute />} />
          <Route path="*" element={<NotFoundRoute />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

function AnonymousOnlyRoute() {
  const { status, session } = useAuthSession();
  if (status === "loading") return <RouteNotice label="Checking sign-in…" />;
  return session ? <Navigate to={getPostAuthenticationPath(session)} replace /> : <Outlet />;
}

function OnboardingOnlyRoute() {
  const { status, session } = useAuthSession();
  if (status === "loading") return <RouteNotice label="Checking sign-in…" />;
  if (!session) return <Navigate to="/login" replace />;
  return session.hasFarm ? <Navigate to="/today" replace /> : <Outlet />;
}

function FarmRequiredRoute() {
  const { status, session } = useAuthSession();
  if (status === "loading") return <RouteNotice label="Checking sign-in…" />;
  if (!session) return <Navigate to="/login" replace />;
  if (!session.hasFarm) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

function RouteNotice({ label }: { label: string }) {
  return <main className="grid min-h-dvh place-items-center p-5"><p className="font-semibold text-muted-foreground">{label}</p></main>;
}
