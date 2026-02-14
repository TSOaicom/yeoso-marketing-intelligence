import { useMemo } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useData } from "@/contexts/DataContext";
import { useI18n } from "@/contexts/I18nContext";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { Download } from "lucide-react";

function downloadText(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function formatDay(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}-${dd}`;
}

export default function Analytics() {
  const { lang } = useI18n();
  const { jobs } = useData();

  const successJobs = useMemo(() => jobs.filter((j) => j.status === "success" && j.analysis), [jobs]);

  const dist = useMemo(() => {
    const high = successJobs.filter((j) => j.analysis?.intention === "high").length;
    const medium = successJobs.filter((j) => j.analysis?.intention === "medium").length;
    const low = successJobs.filter((j) => j.analysis?.intention === "low").length;
    return [
      { name: lang === "zh" ? "高" : "High", key: "high", value: high, color: "#22c55e" },
      { name: lang === "zh" ? "中" : "Medium", key: "medium", value: medium, color: "#f59e0b" },
      { name: lang === "zh" ? "低" : "Low", key: "low", value: low, color: "#ef4444" },
    ];
  }, [successJobs, lang]);

  const trend = useMemo(() => {
    const now = new Date();
    const days: { day: string; uploads: number; avgScore: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const start = d.getTime();
      const end = start + 24 * 3600 * 1000;

      const dayJobs = jobs.filter((j) => {
        const t = new Date(j.createdAtISO).getTime();
        return t >= start && t < end;
      });

      const dayScores = dayJobs
        .map((j) => j.analysis?.score)
        .filter((x): x is number => typeof x === "number");

      const avgScore = dayScores.length ? Math.round(dayScores.reduce((a, b) => a + b, 0) / dayScores.length) : 0;

      days.push({ day: formatDay(d), uploads: dayJobs.length, avgScore });
    }

    return days;
  }, [jobs]);

  const exportPortfolio = async (format: "csv" | "json") => {
    const rows = jobs.map((j) => ({
      id: j.id,
      fileName: j.fileName,
      createdAtISO: j.createdAtISO,
      status: j.status,
      score: j.analysis?.score ?? null,
      intention: j.analysis?.intention ?? null,
      sentiment: j.analysis?.sentiment.label ?? null,
      purchaseSignalsCount: j.analysis?.purchaseSignalsCount ?? null,
      engine: j.analysis?.engine ?? null,
    }));

    if (format === "json") {
      downloadText(`yeoso-portfolio-${new Date().toISOString()}.json`, JSON.stringify(rows, null, 2), "application/json;charset=utf-8");
      toast.success(lang === "zh" ? "已导出 JSON" : "JSON downloaded");
      return;
    }

    const header = Object.keys(rows[0] ?? {}).join(",");
    const csv = [header]
      .concat(
        rows.map((r) =>
          Object.values(r)
            .map((v) => {
              const s = v === null || v === undefined ? "" : String(v);
              return /[\n\r,\"]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
            })
            .join(","),
        ),
      )
      .join("\n");
    downloadText(`yeoso-portfolio-${new Date().toISOString()}.csv`, csv, "text/csv;charset=utf-8");
    toast.success(lang === "zh" ? "已导出 CSV" : "CSV downloaded");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight">{lang === "zh" ? "销售看板" : "Analytics"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {lang === "zh"
              ? "所有图表仅使用你真实上传的记录实时计算（不生成虚假销售数据）。"
              : "Charts are computed from your real uploaded records only (no fabricated sales data)."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-9 bg-background/30" onClick={() => exportPortfolio("csv")}>
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" className="h-9 bg-background/30" onClick={() => exportPortfolio("json")}>
            <Download className="mr-2 h-4 w-4" /> JSON
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-card/70">
          <CardHeader>
            <CardTitle className="text-sm">{lang === "zh" ? "总记录" : "Total records"}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">{jobs.length}</CardContent>
        </Card>
        <Card className="border-border/50 bg-card/70">
          <CardHeader>
            <CardTitle className="text-sm">{lang === "zh" ? "成功分析" : "Successful"}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">{successJobs.length}</CardContent>
        </Card>
        <Card className="border-border/50 bg-card/70">
          <CardHeader>
            <CardTitle className="text-sm">{lang === "zh" ? "覆盖天数" : "Days shown"}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">7</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr,1.1fr]">
        <Card className="border-border/50 bg-card/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{lang === "zh" ? "意向分布（成功样本）" : "Intent distribution (successful)"}</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            {successJobs.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{lang === "zh" ? "暂无成功样本" : "No successful samples"}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dist} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={2}>
                    {dist.map((d) => (
                      <Cell key={d.key} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
            <Separator className="my-4" />
            <div className="flex flex-wrap gap-2">
              {dist.map((d) => (
                <Badge key={d.key} variant="secondary" className="border border-border/50 bg-muted/30">
                  {d.name}: {d.value}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{lang === "zh" ? "近7天趋势" : "7‑day trend"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <div className="h-[300px]">
              <div className="mb-2 text-xs text-muted-foreground">{lang === "zh" ? "上传量" : "Uploads"}</div>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="uploads" stroke="#38bdf8" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="h-[300px]">
              <div className="mb-2 text-xs text-muted-foreground">{lang === "zh" ? "平均意向分" : "Avg score"}</div>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="avgScore" fill="#a3e635" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
