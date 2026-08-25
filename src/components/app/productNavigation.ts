import { Map } from "lucide-react";
import type { AppNavigationItem } from "./AppShell";

export type ProductNavigationId = "farm";

export const productNavigationItems: readonly AppNavigationItem<ProductNavigationId>[] = [
  { id: "farm", label: "Farm fields", icon: Map, href: "/farm" },
];
