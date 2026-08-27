import { TunasAssistant } from "@/components/app/TunasAssistant";
import type { MissionDetailPageData } from "./detailTypes";

type MissionDetailAssistantProps = {
  data: MissionDetailPageData;
  onRequestCloseout: () => string;
  onReportNotDone: () => string;
  onRequestMove: () => string;
};

export function MissionDetailAssistant({ data, onRequestCloseout, onReportNotDone, onRequestMove }: MissionDetailAssistantProps) {
  function answerQuestion(question: string) {
    const normalized = question.toLowerCase();
    if (["not done", "wasn't done", "was not done", "tidak selesai", "belum selesai"].some((phrase) => normalized.includes(phrase))) {
      return onReportNotDone();
    }
    if (["move this task", "move the task", "reschedule", "pindahkan tugas", "ubah jadwal"].some((phrase) => normalized.includes(phrase))) {
      return onRequestMove();
    }
    if (["close out", "close the mission", "close this mission", "selesaikan misi", "tutup misi"].some((phrase) => normalized.includes(phrase))) {
      return onRequestCloseout();
    }
    return data.assistant.responses.find((response) =>
      response.keywords.some((keyword) => normalized.includes(keyword)),
    )?.text ?? data.assistant.fallbackResponse;
  }

  return (
    <TunasAssistant
      contextLabel={data.assistant.contextLabel}
      contextTone="ai"
      starterMessage={data.assistant.starterMessage}
      inputPlaceholder="Ask about this mission…"
      onAsk={answerQuestion}
    />
  );
}
