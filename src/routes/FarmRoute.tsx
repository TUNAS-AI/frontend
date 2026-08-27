import { farmPlaceholderData } from "@/api/farm";
import { AppShell } from "@/components/app/AppShell";
import { productNavigationItems } from "@/components/app/productNavigation";
import { FarmAssistant } from "@/features/farm/FarmAssistant";
import { FieldsView } from "@/features/farm/FieldsView";
import { FieldsContext } from "@/features/farm/components/FieldsContext";

export function FarmRoute() {
  return <AppShell activeItem="farm" assistant={<FarmAssistant data={farmPlaceholderData} />} context={<FieldsContext data={farmPlaceholderData} />} contextLabel="Field context" navigationItems={productNavigationItems}><FieldsView data={farmPlaceholderData} /></AppShell>;
}
