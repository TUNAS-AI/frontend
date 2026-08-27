import { TunasAssistant } from "@/components/app/TunasAssistant";
import type { ResultsPageData } from "./types";

export function ResultsAssistant({ data }: { data: ResultsPageData }) {
  function answerQuestion(question: string) {
    const normalized = question.toLowerCase();
    return data.assistant.responses.find((response) => response.keywords.some((keyword) => normalized.includes(keyword)))?.text
      ?? data.assistant.fallbackResponse;
  }
  return <TunasAssistant contextLabel={data.assistant.contextLabel} contextTone="success" starterMessage={data.assistant.starterMessage} inputPlaceholder="Ask about mission results…" onAsk={answerQuestion} />;
}
