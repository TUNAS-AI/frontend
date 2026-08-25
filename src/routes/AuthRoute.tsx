import { authPageCopy } from "@/api/auth";
import { AuthView } from "@/features/auth/AuthView";

export function AuthRoute() {
  return (
    <AuthView
      copy={authPageCopy}
    />
  );
}
