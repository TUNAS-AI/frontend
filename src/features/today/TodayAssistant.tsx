import { TunasAssistant } from "@/components/app/TunasAssistant";
import type { TodayPageData } from "./types";

export function TodayAssistant({ data }: { data: TodayPageData }) {
  function answerQuestion(question: string) {
    const normalized = question.toLowerCase();
    return data.assistant.responses.find((response) => response.keywords.some((keyword) => normalized.includes(keyword)))?.text
      ?? data.assistant.fallbackResponse;
  }

  return (
    <TunasAssistant
      contextLabel={data.assistant.contextLabel}
      contextTone={data.assistant.contextTone}
      starterMessage={data.assistant.starterMessage}
      inputPlaceholder={data.assistant.inputPlaceholder}
      onAsk={answerQuestion}
    />
  );
}
