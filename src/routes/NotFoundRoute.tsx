import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Link } from "react-router";

export function NotFoundRoute() {
  return <main className="mx-auto grid min-h-dvh max-w-xl place-items-center p-5"><EmptyState title="Page not found" description="Open Today to return to your farm planning workspace." action={<Button asChild><Link to="/today">Open Today</Link></Button>} /></main>;
}
