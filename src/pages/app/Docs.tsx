import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/contexts/I18nContext";
import { Download, ExternalLink } from "lucide-react";

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

export default function Docs() {
  const { lang } = useI18n();

  const md = `# Yeoso × Coze 部署与接入方案（可直接照抄）\n\n> 本页面提供：**部署方案** + **网关接口约定** + **3 个智能体提示词（Prompt）** + **Workflow 编排建议**。\n> 演示站默认使用本地 Mock 引擎；若你配置“分析网关 URL”，并切换到 Coze 引擎，将会把转写文本 POST 到你的网关。\n\n## 0. 你在 Yeoso 里要填什么（最关键）\n\n在 **设置 → Coze 配置** 填：\n- **分析网关 URL**：例如 https://api.yourdomain.com/yeoso/analyze\n- **Auth Header（可选）**：例如 Bearer <token>\n\n> 生产环境推荐：网关由你自己的后端实现，**后端持有 Coze PAT/OAuth**，浏览器不保存敏感 Token。\n\n---\n\n## 1. 推荐的多智能体编排方式\n\n**方案 A（推荐）：一个 Workflow 统一编排（一个 API）**\n\n- 输入：对话文本（transcriptText）+ 可选元信息（文件名、渠道、销售等）\n- Workflow 内部并行 3 个 Agent：\n  1) 意向评分 Agent\n  2) 关键词/情绪 Agent\n  3) 行动策略 Agent\n- 输出：统一 JSON（与 Yeoso 前端字段一致）\n\n**方案 B：三个智能体分别发布为 API（不推荐前端直连）**\n\n- 网关并发调用 3 个 API → 网关聚合输出\n- 前端仍然只调网关一个接口\n\n---\n\n## 2. Coze 发布为 API（官方流程摘录）\n\n参考官方文档：\n- https://www.coze.com/open/docs/guides/publish_api\n\n核心步骤：\n1. Project/App 的 Build 页面 → 右上角 Publish\n2. Publish as API → 选择 API → Publish\n\n---\n\n## 3. Yeoso ↔ 网关 接口约定（你按这个做就能通）\n\n### 3.1 网关请求（Yeoso → 你的后端）\n\nPOST /yeoso/analyze\n\nBody（JSON）：\n~~~json\n{\n  "transcriptText": "...",\n  "fileName": "xxx.pdf",\n  "createdAtISO": "2026-02-15T00:00:00.000Z"\n}\n~~~\n\nHeader（可选）：\n- Authorization: Bearer ...\n\n### 3.2 网关响应（你的后端 → Yeoso）\n\n必须返回（JSON）：\n~~~json\n{\n  "score": 86,\n  "intention": "high",\n  "sentiment": {"label": "positive", "confidence": 0.72},\n  "keywordsTop": ["价格", "合同", "交付"],\n  "purchaseSignalsCount": 3,\n  "metrics": [\n    {"key": "duration", "labelZh": "对话时长", "labelEn": "Duration", "value": "6 min"}\n  ],\n  "suggestions": [\n    {\n      "id": "...",\n      "priority": "high",\n      "titleZh": "24小时内推进合同评审",\n      "titleEn": "Move contract review within 24h",\n      "detailsZh": "...",\n      "detailsEn": "..."\n    }\n  ],\n  "extractedSnippets": [{"text": "..."}],\n  "finishedAtISO": "2026-02-15T00:00:00.000Z"\n}\n~~~\n\n> 注意：时间必须由你的网关实时生成（不要捏造历史时间）。\n\n---\n\n## 4. 三个智能体提示词（Prompt）——可直接复制到 Coze\n\n下面三段 Prompt 都遵循：**输入 JSON、输出 JSON**，这样最稳。\n\n### 4.1 意向评分智能体（Intent Scoring Agent）\n\n**System Prompt**\n\n你是销售对话“意向评分”智能体。请根据输入对话内容，输出客户意向评分（0-100）、意向等级（high/medium/low）、置信度、以及评分依据要点。必须严格输出 JSON，禁止输出多余文本。\n\n**User Prompt 模板**\n\n~~~json\n{\n  "transcriptText": "{{对话全文}}",\n  "thresholds": {"high": 80, "medium": 60}\n}\n~~~\n\n**输出 JSON Schema（示例）**\n\n~~~json\n{\n  "score": 0,\n  "intention": "low",\n  "confidence": 0.0,\n  "reasons": ["..."]\n}\n~~~\n\n### 4.2 关键词/情绪智能体（Keyword & Sentiment Agent）\n\n**System Prompt**\n\n你是关键词与情绪分析智能体。请从对话中提取关键词 TOP5（去重、保留原语言），判断情绪（positive/neutral/negative）和置信度，并统计购买信号次数（只要是明确的采购/签约/上线/交付/预算/合同推进等都算）。必须严格输出 JSON。\n\n**User Prompt 模板**\n\n~~~json\n{\n  "transcriptText": "{{对话全文}}"\n}\n~~~\n\n**输出 JSON Schema（示例）**\n\n~~~json\n{\n  "keywordsTop": ["..."],\n  "sentiment": {"label": "neutral", "confidence": 0.0},\n  "purchaseSignalsCount": 0,\n  "snippets": ["...最多6条关键原文句子..."]\n}\n~~~\n\n### 4.3 行动策略智能体（Next Action Planner Agent）\n\n**System Prompt**\n\n你是销售跟进策略智能体。输入包含意向评分、关键词/情绪/购买信号、以及原文摘录。请输出 1-3 条可执行的下一步建议，每条建议包含优先级（high/medium/low）、标题（中英）、详细步骤（中英）。必须严格输出 JSON，禁止输出多余文本。\n\n**User Prompt 模板**\n\n~~~json\n{\n  "intent": {"score": {{score}}, "intention": "{{high|medium|low}}"},\n  "keywordsTop": {{keywordsTop}},\n  "sentiment": {{sentiment}},\n  "purchaseSignalsCount": {{purchaseSignalsCount}},\n  "snippets": {{snippets}}\n}\n~~~\n\n**输出 JSON Schema（示例）**\n\n~~~json\n{\n  "suggestions": [\n    {\n      "priority": "high",\n      "titleZh": "...",\n      "titleEn": "...",\n      "detailsZh": "...",\n      "detailsEn": "..."\n    }\n  ]\n}\n~~~\n\n---\n\n## 5. Workflow 编排建议（Coze 内部）\n\n1) 输入节点：transcriptText\n2) 并行执行：意向评分 Agent + 关键词/情绪 Agent\n3) 聚合节点：把两者输出合并为一个 JSON\n4) 执行：行动策略 Agent\n5) 输出节点：整理为 Yeoso 需要的统一 JSON（见 3.2）\n\n---\n\n生成时间：${new Date().toISOString()}\n`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight">{lang === "zh" ? "Coze 部署方案" : "Coze Deployment"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {lang === "zh"
              ? "提供 Coze 发布为 API 的推荐流程与 Yeoso 接入架构（含安全建议）。"
              : "Recommended blueprint for publishing Coze as API and integrating with Yeoso (with security notes)."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="h-9 bg-background/30"
            onClick={() => window.open("https://www.coze.com/open/docs/guides/publish_api", "_blank")}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            {lang === "zh" ? "打开官方文档" : "Open docs"}
          </Button>
          <Button
            className="h-9"
            onClick={() => {
              downloadText(`yeoso-coze-deployment-${new Date().toISOString()}.md`, md, "text/markdown;charset=utf-8");
              toast.success(lang === "zh" ? "已下载部署方案" : "Deployment plan downloaded");
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            {lang === "zh" ? "下载方案 (MD)" : "Download (MD)"}
          </Button>
        </div>
      </div>

      <Card className="border-border/50 bg-card/70">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{lang === "zh" ? "关键结论" : "Key points"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-1">
            <li>{lang === "zh" ? "推荐把多智能体编排放到一个 Coze Workflow 中，前端只调用一个 API。" : "Prefer a single Coze Workflow to orchestrate agents; frontend calls one API."}</li>
            <li>{lang === "zh" ? "生产环境建议走后端/网关代理，避免 PAT 暴露在浏览器。" : "In production, use a backend/gateway proxy to keep PAT out of the browser."}</li>
            <li>{lang === "zh" ? "Yeoso 侧输出需严格 JSON Schema，便于导出与看板聚合。" : "Define a strict JSON schema for exports and dashboard aggregation."}</li>
          </ul>
          <Separator />
          <div className="text-xs">
            {lang === "zh" ? "本页面内容可通过右上角按钮下载为 Markdown 文档。" : "You can download this page as a Markdown file from the top-right button."}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/70">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{lang === "zh" ? "方案全文（Markdown）" : "Full text (Markdown)"}</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-[520px] overflow-auto rounded-2xl border border-border/50 bg-background/40 p-4 text-xs leading-relaxed">
            {md}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
