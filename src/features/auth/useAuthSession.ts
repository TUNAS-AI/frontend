import { useContext } from "react";
import { AuthSessionContext } from "./authSessionContext";

export function useAuthSession() {
  const value = useContext(AuthSessionContext);
  if (!value) throw new Error("useAuthSession must be used inside AuthSessionProvider.");
  return value;
}
