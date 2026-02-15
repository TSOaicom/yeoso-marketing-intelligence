import { Link, Route, Switch, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/contexts/ThemeContext";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { LayoutDashboard, UploadCloud, ListChecks, LineChart, Settings, BookOpen, Shield, LogOut, Moon, Sun } from "lucide-react";

import Overview from "@/pages/app/Overview";
import Uploads from "@/pages/app/Uploads";
import Results from "@/pages/app/Results";
import Analytics from "@/pages/app/Analytics";
import SettingsPage from "@/pages/app/SettingsPage";
import Docs from "@/pages/app/Docs";
import Admin from "@/pages/app/Admin";

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const [location] = useLocation();
  const active = location === href || location.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
        active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
      )}
    >
      <span className={cn("h-4 w-4", active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

export default function AppLayout() {
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useI18n();
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();


  return (
    <div className="min-w-0 bg-background text-foreground">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-3">
          {/* Logo */}
          <div className="flex flex-col">
            <div className="font-display text-lg font-semibold tracking-tight">Yeoso</div>
            <div className="text-xs text-muted-foreground">{lang === "zh" ? "营销情报工作台" : "Marketing Intelligence"}</div>
          </div>
          
          {/* 导航菜单 */}
          <nav className="flex flex-wrap items-center gap-4">
            <NavItem href="/app/overview" icon={<LayoutDashboard className="h-4 w-4" />} label={t("nav.overview")} />
            <NavItem href="/app/uploads" icon={<UploadCloud className="h-4 w-4" />} label={t("nav.uploads")} />
            <NavItem href="/app/results" icon={<ListChecks className="h-4 w-4" />} label={t("nav.results")} />
            <NavItem href="/app/analytics" icon={<LineChart className="h-4 w-4" />} label={t("nav.analytics")} />
            <NavItem href="/app/settings" icon={<Settings className="h-4 w-4" />} label={t("nav.settings")} />
            <NavItem href="/app/docs" icon={<BookOpen className="h-4 w-4" />} label={t("nav.docs")} />
            {user?.role === "admin" ? (
              <NavItem href="/app/admin" icon={<Shield className="h-4 w-4" />} label={t("nav.admin")} />
            ) : null}
          </nav>
          
          {/* 用户信息和操作 */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="h-9 w-9 p-0" onClick={toggleLang} title={t("common.language")}>
              <span className="text-xs font-medium">{lang === "zh" ? "EN" : "中"}</span>
            </Button>
            <Button variant="ghost" className="h-9 w-9 p-0" onClick={toggleTheme} title={t("common.theme")}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <div className="text-sm font-medium whitespace-nowrap">{user?.name ?? "—"}</div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">{user?.email ?? ""}</div>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 bg-background/40"
                onClick={() => {
                  logout();
                  setLocation("/");
                }}
                title={t("auth.logout")}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="min-h-screen">
        <ScrollArea className="h-full">
          <div className="mx-auto max-w-6xl px-8 py-8">
            <Switch>
              <Route path="/app/overview" component={Overview} />
              <Route path="/app/uploads" component={Uploads} />
              <Route path="/app/results/:id?" component={Results} />
              <Route path="/app/analytics" component={Analytics} />
              <Route path="/app/settings" component={SettingsPage} />
              <Route path="/app/docs" component={Docs} />
              <Route path="/app/admin" component={Admin} />
              <Route>404</Route>
            </Switch>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
