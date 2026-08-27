import { TunasAssistant } from "@/components/app/TunasAssistant";
import type { MissionOutcome } from "./types";

export function OutcomeAssistant({ outcome }: { outcome: MissionOutcome }) {
  function answerQuestion(question: string) {
    const normalized = question.toLowerCase();
    return outcome.assistant.responses.find((response) => response.keywords.some((keyword) => normalized.includes(keyword)))?.text
      ?? outcome.assistant.fallbackResponse;
  }
  return <TunasAssistant contextLabel={outcome.assistant.contextLabel} contextTone="success" starterMessage={outcome.assistant.starterMessage} inputPlaceholder="Ask about this result…" onAsk={answerQuestion} />;
}
