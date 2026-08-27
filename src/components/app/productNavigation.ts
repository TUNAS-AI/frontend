import { CalendarDays, ClipboardList, Map, Plus, Sprout } from "lucide-react";
import type { AppNavigationItem } from "./AppShell";

export type ProductNavigationId = "today" | "missions" | "new" | "farm" | "calendar";

export const productNavigationItems: readonly AppNavigationItem<ProductNavigationId>[] = [
  { id: "new", label: "New mission", icon: Plus, href: "/missions/new", primaryAction: true },
  { id: "today", label: "Today", icon: Sprout, href: "/today" },
  { id: "missions", label: "Missions", icon: ClipboardList, href: "/missions" },
  { id: "farm", label: "Farm fields", icon: Map, href: "/farm" },
  { id: "calendar", label: "Calendar", icon: CalendarDays, href: "/calendar" },
];
