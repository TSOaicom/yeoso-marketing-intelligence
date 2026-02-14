import { useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useData } from "@/contexts/DataContext";
import { useI18n } from "@/contexts/I18nContext";
import { cn } from "@/lib/utils";
import { getSettings } from "@/lib/settingsStore";
import emptyImg from "@/assets/yeoso-empty-state.jpeg";
import { FileUp, RefreshCcw, Trash2, XCircle, Eye } from "lucide-react";

function formatBytes(n: number) {
  const units = ["B", "KB", "MB", "GB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    queued: { label: "Queued", cls: "bg-muted text-muted-foreground" },
    uploading: { label: "Uploading", cls: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
    processing: { label: "Processing", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
    success: { label: "Success", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
    failed: { label: "Failed", cls: "bg-red-500/15 text-red-300 border-red-500/30" },
    canceled: { label: "Canceled", cls: "bg-muted text-muted-foreground" },
  };
  const v = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return <Badge className={cn("border", v.cls)}>{v.label}</Badge>;
}

export default function Uploads() {
  const { lang } = useI18n();
  const { jobs, addFiles, cancelJob, retryJob, deleteJob, updateTranscript, clearAll } = useData();

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const settings = useMemo(() => getSettings(), []);

  const onPick = () => inputRef.current?.click();

  const onFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    addFiles(Array.from(files));
    toast.success(lang === "zh" ? `已加入队列：${files.length} 个文件` : `Queued: ${files.length} file(s)`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight">{lang === "zh" ? "上传中心" : "Uploads"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {lang === "zh"
              ? `支持：${settings.allowExt.join(" ")} · 单文件≤${settings.maxFileMB}MB · 前端并发上传≤3`
              : `Supported: ${settings.allowExt.join(" ")} · ≤${settings.maxFileMB}MB each · Upload concurrency ≤3`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-9" onClick={clearAll}>
            {lang === "zh" ? "清空记录" : "Clear"}
          </Button>
          <Button className="h-9" onClick={onPick}>
            <FileUp className="mr-2 h-4 w-4" />
            {lang === "zh" ? "选择文件" : "Choose files"}
          </Button>
          <Input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
            accept={settings.allowExt.join(",")}
          />
        </div>
      </div>

      <Card
        className={cn(
          "relative overflow-hidden border-border/50 bg-card/60",
          dragOver ? "ring-2 ring-primary/50" : "",
        )}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onFiles(e.dataTransfer.files);
        }}
      >
        <div className="absolute inset-0 opacity-25">
          <img src={emptyImg} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/60 to-background/20" />

        <CardContent className="relative flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
          <div className="font-medium">
            {lang === "zh" ? "点击或拖拽文件至此" : "Click or drop files here"}
          </div>
          <div className="max-w-xl text-sm text-muted-foreground">
            {lang === "zh"
              ? "支持批量队列管理。若音频无法自动转写，请在文件卡片中粘贴对话转写文本后再分析。"
              : "Batch queue supported. If audio cannot be transcribed automatically, paste the transcript in the file card before analysis."}
          </div>
          <Button variant="outline" className="mt-3 h-9 bg-background/40" onClick={onPick}>
            {lang === "zh" ? "打开文件选择器" : "Open file picker"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {lang === "zh" ? `记录数：${jobs.length}` : `Records: ${jobs.length}`}
          </div>
        </div>

        {jobs.length === 0 ? (
          <Card className="border-border/50 bg-card/60">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {lang === "zh" ? "暂无分析记录，快去上传第一份对话吧" : "No records yet. Upload your first conversation."}
            </CardContent>
          </Card>
        ) : null}

        {jobs.map((j) => (
          <Card key={j.id} className="border-border/50 bg-card/70">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <CardTitle className="text-base">
                    <span className="truncate">{j.fileName}</span>
                  </CardTitle>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatBytes(j.sizeBytes)}</span>
                    <span>·</span>
                    <span>{new Date(j.createdAtISO).toLocaleString()}</span>
                    <span>·</span>
                    <span className="font-mono">{j.fileType}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={j.status} />
                  {j.status === "success" ? (
                    <Button asChild size="sm" className="h-8">
                      <Link href={`/app/results/${j.id}`}>
                        <span className="inline-flex items-center">
                          <Eye className="mr-2 h-4 w-4" />
                          {lang === "zh" ? "查看报告" : "View report"}
                        </span>
                      </Link>
                    </Button>
                  ) : null}
                  {j.status === "failed" ? (
                    <Button size="sm" variant="outline" className="h-8" onClick={() => retryJob(j.id)}>
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      {lang === "zh" ? "重试" : "Retry"}
                    </Button>
                  ) : null}
                  {j.status === "uploading" || j.status === "queued" || j.status === "processing" ? (
                    <Button size="sm" variant="outline" className="h-8" onClick={() => cancelJob(j.id)}>
                      <XCircle className="mr-2 h-4 w-4" />
                      {lang === "zh" ? "取消" : "Cancel"}
                    </Button>
                  ) : null}
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => deleteJob(j.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {j.status === "uploading" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{lang === "zh" ? "上传中" : "Uploading"}</span>
                    <span className="tabular-nums">{j.progress}%</span>
                  </div>
                  <Progress value={j.progress} />
                </div>
              ) : null}

              {j.status === "processing" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{lang === "zh" ? "分析中（并行智能体）" : "Analyzing (parallel agents)"}</span>
                    <span className="tabular-nums">…</span>
                  </div>
                  <Progress value={100} />
                </div>
              ) : null}

              {j.error ? (
                <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {j.error}
                </div>
              ) : null}

              {j.audioUrl ? (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">{lang === "zh" ? "音频预览" : "Audio preview"}</div>
                  <audio controls src={j.audioUrl} className="w-full" />
                </div>
              ) : null}

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{lang === "zh" ? "对话转写文本" : "Transcript"}</div>
                  <div className="text-xs text-muted-foreground">
                    {lang === "zh" ? "无转写将导致分析失败" : "Required for analysis"}
                  </div>
                </div>
                <Textarea
                  value={j.transcriptText ?? ""}
                  onChange={(e) => updateTranscript(j.id, e.target.value)}
                  placeholder={
                    lang === "zh"
                      ? "粘贴客户对话转写/聊天记录（支持中文或英文）。PDF/DOCX将自动抽取文字；音频需你粘贴转写，或在设置里接入 Coze 转写。"
                      : "Paste transcript/chat logs here. PDF/DOCX text is extracted automatically; for audio, paste transcript or connect Coze in Settings."}
                  className="min-h-[120px] bg-background/40"
                />
                <div className="text-xs text-muted-foreground">
                  {lang === "zh" ? "提示：文本变化会立即保存到本地。" : "Tip: Changes are saved locally immediately."}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
