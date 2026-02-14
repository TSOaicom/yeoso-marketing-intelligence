export type JobStatus = "queued" | "uploading" | "processing" | "success" | "failed" | "canceled";

export type IntentionLevel = "high" | "medium" | "low";
export type Sentiment = "positive" | "neutral" | "negative";

export interface AgentMetric {
  key: string;
  labelZh: string;
  labelEn: string;
  value: string | number;
  helpZh?: string;
  helpEn?: string;
}

export interface ActionSuggestion {
  id: string;
  priority: "high" | "medium" | "low";
  titleZh: string;
  titleEn: string;
  detailsZh: string;
  detailsEn: string;
}

export interface AnalysisResult {
  score: number; // 0-100
  intention: IntentionLevel;
  sentiment: { label: Sentiment; confidence: number };
  keywordsTop: string[];
  purchaseSignalsCount: number;
  metrics: AgentMetric[];
  suggestions: ActionSuggestion[];
  extractedSnippets: { text: string; at?: number }[]; // at: seconds
  finishedAtISO: string;
  engine: "mock" | "coze";
  engineMeta?: Record<string, unknown>;
}

export interface UploadJob {
  id: string;
  fileName: string;
  fileType: string;
  sizeBytes: number;
  createdAtISO: string;

  status: JobStatus;
  error?: string;
  progress: number; // 0-100

  uploadedAtISO?: string;
  transcriptText?: string;

  // For audio preview (object URL) — stored in-memory only
  audioUrl?: string;

  analysis?: AnalysisResult;
}
