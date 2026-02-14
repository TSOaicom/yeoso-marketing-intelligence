import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/contexts/I18nContext";
import { defaultSettings, getSettings, saveSettings, type AppSettings } from "@/lib/settingsStore";

export default function SettingsPage() {
  const { lang } = useI18n();
  const initial = useMemo(() => getSettings(), []);
  const [s, setS] = useState<AppSettings>(initial);

  const save = () => {
    saveSettings(s);
    toast.success(lang === "zh" ? "设置已保存" : "Settings saved");
  };

  const reset = () => {
    setS(defaultSettings);
    toast.message(lang === "zh" ? "已恢复默认（未保存）" : "Reset to defaults (not saved)");
  };

  const canEnableCoze = Boolean(s.coze.analysisWebhookUrl);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight">{lang === "zh" ? "设置" : "Settings"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {lang === "zh"
              ? "演示版默认使用本地 Mock 分析引擎。若你提供 Coze 配置，可切换为 Coze（生产环境建议通过后端代理保护 Token）。"
              : "Demo uses local mock analysis by default. If you provide Coze config, you can switch to Coze (in production, use a backend proxy to protect tokens)."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-9 bg-background/30" onClick={reset}>
            {lang === "zh" ? "恢复默认" : "Reset"}
          </Button>
          <Button className="h-9" onClick={save}>
            {lang === "zh" ? "保存" : "Save"}
          </Button>
        </div>
      </div>

      <Card className="border-border/50 bg-card/70">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{lang === "zh" ? "分析引擎" : "Analysis engine"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium">{lang === "zh" ? "启用 Coze" : "Enable Coze"}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {lang === "zh"
                  ? canEnableCoze
                    ? "检测到 Coze 配置已填写，你可以切换。"
                    : "需填写 Coze API Base / PAT / 智能体ID 后才能切换。"
                  : canEnableCoze
                    ? "Coze config detected. You can switch."
                    : "Fill Coze API Base / PAT / Agent IDs to enable."}
              </div>
            </div>
            <Switch
              checked={s.analysisEngine === "coze"}
              onCheckedChange={(v) => {
                if (v && !canEnableCoze) {
                  toast.error(lang === "zh" ? "Coze 配置不完整" : "Coze config incomplete");
                  return;
                }
                setS((prev) => ({ ...prev, analysisEngine: v ? "coze" : "mock" }));
              }}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{lang === "zh" ? "分析网关 URL（推荐）" : "Analysis gateway URL (recommended)"}</Label>
              <Input
                value={s.coze.analysisWebhookUrl}
                onChange={(e) => setS((prev) => ({ ...prev, coze: { ...prev.coze, analysisWebhookUrl: e.target.value.trim() } }))}
                placeholder={lang === "zh" ? "你的后端URL，例如 https://api.yourdomain.com/yeoso/analyze" : "Your backend URL, e.g. https://api.yourdomain.com/yeoso/analyze"}
              />
              <div className="text-xs text-muted-foreground">
                {lang === "zh"
                  ? "该 URL 应由你的后端代理调用 Coze，并返回统一 JSON（与 Yeoso 报告字段一致）。"
                  : "This URL should be your backend proxy that calls Coze and returns unified JSON."}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{lang === "zh" ? "Auth Header（可选）" : "Auth header (optional)"}</Label>
              <Input
                value={s.coze.analysisWebhookAuthHeader}
                onChange={(e) => setS((prev) => ({ ...prev, coze: { ...prev.coze, analysisWebhookAuthHeader: e.target.value } }))}
                placeholder={lang === "zh" ? "例如：Bearer xxx" : "e.g. Bearer xxx"}
              />
              <div className="text-xs text-muted-foreground">
                {lang === "zh" ? "会作为 Authorization 头发送到网关。" : "Sent as Authorization header to the gateway."}
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Allow extensions</Label>
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
              <div className="text-xs text-muted-foreground">{lang === "zh" ? "逗号分隔，包含点号，例如 .pdf" : "Comma-separated, include dot e.g. .pdf"}</div>
            </div>
            <div className="space-y-2">
              <Label>{lang === "zh" ? "单文件最大 (MB)" : "Max file size (MB)"}</Label>
              <Input
                type="number"
                value={s.maxFileMB}
                onChange={(e) => setS((prev) => ({ ...prev, maxFileMB: Number(e.target.value || 0) }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/70">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{lang === "zh" ? "Coze 配置（可选）" : "Coze config (optional)"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{lang === "zh" ? "API Base URL" : "API Base URL"}</Label>
              <Input
                value={s.coze.apiBaseUrl}
                onChange={(e) => setS((prev) => ({ ...prev, coze: { ...prev.coze, apiBaseUrl: e.target.value.trim() } }))}
                placeholder={lang === "zh" ? "例如：https://api.coze.com" : "e.g. https://api.coze.com"}
              />
              <div className="text-xs text-muted-foreground">
                {lang === "zh" ? "请以 Coze 官方文档为准。" : "Follow Coze official docs."}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{lang === "zh" ? "PAT (Personal Access Token)" : "PAT (Personal Access Token)"}</Label>
              <Input
                value={s.coze.pat}
                onChange={(e) => setS((prev) => ({ ...prev, coze: { ...prev.coze, pat: e.target.value } }))}
                placeholder={lang === "zh" ? "仅演示保存到本地" : "Stored locally for demo"}
              />
              <div className="text-xs text-muted-foreground">
                {lang === "zh"
                  ? "安全提示：生产环境不要把 PAT 放在前端，请使用后端/网关代理。"
                  : "Security: do not store PAT in frontend in production; use a backend proxy."}
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>{lang === "zh" ? "意向评分智能体 ID" : "Intent agent ID"}</Label>
              <Input value={s.coze.intentAgentId} onChange={(e) => setS((p) => ({ ...p, coze: { ...p.coze, intentAgentId: e.target.value.trim() } }))} />
            </div>
            <div className="space-y-2">
              <Label>{lang === "zh" ? "关键词/情绪智能体 ID" : "Keyword/Sentiment agent ID"}</Label>
              <Input value={s.coze.keywordAgentId} onChange={(e) => setS((p) => ({ ...p, coze: { ...p.coze, keywordAgentId: e.target.value.trim() } }))} />
            </div>
            <div className="space-y-2">
              <Label>{lang === "zh" ? "行动策略智能体 ID" : "Strategy agent ID"}</Label>
              <Input value={s.coze.strategyAgentId} onChange={(e) => setS((p) => ({ ...p, coze: { ...p.coze, strategyAgentId: e.target.value.trim() } }))} />
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            {lang === "zh"
              ? "说明：你可以在上方配置“分析网关 URL”。当切换到 Coze 引擎时，Yeoso 会把转写文本 POST 到该网关，由网关负责调用 Coze 并返回结构化结果。"
              : "Note: Configure the “Analysis gateway URL” above. When Coze engine is enabled, Yeoso POSTs the transcript to your gateway; the gateway calls Coze and returns structured results."}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
