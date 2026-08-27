import { useState } from "react";
import type { MissionCloseoutDraft } from "./detailTypes";

export function useMissionCloseout() {
  const [requested, setRequested] = useState(false);
  const [closed, setClosed] = useState(false);
  const [result, setResult] = useState<MissionCloseoutDraft | null>(null);

  function requestCloseout() {
    if (closed) return "This mission is already closed in this demo session.";
    setRequested(true);
    return "I opened the structured closeout review in Mission Detail. Add the final outcome and any deviation, then review the summary before confirming. The mission is not closed yet.";
  }

  function confirmCloseout(draft: MissionCloseoutDraft) {
    setResult(draft);
    setClosed(true);
    setRequested(false);
  }

  return { closed, confirmCloseout, requested, requestCloseout, result };
}
