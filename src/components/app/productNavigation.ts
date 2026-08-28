import { CalendarDays, ClipboardList, Map, Sprout } from "lucide-react";
import type { AppNavigationItem } from "./AppShell";

export type ProductNavigationId = "today" | "calendar" | "missions" | "farm";

export const productNavigationItems: readonly AppNavigationItem<ProductNavigationId>[] = [
  { id: "today", label: "Today", icon: Sprout, href: "/today" },
  { id: "calendar", label: "Calendar", icon: CalendarDays, href: "/calendar" },
  { id: "missions", label: "Missions", icon: ClipboardList, href: "/missions" },
  { id: "farm", label: "Farm", icon: Map, href: "/farm" },
];
