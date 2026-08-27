import { TunasAssistant } from "@/components/app/TunasAssistant";
import type { CalendarPageData } from "./types";

export function CalendarAssistant({ data }: { data: CalendarPageData }) {
  function answerQuestion(question: string) {
    const normalized = question.toLowerCase();
    return data.assistant.responses.find((response) => response.keywords.some((keyword) => normalized.includes(keyword)))?.text
      ?? data.assistant.fallbackResponse;
  }
  return <TunasAssistant contextLabel={data.assistant.contextLabel} contextTone="info" starterMessage={data.assistant.starterMessage} inputPlaceholder="Ask about approved events…" onAsk={answerQuestion} />;
}
