import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/ThemeContext";
import { useI18n } from "@/contexts/I18nContext";
import heroImg from "@/assets/yeoso-hero.jpeg";
import { Moon, Sun } from "lucide-react";

export default function Landing() {
  const { toggleTheme, theme } = useTheme();
  const { toggleLang, lang, t } = useI18n();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-xl tracking-tight">Yeoso</span>
            <Badge variant="secondary" className="border border-border/50 bg-muted/40">Multi‑Agent</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={toggleLang} className="h-9 px-3">
              {lang === "zh" ? t("common.english") : t("common.chinese")}
            </Button>
            <Button variant="ghost" onClick={toggleTheme} className="h-9 w-9 p-0" aria-label={t("common.theme")}
              title={t("common.theme")}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button asChild className="h-9">
              <Link href="/login">{t("auth.login")}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="relative mt-10 overflow-hidden rounded-3xl border border-border/40">
          <img
            src={heroImg}
            alt="Yeoso hero"
            className="absolute inset-0 h-full w-full object-cover opacity-70"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-background/10" />
          <div className="relative grid gap-10 px-8 py-16 md:grid-cols-[1.2fr,0.8fr] md:px-12">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="space-y-6"
            >
              <div className="space-y-3">
                <Badge className="bg-primary text-primary-foreground">{t("app.name")}</Badge>
                <h1 className="font-display text-4xl leading-[1.05] tracking-tight md:text-6xl">
                  {lang === "zh" ? (
                    <>把客户对话变成<br />可执行的下一步</>
                  ) : (
                    <>Turn customer conversations<br />into next actions</>
                  )}
                </h1>
                <p className="max-w-xl text-base text-muted-foreground md:text-lg">
                  {lang === "zh"
                    ? "单个/批量导入音频与文档，多智能体并行提炼意向、指标与建议；一键导出报告与销售看板。"
                    : "Upload audio/docs (single or batch). Multi‑agents run in parallel to score intent, extract metrics, and generate next steps — export reports and dashboards."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-11">
                  <Link href="/register">{t("auth.register")}</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-11 bg-background/40">
                  <Link href="/login">{lang === "zh" ? "进入工作台" : "Open Workspace"}</Link>
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 md:grid-cols-4">
                {[
                  { zh: "并行智能体", en: "Parallel Agents" },
                  { zh: "意向评分", en: "Intent Scoring" },
                  { zh: "行动建议", en: "Next Actions" },
                  { zh: "导出报告", en: "Export" },
                ].map((x) => (
                  <div key={x.en} className="rounded-2xl border border-border/50 bg-background/50 p-4">
                    <div className="text-xs text-muted-foreground">{lang === "zh" ? "能力" : "Capability"}</div>
                    <div className="mt-1 font-medium">{lang === "zh" ? x.zh : x.en}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }}
              className="rounded-3xl border border-border/50 bg-background/55 p-6 backdrop-blur-xl"
            >
              <div className="text-sm text-muted-foreground">{lang === "zh" ? "演示账号" : "Demo account"}</div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-mono">admin@yeoso.demo</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Password</span>
                  <span className="font-mono">admin123</span>
                </div>
              </div>
              <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
                {lang === "zh"
                  ? "提示：本演示站不包含后端。登录/数据仅保存在你的浏览器本地存储中。"
                  : "Note: This is a static demo (no backend). Auth/data are stored in your browser only."}
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-14">
          <div className="grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-3xl border border-border/50 bg-card/70 p-6 backdrop-blur"
              >
                <div className="text-xs text-muted-foreground">
                  {lang === "zh" ? "工作流" : "Workflow"} #{i + 1}
                </div>
                <div className="mt-2 font-medium">
                  {lang === "zh"
                    ? ["解析/转写", "多智能体并发", "聚合/导出"][i]
                    : ["Parse / Transcribe", "Parallel Agents", "Aggregate / Export"][i]}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {lang === "zh"
                    ? [
                        "上传音频/文本后，按格式自动提取对话内容。",
                        "意向评分、关键词/情绪、行动策略智能体并行运行。",
                        "生成结构化结果，导出单份报告或多客户汇总。",
                      ][i]
                    : [
                        "After upload, extract conversation content by file type.",
                        "Intent, sentiment/keywords, and action‑planner agents run simultaneously.",
                        "Produce structured results and export single or batch reports.",
                      ][i]}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 bg-background/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} Yeoso</span>
          <span>{lang === "zh" ? "多智能体数字员工 · 营销情报" : "Multi‑Agent digital workforce · Marketing intelligence"}</span>
        </div>
      </footer>
    </div>
  );
}
