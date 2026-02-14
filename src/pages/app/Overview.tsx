import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/contexts/DataContext";
import { useI18n } from "@/contexts/I18nContext";

export default function Overview() {
  const { lang } = useI18n();
  const { jobs } = useData();

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 3600 * 1000;

  const uploads7d = jobs.filter((j) => new Date(j.createdAtISO).getTime() >= sevenDaysAgo).length;
  const completed = jobs.filter((j) => j.status === "success").length;
  const highIntent = jobs.filter((j) => j.analysis?.intention === "high").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-tight">{lang === "zh" ? "总览" : "Overview"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {lang === "zh"
            ? "从你真实上传的对话中实时聚合指标（演示版不生成虚假数据）。"
            : "Metrics are aggregated from your real uploads (demo does not fabricate data)."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-card/70">
          <CardHeader>
            <CardTitle className="text-sm">{lang === "zh" ? "近7天上传" : "Uploads (7d)"}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">{uploads7d}</CardContent>
        </Card>
        <Card className="border-border/50 bg-card/70">
          <CardHeader>
            <CardTitle className="text-sm">{lang === "zh" ? "已完成分析" : "Completed"}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">{completed}</CardContent>
        </Card>
        <Card className="border-border/50 bg-card/70">
          <CardHeader>
            <CardTitle className="text-sm">{lang === "zh" ? "高意向" : "High intent"}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">{highIntent}</CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-card/70">
        <CardHeader>
          <CardTitle className="text-sm">{lang === "zh" ? "快速入口" : "Quick start"}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {lang === "zh" ? "去“上传中心”导入对话 → 自动并行分析 → 在“结果列表”导出报告。" : "Uploads → parallel analysis → export in Results."}
        </CardContent>
      </Card>
    </div>
  );
}
