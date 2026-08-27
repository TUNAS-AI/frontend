import { TunasAssistant } from "@/components/app/TunasAssistant";
import type { CreatedMission, HarvestPlan, MissionInterpretation } from "../types";

type MissionAssistantChatProps = {
  interpretation: MissionInterpretation | null;
  selectedPlan: HarvestPlan | null;
  plans: HarvestPlan[];
  createdMission: CreatedMission | null;
  constraintSummary: string;
  onRevise: (request: string) => Promise<boolean>;
};

function quantitySummary(plan: HarvestPlan) {
  return `${plan.saleableQuantity.min}-${plan.saleableQuantity.max} ${plan.saleableQuantity.unit} expected saleable, including ${plan.grade.quantity.min}-${plan.grade.quantity.max} ${plan.grade.quantity.unit} at ${plan.grade.label}.`;
}

export function MissionAssistantChat({ interpretation, selectedPlan, plans, createdMission, constraintSummary, onRevise }: MissionAssistantChatProps) {
  async function answerQuestion(question: string) {
    const normalized = question.toLowerCase();
    const revisionIntent = /\b(change|revise|adjust|prioriti[sz]e|update|replan)\b/i.test(question);

    if (revisionIntent && plans.length) {
      const revised = await onRevise(question);
      return revised
        ? "I updated the available strategies using that revision. Review the recalculated results in the structured plan section before selecting or approving one."
        : "I could not apply that revision in this bounded demo. The structured mission remains unchanged. Try: ‘Prioritize the buyer order without overtime.’";
    }
    if (!interpretation) {
      return "Describe the mission in the structured form first. Once mission facts are available, I can explain them and explore alternatives with you.";
    }
    if (!plans.length) {
      const objective = interpretation.facts.find((fact) => fact.key === "objective")?.value;
      return `I can see the mission${objective ? ` objective: ${objective}` : " details"}. Complete the required clarification in the form so I can compare concrete strategies.`;
    }
    if (normalized.includes("compare") || normalized.includes("difference") || normalized.includes("option")) {
      return plans.map((plan) => `${plan.name}: ${plan.advantage} Trade-off: ${plan.tradeOff}`).join("\n\n");
    }
    if (normalized.includes("amount") || normalized.includes("weight") || normalized.includes("quantity") || normalized.includes("how much")) {
      return selectedPlan ? `${selectedPlan.name}: ${quantitySummary(selectedPlan)}` : "Select a strategy and I can explain its expected amount and market quality.";
    }
    if (normalized.includes("rain") || normalized.includes("weather") || normalized.includes("what if")) {
      return selectedPlan
        ? `${selectedPlan.name} has ${selectedPlan.rainExposure} rain exposure. ${selectedPlan.uncertainty.reason} A material weather change would require the affected future steps to be checked again.`
        : "Weather is part of the mission context. Select a strategy and I can explain its rain exposure and what may need replanning.";
    }
    if (normalized.includes("why") || normalized.includes("recommend")) {
      const recommended = plans.find((plan) => plan.recommended) ?? selectedPlan;
      return recommended ? `${recommended.name} is recommended because ${recommended.advantage} Its main trade-off is: ${recommended.tradeOff}` : "No recommended strategy is available yet.";
    }
    if (normalized.includes("status") || normalized.includes("approved") || normalized.includes("calendar")) {
      return createdMission
        ? `${createdMission.planName} is scheduled in the ${createdMission.calendarLabel}. The approval created ${createdMission.events.length} demo events and ${createdMission.steps.length} mission steps.`
        : "No plan has been approved yet. Selecting a strategy does not create a schedule until you confirm the exact preview.";
    }
    return selectedPlan
      ? `The selected strategy is ${selectedPlan.name}. ${quantitySummary(selectedPlan)} ${constraintSummary}`
      : "I can compare strategies, explain quantities and risks, answer what-if questions, or help revise the plan once strategies are available.";
  }

  return (
    <TunasAssistant
      contextLabel={createdMission ? "Approved mission" : plans.length ? "Plan context loaded" : interpretation ? "Mission details loaded" : "New mission"}
      contextTone={createdMission ? "success" : plans.length ? "info" : "source"}
      starterMessage="Ask me about this mission, compare strategies, explore what-if scenarios, or request a plan revision."
      subtitle="Mission help, questions and revisions"
      inputPlaceholder="Ask about this mission…"
      onAsk={answerQuestion}
    />
  );
}
