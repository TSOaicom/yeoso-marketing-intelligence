import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useData } from "@/contexts/DataContext";
import { useI18n } from "@/contexts/I18nContext";
import { getSettings, saveSettings, type AppSettings } from "@/lib/settingsStore";
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

export default function Admin() {
  const { lang } = useI18n();
  const { jobs } = useData();

  const [s, setS] = useState<AppSettings>(() => getSettings());

  const failed = useMemo(() => jobs.filter((j) => j.status === "failed"), [jobs]);

  const save = () => {
    saveSettings(s);
    toast.success(lang === "zh" ? "配置已保存" : "Saved");
  };

  const exportErrors = () => {
    const rows = failed.map((j) => ({
      id: j.id,
      fileName: j.fileName,
      createdAtISO: j.createdAtISO,
      status: j.status,
      error: j.error ?? "",
    }));
    downloadText(`yeoso-error-log-${new Date().toISOString()}.json`, JSON.stringify(rows, null, 2), "application/json;charset=utf-8");
    toast.success(lang === "zh" ? "已导出错误日志" : "Error log downloaded");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight">{lang === "zh" ? "管理后台" : "Admin"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {lang === "zh" ? "演示版管理员可调整白名单与意向阈值，并查看错误日志。" : "Demo admin can adjust allowlist/thresholds and view error logs."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-9 bg-background/30" onClick={exportErrors}>
            <Download className="mr-2 h-4 w-4" /> {lang === "zh" ? "导出错误日志" : "Export errors"}
          </Button>
          <Button className="h-9" onClick={save}>
            {lang === "zh" ? "保存配置" : "Save"}
          </Button>
        </div>
      </div>

      <Card className="border-border/50 bg-card/70">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{lang === "zh" ? "文件格式白名单" : "File allowlist"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label>{lang === "zh" ? "允许扩展名" : "Allowed extensions"}</Label>
          <Input
            value={s.allowExt.join(",")}
            onChange={(e) => setS((prev) => ({
              ...prev,
              allowExt: e.target.value
                .split(",")
                .map((x) => x.trim().toLowerCase())
                .filter(Boolean),
            }))}
          />
          <div className="text-xs text-muted-foreground">{lang === "zh" ? "修改后对后续上传实时生效。" : "Changes apply to future uploads."}</div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/70">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{lang === "zh" ? "意向阈值" : "Intent thresholds"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{lang === "zh" ? "高意向阈值" : "High threshold"}</Label>
            <Input
              type="number"
              value={s.thresholds.high}
              onChange={(e) => setS((p) => ({ ...p, thresholds: { ...p.thresholds, high: Number(e.target.value || 0) } }))}
            />
          </div>
          <div className="space-y-2">
            <Label>{lang === "zh" ? "中意向阈值" : "Medium threshold"}</Label>
            <Input
              type="number"
              value={s.thresholds.medium}
              onChange={(e) => setS((p) => ({ ...p, thresholds: { ...p.thresholds, medium: Number(e.target.value || 0) } }))}
            />
          </div>
          <Separator className="md:col-span-2" />
          <div className="md:col-span-2 text-xs text-muted-foreground">
            {lang === "zh" ? "规则：高≥high；中≥medium 且 <high；低<medium" : "Rule: high≥high; medium≥medium and <high; low<medium"}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/70">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{lang === "zh" ? "错误日志（来自真实上传）" : "Error log (real uploads)"}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang === "zh" ? "时间" : "Time"}</TableHead>
                <TableHead>{lang === "zh" ? "文件" : "File"}</TableHead>
                <TableHead>{lang === "zh" ? "原因" : "Reason"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {failed.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
                    {lang === "zh" ? "暂无失败记录" : "No failures"}
                  </TableCell>
                </TableRow>
              ) : null}
              {failed.slice(0, 20).map((j) => (
                <TableRow key={j.id}>
                  <TableCell className="text-xs text-muted-foreground">{new Date(j.createdAtISO).toLocaleString()}</TableCell>
                  <TableCell className="max-w-[320px] truncate">{j.fileName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{j.error}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
