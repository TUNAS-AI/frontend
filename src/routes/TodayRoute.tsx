import { AppShell } from "@/components/app/AppShell";
import { productNavigationItems } from "@/components/app/productNavigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

export function TodayRoute() {
  return <AppShell activeItem="today" navigationItems={productNavigationItems}><div className="grid gap-5"><PageHeader eyebrow="Farm workspace" title="Today" description="Your farm profile is ready. Operational mission data will return after backend integration testing." /><EmptyState title="No operational data yet" description="Use Farm to review or update your farm details." /></div></AppShell>;
}
