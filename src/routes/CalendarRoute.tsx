import { calendarPlaceholderData } from "@/api/calendar";
import { AppShell } from "@/components/app/AppShell";
import { productNavigationItems } from "@/components/app/productNavigation";
import { CalendarAssistant } from "@/features/calendar/CalendarAssistant";
import { CalendarView } from "@/features/calendar/CalendarView";
import { CalendarContext } from "@/features/calendar/components/CalendarContext";

export function CalendarRoute() {
  return <AppShell activeItem="calendar" assistant={<CalendarAssistant data={calendarPlaceholderData} />} context={<CalendarContext data={calendarPlaceholderData} />} contextLabel="Calendar context" navigationItems={productNavigationItems}><CalendarView data={calendarPlaceholderData} /></AppShell>;
}
