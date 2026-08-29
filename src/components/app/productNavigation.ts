import { CalendarDays, ClipboardList, Map } from "lucide-react";
import type { AppNavigationItem } from "./AppShell";

export type ProductNavigationId = "farm" | "missions" | "calendar";

export const productNavigationItems: readonly AppNavigationItem<ProductNavigationId>[] = [
  { id: "farm", label: "Farm", icon: Map, href: "/farm" },
  { id: "missions", label: "Missions", icon: ClipboardList, href: "/missions" },
  { id: "calendar", label: "Calendar", icon: CalendarDays, href: "/calendar" },
];
