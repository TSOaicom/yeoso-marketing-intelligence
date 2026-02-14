import { nanoid } from "nanoid";
import type { AnalysisResult, Sentiment } from "@/lib/models";
import { intentionFromScore, type AppSettings } from "@/lib/settingsStore";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pickTopKeywords(text: string): string[] {
  const cleaned = text
    .replace(/[\r\n]+/g, " ")
    .replace(/[\p{P}\p{S}]+/gu, " ")
    .toLowerCase();
  const words = cleaned.split(/\s+/).filter(Boolean);
  const stop = new Set(["the", "a", "an", "and", "or", "to", "of", "in", "on", "is", "are", "i", "we", "you", "我", "你", "他", "她", "我们", "你们", "他们", "的", "了", "吗", "呢", "啊", "是", "在", "就", "都", "也", "还", "和", "与", "及", "以及"]);
  const freq = new Map<string, number>();
  for (const w of words) {
    if (w.length < 2) continue;
    if (stop.has(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);
}

function scoreHeuristic(text: string): { score: number; signals: number; priceSensitive: boolean; sentiment: Sentiment } {
  const t = text.toLowerCase();

  const signalPatterns = [
    "合同",
    "签约",
    "付款",
    "发票",
    "采购",
    "走流程",
    "什么时候能",
    "交付",
    "上线",
    "部署",
    "试用",
    "po",
    "invoice",
    "purchase",
    "contract",
    "pay",
  ];
  const pricePatterns = ["价格", "便宜", "折扣", "优惠", "预算", "报价", "多少钱", "price", "discount", "budget", "quote"];
  const negativePatterns = ["太贵", "不行", "不考虑", "不需要", "不方便", "no", "not", "expensive", "concern", "issue"];
  const positivePatterns = ["可以", "没问题", "行", "好的", "愿意", "感兴趣", "ok", "sounds good", "interested", "great"];

  let signals = 0;
  for (const p of signalPatterns) if (t.includes(p)) signals += 1;
  let priceHits = 0;
  for (const p of pricePatterns) if (t.includes(p)) priceHits += 1;
  let negHits = 0;
  for (const p of negativePatterns) if (t.includes(p)) negHits += 1;
  let posHits = 0;
  for (const p of positivePatterns) if (t.includes(p)) posHits += 1;

  // base score from signals and positivity; penalize negativity
  let score = 40 + signals * 18 + posHits * 6 - negHits * 10;
  if (priceHits > 0) score += 4; // engaged on pricing still indicates consideration
  score = clamp(score, 0, 100);

  const sentiment: Sentiment = posHits - negHits >= 2 ? "positive" : negHits - posHits >= 2 ? "negative" : "neutral";

  return { score, signals, priceSensitive: priceHits > 0, sentiment };
}

export async function runMockAnalysis(transcriptText: string, settings: AppSettings): Promise<AnalysisResult> {
  const { score, signals, priceSensitive, sentiment } = scoreHeuristic(transcriptText);
  const keywordsTop = pickTopKeywords(transcriptText);

  const intention = intentionFromScore(score, settings.thresholds);

  const priority: "high" | "medium" | "low" =
    intention === "high" ? "high" : intention === "medium" ? "medium" : "low";

  const suggestions: AnalysisResult["suggestions"] = [
    {
      id: nanoid(),
      priority,
      titleZh:
        intention === "high"
          ? "锁定决策链路，24小时内推动下一步"
          : intention === "medium"
            ? "补齐关键信息，制造下一次触达理由"
            : "降低跟进成本，进入轻量培育",
      titleEn:
        intention === "high"
          ? "Lock decision path and push next step in 24h"
          : intention === "medium"
            ? "Fill info gaps and create a reason to follow up"
            : "Lower cost and nurture lightly",
      detailsZh:
        intention === "high"
          ? "建议：确认预算/签约流程/交付时间表，并发出会议邀请或合同草案。"
          : intention === "medium"
            ? "建议：针对顾虑点（如价格/竞品/落地）发送对比材料，并预约二次沟通。"
            : "建议：发送案例/白皮书，设置提醒在一周后再触达。",
      detailsEn:
        intention === "high"
          ? "Recommendation: confirm budget/procurement flow/delivery timeline, send meeting invite or draft contract."
          : intention === "medium"
            ? "Recommendation: address concerns (price/competition/implementation) with materials and schedule a follow‑up call."
            : "Recommendation: send a case study/whitepaper and set a reminder to re‑engage in a week.",
    },
  ];

  const metrics = [
    {
      key: "duration",
      labelZh: "对话时长（估算）",
      labelEn: "Conversation length (est.)",
      value: `${Math.max(1, Math.round(transcriptText.length / 180))} min`,
      helpZh: "演示版按文本长度估算；生产可由音频时长或转写时间戳计算。",
      helpEn: "Demo estimates via text length; production should use audio duration or transcript timestamps.",
    },
    {
      key: "signals",
      labelZh: "购买信号次数",
      labelEn: "Purchase signals",
      value: signals,
      helpZh: "基于合同/采购/交付/试用等关键词匹配。",
      helpEn: "Based on keywords like contract/procurement/delivery/trial.",
    },
    {
      key: "priceSensitivity",
      labelZh: "价格敏感",
      labelEn: "Price sensitive",
      value: priceSensitive ? "Yes" : "No",
      helpZh: "基于预算/报价/折扣等词匹配。",
      helpEn: "Based on budget/quote/discount keywords.",
    },
  ];

  return {
    score,
    intention,
    sentiment: { label: sentiment, confidence: sentiment === "neutral" ? 0.55 : 0.72 },
    keywordsTop,
    purchaseSignalsCount: signals,
    metrics,
    suggestions,
    extractedSnippets: transcriptText
      .split(/(?<=[。.!?\n])/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6)
      .map((text) => ({ text })),
    finishedAtISO: new Date().toISOString(),
    engine: "mock",
  };
}
