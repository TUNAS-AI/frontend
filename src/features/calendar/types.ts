export type ApprovedMissionEvent = {
  id: string;
  missionId: string;
  missionTitle: string;
  title: string;
  detail: string;
  date: string;
  dateLabel: string;
  startTime: string;
  endTime: string;
  timezone: string;
  blockLabel?: string;
  approvalLabel: string;
  approvalStatus: "approved";
  conditional: boolean;
};

export type CalendarPageData = {
  sourceLabel: string;
  title: string;
  description: string;
  initialMonth: string;
  monthLabel: string;
  referenceDate: string;
  timezone: string;
  freshness: string;
  events: ApprovedMissionEvent[];
  assistant: {
    contextLabel: string;
    starterMessage: string;
    responses: Array<{ id: string; keywords: string[]; text: string }>;
    fallbackResponse: string;
  };
};
