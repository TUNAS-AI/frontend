import { farmPlaceholderData } from "@/api/farm";
import { AppShell } from "@/components/app/AppShell";
import { productNavigationItems } from "@/components/app/productNavigation";
import { FieldsView } from "@/features/farm/FieldsView";
import { FieldsContext } from "@/features/farm/components/FieldsContext";

export function FarmRoute() {
  return <AppShell activeItem="farm" context={<FieldsContext data={farmPlaceholderData} />} contextLabel="Field context" navigationItems={productNavigationItems}><FieldsView data={farmPlaceholderData} /></AppShell>;
}
