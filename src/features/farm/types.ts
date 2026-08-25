export type FarmBlock = {
  id: string;
  name: string;
  location: string;
  areaLabel: string;
  conditionLabel: string;
  conditionTone: "success" | "warning" | "info";
  accessNotes: string;
  drainageNotes: string;
  notes: string;
  sourceLabel: string;
};

export type FarmBlockDraft = {
  name: string;
  location: string;
  areaHectares: string;
  accessNotes: string;
  drainageNotes: string;
  notes: string;
};

export type CropBatch = {
  id: string;
  crop: string;
  batchLabel: string;
  variety: string;
  blockId: string;
  plantedLabel: string;
  stage: string;
  readinessLabel: string;
  statusLabel: string;
  notes: string;
  sourceLabel: string;
};

export type CropBatchDraft = {
  batchLabel: string;
  variety: string;
  plantingDate: string;
  stage: string;
  readinessLabel: string;
  notes: string;
};

export type FarmObservation = {
  id: string;
  blockId: string;
  title: string;
  detail: string;
  observedAt: string;
  observedLabel: string;
  sourceLabel: string;
};

export type BuyerCommitment = {
  id: string;
  blockId: string;
  batchId?: string;
  buyerName: string;
  crop: string;
  amountLabel: string;
  marketQuality: string;
  dueAt: string;
  dueLabel: string;
  statusLabel: string;
  statusTone: "warning" | "info" | "success";
};

export type FieldsPageData = {
  sourceLabel: string;
  title: string;
  description: string;
  freshness: string;
  farm: { name: string; location: string; timezone: string; notes: string };
  blocks: FarmBlock[];
  batches: CropBatch[];
  observations: FarmObservation[];
  commitments: BuyerCommitment[];
};
