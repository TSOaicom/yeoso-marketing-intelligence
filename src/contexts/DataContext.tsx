import * as React from "react";
import { nanoid } from "nanoid";
import type { UploadJob } from "@/lib/models";
import { getSettings } from "@/lib/settingsStore";
import { runMockAnalysis } from "@/lib/mockAnalysis";

const KEY = "yeoso.jobs";

type JobMap = Record<string, UploadJob>;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function extOf(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

async function extractText(file: File): Promise<string | undefined> {
  const ext = extOf(file.name);
  if (ext === ".txt" || ext === ".md") {
    return await file.text();
  }

  if (ext === ".docx") {
    // Mammoth: pure JS, works in browser
    const mammoth = await import("mammoth");
    const buf = await file.arrayBuffer();
    const res = await mammoth.extractRawText({ arrayBuffer: buf });
    return (res.value ?? "").trim() || undefined;
  }

  if (ext === ".pdf") {
    // pdfjs-dist: minimal text extraction
    const pdfjsLib: any = await import("pdfjs-dist");
    const workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const maxPages = Math.min(pdf.numPages, 20);
    const parts: string[] = [];
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = (content.items as any[])
        .map((it: any) => (typeof it.str === "string" ? it.str : ""))
        .join(" ");
      parts.push(text);
    }
    const combined = parts.join("\n").replace(/\s+/g, " ").trim();
    return combined || undefined;
  }

  return undefined;
}

interface DataContextValue {
  jobs: UploadJob[];
  addFiles: (files: File[]) => void;
  cancelJob: (id: string) => void;
  retryJob: (id: string) => void;
  deleteJob: (id: string) => void;
  updateTranscript: (id: string, text: string) => void;
  clearAll: () => void;
}

