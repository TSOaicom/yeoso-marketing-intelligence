import { useMemo, useState } from "react";
import { Link, type RouteComponentProps } from "wouter";
import { toast } from "sonner";
import JSZip from "jszip";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { useData } from "@/contexts/DataContext";
import { useI18n } from "@/contexts/I18nContext";
import { getSettings } from "@/lib/settingsStore";
import { cn } from "@/lib/utils";

import { ArrowLeft, Download, Trash2 } from "lucide-react";

function intentionColor(intention?: string) {
  if (intention === "high") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (intention === "medium") return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  if (intention === "low") return "bg-red-500/15 text-red-300 border-red-500/30";
  return "bg-muted text-muted-foreground";
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadText(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  downloadBlob(filename, new Blob([content], { type: mime }));
}

function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const header = Object.keys(rows[0]).join(",");
  const body = rows
    .map((r) =>
      Object.values(r)
        .map((v) => {
          const s = v === null || v === undefined ? "" : String(v);
          return /[\n\r,\"]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\n");
  return `${header}\n${body}`;
}

export default function Results({ params }: RouteComponentProps<{ id?: string }>) {
  const { lang } = useI18n();
  const { jobs, deleteJob } = useData();
  const settings = getSettings();

  const id = params?.id;
  const job = id ? jobs.find((j) => j.id === id) : undefined;

  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const selectable = useMemo(() => jobs.filter((j) => j.status === "success" && j.analysis), [jobs]);
  const selectedIds = useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected]);
  const selectedJobs = useMemo(
    () => selectable.filter((j) => selectedIds.includes(j.id)),
    [selectable, selectedIds],
  );

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    if (checked) {
      for (const j of selectable) next[j.id] = true;
    }
    setSelected(next);
  };

  const exportBatch = async (format: "csv" | "json" | "zip-md") => {
    if (selectedJobs.length === 0) {
      toast.error(lang === "zh" ? "请先勾选至少一条成功记录" : "Select at least one successful record");
      return;
    }

    const rows = selectedJobs.map((j) => ({
      id: j.id,
      fileName: j.fileName,
      createdAtISO: j.createdAtISO,
      finishedAtISO: j.analysis!.finishedAtISO,
      score: j.analysis!.score,
      intention: j.analysis!.intention,
      sentiment: j.analysis!.sentiment.label,
      purchaseSignalsCount: j.analysis!.purchaseSignalsCount,
      keywordsTop: j.analysis!.keywordsTop.join("|"),
      engine: j.analysis!.engine,
    }));

    const stamp = new Date().toISOString().replace(/[:]/g, "-");

    if (format === "json") {
      downloadText(`yeoso-batch-${stamp}.json`, JSON.stringify(rows, null, 2), "application/json;charset=utf-8");
      toast.success(lang === "zh" ? "已导出 JSON" : "JSON downloaded");
      return;
    }

    if (format === "csv") {
      downloadText(`yeoso-batch-${stamp}.csv`, toCsv(rows), "text/csv;charset=utf-8");
      toast.success(lang === "zh" ? "已导出 CSV" : "CSV downloaded");
      return;
    }

    // zip of per-file markdown reports + a portfolio csv
    const zip = new JSZip();
    zip.file("portfolio.csv", toCsv(rows));
    for (const j of selectedJobs) {
      const a = j.analysis!;
      const md = `# ${j.fileName}\n\n- Uploaded: ${new Date(j.createdAtISO).toISOString()}\n- Finished: ${a.finishedAtISO}\n- Engine: ${a.engine}\n\n## Intent\n\n- Score: ${a.score}\n- Level: ${a.intention}\n- Sentiment: ${a.sentiment.label} (confidence ${a.sentiment.confidence})\n\n## Key metrics\n\n${a.metrics.map((m) => `- ${m.labelZh}: ${m.value}`).join("\n")}\n\n## Keywords\n\n${a.keywordsTop.map((k) => `- ${k}`).join("\n")}\n\n## Suggestions\n\n${a.suggestions
        .map((s) => `### [${s.priority.toUpperCase()}] ${s.titleZh}\n\n${s.detailsZh}`)
        .join("\n\n")}\n\n## Snippets\n\n${a.extractedSnippets.map((x) => `> ${x.text}`).join("\n\n")}\n`;
      zip.file(`${j.fileName}.report.md`, md);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(`yeoso-batch-${stamp}.zip`, blob);
    toast.success(lang === "zh" ? "已导出 ZIP" : "ZIP downloaded");
  };

  if (!id) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-3xl tracking-tight">{lang === "zh" ? "结果列表" : "Results"}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {lang === "zh"
                ? "按上传时间倒序排列；可勾选成功记录进行批量导出。"
                : "Sorted by upload time; select successful records for batch export."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="h-9 bg-background/30" onClick={() => exportBatch("csv")}>
              <Download className="mr-2 h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" className="h-9 bg-background/30" onClick={() => exportBatch("json")}>
              <Download className="mr-2 h-4 w-4" /> JSON
            </Button>
            <Button className="h-9" onClick={() => exportBatch("zip-md")}>
              <Download className="mr-2 h-4 w-4" /> ZIP (MD)
            </Button>
          </div>
        </div>

        <Card className="border-border/50 bg-card/70">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[44px]">
                    <Checkbox
                      checked={selectable.length > 0 && selectedJobs.length === selectable.length}
                      onCheckedChange={(v) => toggleAll(Boolean(v))}
                      aria-label={lang === "zh" ? "全选" : "Select all"}
                    />
                  </TableHead>
                  <TableHead>{lang === "zh" ? "文件" : "File"}</TableHead>
                  <TableHead>{lang === "zh" ? "时间" : "Time"}</TableHead>
                  <TableHead>{lang === "zh" ? "状态" : "Status"}</TableHead>
                  <TableHead>{lang === "zh" ? "意向" : "Intent"}</TableHead>
                  <TableHead className="text-right">{lang === "zh" ? "操作" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      {lang === "zh" ? "暂无记录" : "No records"}
                    </TableCell>
                  </TableRow>
                ) : null}

                {jobs.map((j) => {
                  const canSelect = j.status === "success" && Boolean(j.analysis);
                  return (
                    <TableRow key={j.id}>
                      <TableCell>
                        <Checkbox
                          disabled={!canSelect}
                          checked={Boolean(selected[j.id])}
                          onCheckedChange={(v) => setSelected((prev) => ({ ...prev, [j.id]: Boolean(v) }))}
                        />
                      </TableCell>
                      <TableCell className="max-w-[360px] truncate">{j.fileName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(j.createdAtISO).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="border border-border/50 bg-muted/30">
                          {j.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {j.analysis ? (
                          <div className="flex items-center gap-2">
                            <Badge className={cn("border", intentionColor(j.analysis.intention))}>
                              {j.analysis.intention.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground tabular-nums">{j.analysis.score}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild size="sm" variant="outline" className="h-8 bg-background/30">
                            <Link href={`/app/results/${j.id}`}>{lang === "zh" ? "查看" : "Open"}</Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8"
                            onClick={() => {
                              deleteJob(j.id);
                              toast.success(lang === "zh" ? "已删除" : "Deleted");
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="text-xs text-muted-foreground">
          {lang === "zh"
            ? `已选：${selectedJobs.length} / 可选成功记录：${selectable.length}`
            : `Selected: ${selectedJobs.length} / selectable successful: ${selectable.length}`}
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="h-9 w-9 bg-background/40">
            <Link href="/app/results" aria-label={lang === "zh" ? "返回" : "Back"}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-2xl">{lang === "zh" ? "未找到记录" : "Not found"}</h1>
          </div>
        </div>
      </div>
    );
  }

  const a = job.analysis;
  const finishedAt = a?.finishedAtISO ? new Date(a.finishedAtISO).toLocaleString() : "—";

  const exportMarkdown = () => {
    if (!a) {
      toast.error(lang === "zh" ? "暂无可导出的分析结果" : "No analysis to export");
      return;
    }
    const md = `# ${job.fileName}\n\n- Uploaded: ${new Date(job.createdAtISO).toISOString()}\n- Finished: ${a.finishedAtISO}\n- Engine: ${a.engine}\n\n## Intent\n\n- Score: ${a.score}\n- Level: ${a.intention}\n- Sentiment: ${a.sentiment.label} (confidence ${a.sentiment.confidence})\n\n## Key metrics\n\n${a.metrics.map((m) => `- ${lang === "zh" ? m.labelZh : m.labelEn}: ${m.value}`).join("\n")}\n\n## Keywords\n\n${a.keywordsTop.map((k) => `- ${k}`).join("\n")}\n\n## Suggestions\n\n${a.suggestions
      .map((s) => `### [${s.priority.toUpperCase()}] ${lang === "zh" ? s.titleZh : s.titleEn}\n\n${lang === "zh" ? s.detailsZh : s.detailsEn}`)
      .join("\n\n")}\n\n## Snippets\n\n${a.extractedSnippets.map((x) => `> ${x.text}`).join("\n\n")}\n`;

    downloadText(`${job.fileName}.report.md`, md, "text/markdown;charset=utf-8");
    toast.success(lang === "zh" ? "已导出 Markdown 报告" : "Markdown report downloaded");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/app/results">
            <Button variant="outline" size="icon" className="h-9 w-9 bg-background/40">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="font-display text-2xl tracking-tight md:text-3xl">{job.fileName}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{lang === "zh" ? "上传" : "Uploaded"}: {new Date(job.createdAtISO).toLocaleString()}</span>
              <span>·</span>
              <span>{lang === "zh" ? "完成" : "Finished"}: {finishedAt}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="h-9 bg-background/30" onClick={exportMarkdown} disabled={!a}>
            <Download className="mr-2 h-4 w-4" />
            {lang === "zh" ? "导出报告" : "Export"}
          </Button>
          <Button
            variant="ghost"
            className="h-9"
            onClick={() => {
              deleteJob(job.id);
              toast.success(lang === "zh" ? "已删除" : "Deleted");
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {lang === "zh" ? "删除" : "Delete"}
          </Button>
        </div>
      </div>

      {!a ? (
        <Card className="border-border/50 bg-card/70">
          <CardContent className="py-10 text-sm text-muted-foreground">
            {lang === "zh" ? "该记录尚无成功分析结果。请回到上传中心补充转写文本并重试。" : "No successful analysis yet. Add transcript and retry in Uploads."}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-border/50 bg-card/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{lang === "zh" ? "头部摘要" : "Summary"}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border/50 bg-background/40 p-4">
                <div className="text-xs text-muted-foreground">{lang === "zh" ? "意向评分" : "Intent score"}</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <div className="text-3xl font-semibold tabular-nums">{a.score}</div>
                  <Badge className={cn("border", intentionColor(a.intention))}>{a.intention.toUpperCase()}</Badge>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {lang === "zh"
                    ? `阈值：高≥${settings.thresholds.high}，中${settings.thresholds.medium}~${settings.thresholds.high - 1}，低<${settings.thresholds.medium}`
                    : `Thresholds: high≥${settings.thresholds.high}, medium ${settings.thresholds.medium}~${settings.thresholds.high - 1}, low<${settings.thresholds.medium}`}
                </div>
              </div>

              <div className="rounded-2xl border border-border/50 bg-background/40 p-4">
                <div className="text-xs text-muted-foreground">{lang === "zh" ? "情感倾向" : "Sentiment"}</div>
                <div className="mt-2 text-2xl font-semibold capitalize">{a.sentiment.label}</div>
                <div className="mt-2 text-xs text-muted-foreground">confidence {a.sentiment.confidence}</div>
              </div>

              <div className="rounded-2xl border border-border/50 bg-background/40 p-4">
                <div className="text-xs text-muted-foreground">{lang === "zh" ? "购买信号" : "Signals"}</div>
                <div className="mt-2 text-2xl font-semibold tabular-nums">{a.purchaseSignalsCount}</div>
                <div className="mt-2 text-xs text-muted-foreground">engine: {a.engine}</div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-[1.4fr,0.6fr]">
            <Card className="border-border/50 bg-card/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{lang === "zh" ? "关键指标" : "Key metrics"}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                {a.metrics.map((m) => (
                  <div key={m.key} className="rounded-2xl border border-border/50 bg-background/40 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-muted-foreground">{lang === "zh" ? m.labelZh : m.labelEn}</div>
                      {(m.helpZh || m.helpEn) ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help text-xs text-muted-foreground">?</span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[260px]">
                            <p className="text-xs">{lang === "zh" ? m.helpZh : m.helpEn}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : null}
                    </div>
                    <div className="mt-2 text-lg font-semibold">{m.value}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{lang === "zh" ? "关键词 TOP5" : "Top keywords"}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {a.keywordsTop.length === 0 ? (
                  <span className="text-sm text-muted-foreground">—</span>
                ) : (
                  a.keywordsTop.map((k) => (
                    <Badge key={k} variant="secondary" className="border border-border/50 bg-muted/30">
                      {k}
                    </Badge>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/50 bg-card/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{lang === "zh" ? "行动建议" : "Next actions"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {a.suggestions.map((s) => (
                <div key={s.id} className="rounded-2xl border border-border/50 bg-background/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium">{lang === "zh" ? s.titleZh : s.titleEn}</div>
                    <Badge className={cn("border", intentionColor(s.priority))}>{s.priority.toUpperCase()}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{lang === "zh" ? s.detailsZh : s.detailsEn}</p>
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      className="h-9 bg-background/30"
                      onClick={() => toast.success(lang === "zh" ? "已生成跟进任务（演示）" : "Task created (demo)")}
                    >
                      {lang === "zh" ? "一键生成跟进任务" : "Create follow-up task"}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{lang === "zh" ? "原文摘录" : "Snippets"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {a.extractedSnippets.map((x, idx) => (
                <div key={idx} className="rounded-xl border border-border/50 bg-background/40 p-4 text-sm">
                  {x.text}
                </div>
              ))}
              <Separator />
              <div className="text-xs text-muted-foreground">
                {lang === "zh" ? "提示：演示版不会上传原文到服务器；生产环境可做关键词高亮与时间戳对齐。" : "Demo keeps content local; production can add keyword highlighting and timestamps."}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
