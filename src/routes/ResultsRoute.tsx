import { outcomesPlaceholderData, resultsPagePlaceholderData } from "@/api/outcomes";
import { AppShell } from "@/components/app/AppShell";
import { productNavigationItems } from "@/components/app/productNavigation";
import { ResultsAssistant } from "@/features/outcomes/ResultsAssistant";
import { ResultsView } from "@/features/outcomes/ResultsView";
import { ResultsContext } from "@/features/outcomes/components/ResultsContext";

export function ResultsRoute() {
  return <AppShell activeItem="missions" assistant={<ResultsAssistant data={resultsPagePlaceholderData} />} context={<ResultsContext data={resultsPagePlaceholderData} outcomes={outcomesPlaceholderData} />} contextLabel="Results evidence" navigationItems={productNavigationItems}><ResultsView data={resultsPagePlaceholderData} outcomes={outcomesPlaceholderData} /></AppShell>;
}
