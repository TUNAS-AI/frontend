import { TunasAssistant } from "@/components/app/TunasAssistant";
import type { FieldsPageData } from "./types";

export function FarmAssistant({ data }: { data: FieldsPageData }) {
  function answerQuestion(question: string) {
    const normalized = question.toLowerCase();
    return data.assistant.responses.find((response) => response.keywords.some((keyword) => normalized.includes(keyword)))?.text
      ?? data.assistant.fallbackResponse;
  }

  return <TunasAssistant contextLabel={data.assistant.contextLabel} contextTone="info" starterMessage={data.assistant.starterMessage} inputPlaceholder="Ask about this farm…" onAsk={answerQuestion} />;
}
