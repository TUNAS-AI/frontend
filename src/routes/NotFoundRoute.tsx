import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Link } from "react-router";

export function NotFoundRoute() {
  return <main className="mx-auto grid min-h-dvh max-w-xl place-items-center p-5"><EmptyState title="Page not found" description="Open Farm fields to return to your farm workspace." action={<Button asChild><Link to="/farm">Open Farm fields</Link></Button>} /></main>;
}
