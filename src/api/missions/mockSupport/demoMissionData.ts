import type { DateRangeSchedule, MissionContextData, MissionFact } from "../../../features/missions/types.ts";

export const REFERENCE_INPUT = "Cabai blok timur sudah banyak merah. Pengepul minta 80 kg grade A besok jam dua dan diperkirakan hujan sebelum siang.";

export const DEMO_LONG_TERM_SCHEDULE = {
  type: "date-range",
  startDate: "2026-07-15",
  endDate: "2026-09-15",
  durationLabel: "8 weeks",
  currentPhase: { label: "Establishment", progressLabel: "Week 2 of 8" },
  nextActivity: {
    label: "Apply starter fertilizer",
    date: "2026-07-18",
    timeWindow: { startTime: "07:00", endTime: "08:30" },
  },
} satisfies DateRangeSchedule;

export const DEMO_CONTEXT: MissionContextData = {
  timezone: "Asia/Jakarta",
  buyer: { quantity: 80, unit: "kg", marketQuality: "Market quality A", deadline: "2026-07-13T14:00:00+07:00" },
  weather: { summary: "Rain estimated before noon", provenance: "estimate", confidence: "low" },
  disclosure: { label: "Estimated, low confidence · Placeholder data", tone: "warning" },
  rules: [
    { id: "CHILI-HARVEST-WEATHER-01", version: "1.0", description: "Harvest suitable mature fruit before expected rain when quality exposure is material.", source: "Seeded demo chili playbook" },
    { id: "HARVEST-AMOUNT-02", version: "1.0", description: "The plan must remain within the expected harvest amount provided for this mission.", source: "Seeded demo operations rule" },
  ],
};

export const DEMO_FACTS: MissionFact[] = [
  { key: "fieldBlock", label: "Field block", value: "East Block", provenance: "inferred", confidence: "medium", editable: false, required: true, note: "Read-only in this bounded East Block demo." },
  { key: "cropBatch", label: "Crop / batch", value: "Chili / East-CH-07", provenance: "inferred", confidence: "medium", editable: false, required: true, note: "Read-only in this chili reference slice." },
  { key: "maturity", label: "Maturity", value: "Many fruits are red", provenance: "farmer-reported", confidence: "medium", editable: false, required: true, note: "Shown from the source message; maturity correction is outside this bounded parser." },
  { key: "buyerQuantity", label: "Buyer quantity", value: "80 kg", provenance: "farmer-reported", confidence: "high", editable: true, required: true },
  { key: "grade", label: "Market quality", value: "Market quality A", provenance: "farmer-reported", confidence: "high", editable: false, required: true, note: "Market quality is separate from crop maturity." },
  { key: "deadline", label: "Deadline", value: "2026-07-13 14:00", provenance: "farmer-reported", confidence: "high", editable: false, required: true, note: "The deterministic demo schedule uses this fixed buyer deadline." },
  { key: "weatherDependency", label: "Weather dependency", value: "Rain estimated before noon", provenance: "estimate", confidence: "low", editable: false, required: true, note: "Read-only seeded estimate; not live weather." },
  { key: "objective", label: "Objective", value: "Fulfil buyer order while protecting market quality A", provenance: "inferred", confidence: "medium", editable: false, required: true, note: "Change the supported objective through the adjustment control." },
  { key: "constraints", label: "Constraints", value: "Harvest before rain; meet the buyer deadline", provenance: "inferred", confidence: "medium", editable: false, required: true, note: "Read-only hard constraints for this reference slice." },
  { key: "harvestAmount", label: "Expected harvest amount", value: "", provenance: "missing", confidence: "unknown", editable: false, required: true },
];

