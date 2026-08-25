import { createContext } from "react";
import type { AuthSession } from "./types";

export type AuthSessionContextValue = {
  status: "loading" | "ready";
  session: AuthSession | null;
  saveSession: (session: AuthSession) => boolean;
  signOut: () => void;
};

export const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);
