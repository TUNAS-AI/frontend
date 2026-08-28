import { CalendarView } from "@/features/calendar/CalendarView";
import { AppShell } from "@/components/app/AppShell";
import { productNavigationItems } from "@/components/app/productNavigation";

export function CalendarRoute() {
  return <AppShell activeItem="calendar" navigationItems={productNavigationItems}><CalendarView /></AppShell>;
}