export const DEMO_MISSION_WORKFLOW = {
  latencyMs: 350,
  requiredAdjustment: "Prioritize the buyer order, but do not use overtime.",
  minimumPlanningAmountKg: 49,
  defaultBuyerTargetKg: 80,
  defaultHarvestAmountKg: 80,
  quantityUnit: "kg" as const,
  marketQualityLabel: "Market quality A",
  requiredFactKeys: [
    "fieldBlock", "cropBatch", "maturity", "buyerQuantity", "grade", "deadline",
    "weatherDependency", "objective", "constraints",
  ] as const,
  supportedFacts: [
    { key: "fieldBlock", pattern: /east|timur/i, message: "This demo currently supports East Block only." },
    { key: "cropBatch", pattern: /chili|cabai/i, message: "This demo currently supports a chili batch only." },
    { key: "grade", pattern: /grade\s*a|market\s*quality\s*a/i, message: "This demo currently supports the market-quality A buyer order only." },
    { key: "deadline", pattern: /2026-07-13.*14:00/i, message: "This demo supports the deterministic deadline 2026-07-13 at 14:00 only." },
  ] as const,
  interpretation: {
    eligibleCrop: /cabai|chili/i,
    eligibleBlock: /blok\s*timur|east\s*block/i,
    eligibleMaturity: /merah|red|harvest|panen/i,
    eligibleBuyer: /pengepul|buyer/i,
    eligibleMarketQuality: /grade\s*a/i,
    eligibleDeadline: /besok|tomorrow/i,
    eligibleWeather: /hujan|rain/i,
    unsupportedMessage: "This bounded demo supports Indonesian, English, or mixed East Block chili harvest requests with a market-quality A buyer commitment.",
  },
  checkpoint: {
    idSuffix: "amount",
    question: "How much harvest is available for this mission?" as const,
    reason: "Expected harvest amount determines which plan can meet the buyer commitment before rain.",
  },
  recalculationChanges: [
    "Early full harvest quantity increases and becomes the recommended buyer-first option.",
    "Every field activity ends by 10:00 with no overtime.",
    "The previous selection and approval preview are invalidated.",
  ],
  preferredPlanId: {
    initial: "split-harvest" as const,
    adjusted: "early-full" as const,
  },
  planTemplates: [
    {
      id: "early-full" as const,
      name: "Early full harvest" as const,
      initial: { saleable: [72, 82], marketQuality: [60, 70], start: "06:30", end: "10:00" },
      adjusted: { saleable: [78, 86], marketQuality: [68, 76], start: "06:00", end: "09:45" },
      rainExposure: "low" as const,
      summary: "Harvest all suitable East Block fruit before the rain window.",
      uncertainty: { marginKg: 6, confidence: "medium" as const, reason: "Maturity is farmer-reported." },
      assumptions: ["Maturity is farmer-reported", "Buyer accepts same-day sorting"],
      advantage: "Maximizes volume before rain.",
      tradeOff: "Requires more sorting and handling in one window.",
      approval: {
        harvestEnd: "09:20",
        strategyTitle: "Transfer produce to cover",
        strategyStart: "09:20",
        strategyDetail: "Move harvested chili under cover before rain.",
        strategyConditional: false,
        postharvestEnd: "12:30",
        steps: ["Inspect maturity", "Prepare harvest handling", "Harvest East Block", "Transfer produce to cover", "Sort", "Pack", "Buyer collection"],
      },
    },
    {
      id: "selective-partial" as const,
      name: "Selective partial harvest" as const,
      initial: { saleable: [58, 68], marketQuality: [54, 64], start: "06:30", end: "09:30" },
      adjusted: { saleable: [66, 74], marketQuality: [62, 70], start: "06:00", end: "09:30" },
      rainExposure: "low" as const,
      summary: "Pick only clearly red, likely market-quality fruit for the buyer.",
      uncertainty: { marginKg: 6, confidence: "medium" as const, reason: "Maturity is farmer-reported." },
      assumptions: ["Maturity is farmer-reported", "Buyer accepts same-day sorting"],
      advantage: "Protects market quality by selecting suitable fruit.",
      tradeOff: "Buyer order may require another harvest.",
      approval: {
        harvestEnd: "09:15",
        strategyTitle: "Reassess market-quality quantity and transfer produce to cover",
        strategyStart: "09:15",
        strategyDetail: "Move harvested chili under cover before rain.",
        strategyConditional: false,
        postharvestEnd: "11:45",
        steps: ["Inspect maturity", "Prepare harvest handling", "Harvest East Block", "Reassess quantity", "Transfer produce to cover", "Sort", "Pack", "Buyer collection"],
      },
    },
    {
      id: "split-harvest" as const,
      name: "Split harvest" as const,
      initial: { saleable: [76, 84], marketQuality: [64, 74], start: "06:30", end: "10:00" },
      adjusted: { saleable: [80, 88], marketQuality: [70, 78], start: "06:00", end: "10:00" },
      rainExposure: "medium" as const,
      summary: "Harvest East Block first, then conditionally use West Block after reassessment.",
      uncertainty: { marginKg: 6, confidence: "low" as const, reason: "West Block maturity is inferred and requires inspection." },
      assumptions: ["West Block can provide a 6-10 kg fallback", "Transfer to cover occurs before rain"],
      advantage: "Balances buyer fulfilment with a quantity checkpoint.",
      tradeOff: "Requires fast reassessment and accepts moderate rain exposure.",
      approval: {
        harvestEnd: "09:20",
        strategyTitle: "Reassess quantity and conditional West Block harvest",
        strategyStart: "09:20",
        strategyDetail: "Only continue to West Block if East Block is below the buyer target.",
        strategyConditional: true,
        postharvestEnd: "12:30",
        steps: ["Inspect maturity", "Prepare harvest handling", "Harvest East Block", "Reassess quantity", "Conditional West Block harvest", "Transfer produce to cover", "Sort", "Pack", "Buyer collection"],
      },
    },
  ],
  approval: {
    calendarLabel: "Simulated Calendar" as const,
    date: "2026-07-13" as const,
    timezone: "Asia/Jakarta" as const,
    inspect: { title: "Inspect maturity and prepare harvest handling", start: "06:00", end: "06:30", detail: "Inspect red fruit and prepare the harvest area." },
    harvestStart: "06:30",
    harvestTitlePrefix: "Harvest East Block",
    postharvest: { title: "Sort and pack buyer order", start: "10:00" },
    buyer: { title: "Buyer collection", start: "14:00", end: "14:30" },
  },
} as const;
