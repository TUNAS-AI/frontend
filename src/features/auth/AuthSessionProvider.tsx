import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch } from "@/api/http";
import {
  AUTH_SESSION_CHANGE_EVENT,
  clearAuthSession,
  isSessionActive,
  readAuthSession,
  refreshGoogleAuthSession,
  writeAuthSession,
} from "./authSession";
import { AuthSessionContext, type AuthSessionContextValue } from "./authSessionContext";

type AuthSessionState = Pick<AuthSessionContextValue, "status" | "session">;

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthSessionState>(() => {
    const session = readAuthSession();
    return session && isSessionActive(session) ? { status: "ready", session } : { status: "ready", session: null };
  });

  const syncStoredSession = useCallback(() => {
    const session = readAuthSession();
    if (!session || !isSessionActive(session)) {
      if (session) clearAuthSession();
      setState({ status: "ready", session: null });
      return;
    }
    setState({ status: "ready", session });
  }, []);

  useEffect(() => {
    let active = true;
    const session = readAuthSession();
    window.addEventListener(AUTH_SESSION_CHANGE_EVENT, syncStoredSession);

    if (!session || !isSessionActive(session)) {
      if (session) clearAuthSession();
      setState({ status: "ready", session: null });
      return () => window.removeEventListener(AUTH_SESSION_CHANGE_EVENT, syncStoredSession);
    }

    setState({ status: "ready", session });
    void refreshGoogleAuthSession(session, apiFetch)
      .then((refreshed) => {
        if (!active || readAuthSession()?.accessToken !== session.accessToken) return;
        writeAuthSession(refreshed);
        setState({ status: "ready", session: refreshed });
      })
      .catch(() => {
        if (!active || readAuthSession()?.accessToken !== session.accessToken) return;
        clearAuthSession();
        setState({ status: "ready", session: null });
      });

    return () => {
      active = false;
      window.removeEventListener(AUTH_SESSION_CHANGE_EVENT, syncStoredSession);
    };
  }, [syncStoredSession]);

  const value = useMemo<AuthSessionContextValue>(() => ({
    ...state,
    saveSession(session) {
      if (!writeAuthSession(session)) return false;
      setState({ status: "ready", session });
      return true;
    },
    signOut() {
      clearAuthSession();
      setState({ status: "ready", session: null });
    },
  }), [state]);

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}