const DataContext = React.createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = React.useState<JobMap>(() => readJson<JobMap>(KEY, {}));

  // Persist
  React.useEffect(() => {
    writeJson(KEY, jobs);
  }, [jobs]);

  // Queue worker
  const uploadActiveRef = React.useRef(0);
  const analyzeActiveRef = React.useRef(0);

  const tick = React.useCallback(() => {
    const settings = getSettings();
    const list = Object.values(jobs);

    // Uploads: max 3 parallel
    const canUpload = 3 - uploadActiveRef.current;
    if (canUpload > 0) {
      const nextUploads = list
        .filter((j) => j.status === "queued")
        .slice(0, canUpload);
      for (const j of nextUploads) {
        uploadActiveRef.current += 1;
        const startedAt = new Date().toISOString();
        setJobs((prev) => ({
          ...prev,
          [j.id]: { ...prev[j.id], status: "uploading", progress: 1, uploadedAtISO: startedAt, error: undefined },
        }));

        // Simulate upload progress based on size; never fabricate times: use actual timers
        const durationMs = Math.max(700, Math.min(4500, Math.round(j.sizeBytes / 40000)));
        const start = Date.now();
        const timer = window.setInterval(() => {
          const elapsed = Date.now() - start;
          const p = Math.round((elapsed / durationMs) * 100);
          setJobs((prev) => {
            const cur = prev[j.id];
            if (!cur || cur.status !== "uploading") return prev;
            return { ...prev, [j.id]: { ...cur, progress: Math.min(99, Math.max(cur.progress, p)) } };
          });
          if (elapsed >= durationMs) {
            window.clearInterval(timer);
            uploadActiveRef.current -= 1;
            setJobs((prev) => {
              const cur = prev[j.id];
              if (!cur || cur.status === "canceled") return prev;
              return { ...prev, [j.id]: { ...cur, status: "processing", progress: 100 } };
            });
          }
        }, 120);
      }
    }

    // Analysis: max 10 parallel (PRD). In demo, keep 5 to avoid browser freeze.
    const maxAnalyze = Math.min(5, 10);
    const canAnalyze = maxAnalyze - analyzeActiveRef.current;
    if (canAnalyze > 0) {
      const next = list.filter((j) => j.status === "processing").slice(0, canAnalyze);
      for (const j of next) {
        analyzeActiveRef.current += 1;
        (async () => {
          try {
            const transcript = j.transcriptText?.trim();
            if (!transcript) throw new Error("NO_TRANSCRIPT");
            let res;
            if (settings.analysisEngine === "coze" && settings.coze.analysisWebhookUrl) {
              const r = await fetch(settings.coze.analysisWebhookUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(settings.coze.analysisWebhookAuthHeader
                    ? { Authorization: settings.coze.analysisWebhookAuthHeader }
                    : {}),
                },
                body: JSON.stringify({
                  transcriptText: transcript,
                  fileName: j.fileName,
                  createdAtISO: j.createdAtISO,
                }),
              });
              if (!r.ok) throw new Error(`GATEWAY_HTTP_${r.status}`);
              res = await r.json();
              // Minimal validation
              if (!res || typeof res.score !== "number" || !res.finishedAtISO) {
                throw new Error("GATEWAY_INVALID_RESPONSE");
              }
              res.engine = "coze";
            } else {
              res = await runMockAnalysis(transcript, settings);
            }

            setJobs((prev) => {
              const cur = prev[j.id];
              if (!cur || cur.status === "canceled") return prev;
              return { ...prev, [j.id]: { ...cur, status: "success", analysis: res } };
            });
          } catch (e) {
            const code = e instanceof Error ? e.message : "FAILED";
            setJobs((prev) => {
              const cur = prev[j.id];
              if (!cur || cur.status === "canceled") return prev;
              return {
                ...prev,
                [j.id]: {
                  ...cur,
                  status: "failed",
                  error:
                    code === "NO_TRANSCRIPT"
                      ? "缺少可分析文本：请在文件卡片中粘贴/补充转写文本。"
                      : "分析失败：请重试或检查文件内容。",
                },
              };
            });
          } finally {
            analyzeActiveRef.current -= 1;
          }
        })();
      }
    }
  }, [jobs]);

  // Drive tick
  React.useEffect(() => {
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [tick]);

  const addFiles = (files: File[]) => {
    const settings = getSettings();
    const nowISO = new Date().toISOString();

    const next: JobMap = { ...jobs };

    for (const f of files) {
      const ext = extOf(f.name);
      const sizeMB = f.size / 1024 / 1024;

      if (!settings.allowExt.includes(ext)) {
        const id = nanoid();
        next[id] = {
          id,
          fileName: f.name,
          fileType: ext || f.type || "unknown",
          sizeBytes: f.size,
          createdAtISO: nowISO,
          status: "failed",
          progress: 0,
          error: "不支持的文件格式：请上传音频或文本文件（白名单可在管理后台配置）。",
        };
        continue;
      }

      if (sizeMB > settings.maxFileMB) {
        const id = nanoid();
        next[id] = {
          id,
          fileName: f.name,
          fileType: ext || f.type || "unknown",
          sizeBytes: f.size,
          createdAtISO: nowISO,
          status: "failed",
          progress: 0,
          error: `文件大小超出限制（最大 ${settings.maxFileMB}MB）`,
        };
        continue;
      }

      const id = nanoid();
      const job: UploadJob = {
        id,
        fileName: f.name,
        fileType: ext || f.type || "unknown",
        sizeBytes: f.size,
        createdAtISO: nowISO,
        status: "queued",
        progress: 0,
      };

      // For audio preview
      if ([".mp3", ".wav", ".m4a"].includes(ext)) {
        job.audioUrl = URL.createObjectURL(f);
      }

      next[id] = job;

      // Kick off text extraction async (no fake data)
      (async () => {
        const text = await extractText(f);
        if (text) {
          setJobs((prev) => ({
            ...prev,
            [id]: { ...prev[id], transcriptText: text },
          }));
        }
      })();
    }

    setJobs(next);
  };

  const cancelJob = (id: string) => {
    setJobs((prev) => {
      const cur = prev[id];
      if (!cur) return prev;
      return { ...prev, [id]: { ...cur, status: "canceled", error: "已取消" } };
    });
  };

  const retryJob = (id: string) => {
    setJobs((prev) => {
      const cur = prev[id];
      if (!cur) return prev;
      return { ...prev, [id]: { ...cur, status: "queued", progress: 0, error: undefined, analysis: undefined } };
    });
  };

  const deleteJob = (id: string) => {
    setJobs((prev) => {
      const next = { ...prev };
      const url = next[id]?.audioUrl;
      if (url) URL.revokeObjectURL(url);
      delete next[id];
      return next;
    });
  };

  const updateTranscript = (id: string, text: string) => {
    setJobs((prev) => {
      const cur = prev[id];
      if (!cur) return prev;
      return { ...prev, [id]: { ...cur, transcriptText: text } };
    });
  };

  const clearAll = () => {
    // revoke object urls
    for (const j of Object.values(jobs)) {
      if (j.audioUrl) URL.revokeObjectURL(j.audioUrl);
    }
    setJobs({});
  };

  const value: DataContextValue = {
    jobs: Object.values(jobs).sort((a, b) => (a.createdAtISO < b.createdAtISO ? 1 : -1)),
    addFiles,
    cancelJob,
    retryJob,
    deleteJob,
    updateTranscript,
    clearAll,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = React.useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
