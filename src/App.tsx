import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router";
import { ErrorState } from "./components/ui/ErrorState";
import { Toaster } from "./components/ui/sonner";
import { AuthSessionProvider } from "./features/auth/AuthSessionProvider";
import { AppRoutes } from "./routes/AppRoutes";

export default function App() {
  return (
    <>
      <AppErrorBoundary>
        <AuthSessionProvider><AppRoutes /></AuthSessionProvider>
      </AppErrorBoundary>
      <Toaster position="top-center" richColors />
    </>
  );
}

type AppErrorBoundaryState = { error: Error | null };

class AppErrorBoundary extends Component<{ children: ReactNode }, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("TUNAS render error", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="mx-auto grid min-h-dvh max-w-2xl place-items-center p-5">
          <ErrorState
            title="This screen could not load"
            description={this.state.error.message || "An unexpected frontend error occurred."}
            action={<Link className="font-bold underline underline-offset-4" to="/farm">Open Farm</Link>}
          />
        </main>
      );
    }

    return this.props.children;
  }
}
