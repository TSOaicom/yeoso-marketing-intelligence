import type { IntentionLevel } from "@/lib/models";

export interface AppSettings {
  allowExt: string[]; // lowercase, include dot
  maxFileMB: number;
  thresholds: { high: number; medium: number };

  analysisEngine: "mock" | "coze";

  // Coze / custom gateway config (optional)
  // Production recommendation: create a backend/gateway endpoint that calls Coze and returns a unified JSON result.
  coze: {
    // Optional informational fields (not used directly by demo unless you build your own gateway)
    apiBaseUrl: string; // e.g. https://api.coze.com (reference)

    // Gateway endpoint (your server) that returns AnalysisResult JSON.
    // This keeps PAT/OAuth out of the browser.
    analysisWebhookUrl: string;
    analysisWebhookAuthHeader: string; // e.g. "Bearer xxx" or custom

    pat: string; // demo-only; avoid in production frontend
    intentAgentId: string;
    keywordAgentId: string;
    strategyAgentId: string;
  };
}

const KEY = "yeoso.settings";

export const defaultSettings: AppSettings = {
  allowExt: [".mp3", ".wav", ".m4a", ".txt", ".pdf", ".docx"],
  maxFileMB: 100,
  thresholds: { high: 80, medium: 60 },
  analysisEngine: "mock",
  coze: {
    apiBaseUrl: "",
    analysisWebhookUrl: "",
    analysisWebhookAuthHeader: "",
    pat: "",
    intentAgentId: "",
    keywordAgentId: "",
    strategyAgentId: "",
  },
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getSettings(): AppSettings {
  const s = readJson<AppSettings>(KEY, defaultSettings);
  // normalize
  s.allowExt = (s.allowExt ?? defaultSettings.allowExt).map((x) => x.toLowerCase());
  s.maxFileMB = s.maxFileMB ?? defaultSettings.maxFileMB;
  s.thresholds = s.thresholds ?? defaultSettings.thresholds;
  s.analysisEngine = s.analysisEngine ?? "mock";
  s.coze = { ...defaultSettings.coze, ...(s.coze ?? {}) };
  return s;
}

export function saveSettings(next: AppSettings) {
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function intentionFromScore(score: number, thresholds: { high: number; medium: number }): IntentionLevel {
  if (score >= thresholds.high) return "high";
  if (score >= thresholds.medium) return "medium";
  return "low";
}
