// Design contract (Constructivist Techno‑Swiss)
// - Sharp contrast, cyan/lime accents, editorial serif display
// - Asymmetric layouts, broken grids, subtle grain

import * as React from "react";

export type Lang = "zh" | "en";

type Dict = Record<string, { zh: string; en: string }>;

const dict: Dict = {
  "app.name": { zh: "Yeoso 多智能体营销情报", en: "Yeoso Multi‑Agent Marketing Intelligence" },
  "nav.overview": { zh: "总览", en: "Overview" },
  "nav.uploads": { zh: "上传中心", en: "Uploads" },
  "nav.results": { zh: "结果列表", en: "Results" },
  "nav.analytics": { zh: "销售看板", en: "Analytics" },
  "nav.settings": { zh: "设置", en: "Settings" },
  "nav.docs": { zh: "Coze 部署", en: "Coze Deployment" },
  "nav.admin": { zh: "管理后台", en: "Admin" },

  "auth.login": { zh: "登录", en: "Sign in" },
  "auth.register": { zh: "注册", en: "Create account" },
  "auth.logout": { zh: "退出登录", en: "Sign out" },
  "auth.email": { zh: "邮箱", en: "Email" },
  "auth.password": { zh: "密码", en: "Password" },
  "auth.name": { zh: "姓名", en: "Name" },
  "auth.demoHint": {
    zh: "演示版为纯前端本地登录（仅存浏览器本地存储）。生产环境请对接企业 SSO 或后端鉴权。",
    en: "Demo uses local‑only auth (stored in browser). For production, connect SSO or a real backend.",
  },

  "common.language": { zh: "语言", en: "Language" },
  "common.theme": { zh: "主题", en: "Theme" },
  "common.dark": { zh: "深色", en: "Dark" },
  "common.light": { zh: "浅色", en: "Light" },
  "common.english": { zh: "English", en: "English" },
  "common.chinese": { zh: "中文", en: "中文" },
};

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: keyof typeof dict | string) => string;
}

const I18nContext = React.createContext<I18nContextValue | undefined>(undefined);

const STORAGE_KEY = "yeoso.lang";

export function I18nProvider({ children, defaultLang = "zh" }: { children: React.ReactNode; defaultLang?: Lang }) {
  const [lang, setLangState] = React.useState<Lang>(() => {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "en" || v === "zh" ? v : defaultLang;
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
  };

  const toggleLang = () => setLang(lang === "zh" ? "en" : "zh");

  const t = (key: keyof typeof dict | string) => {
    const v = dict[key as keyof typeof dict];
    if (!v) return String(key);
    return v[lang];
  };

  return <I18nContext.Provider value={{ lang, setLang, toggleLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
