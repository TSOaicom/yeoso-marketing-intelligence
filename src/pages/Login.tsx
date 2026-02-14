import { useState } from "react";
import { useLocation, Link } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { t, lang } = useI18n();

  const [email, setEmail] = useState("admin@yeoso.demo");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success(lang === "zh" ? "登录成功" : "Signed in");
      setLocation("/app");
    } catch (err) {
      toast.error(lang === "zh" ? "账号或密码错误" : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-lg items-center px-6">
        <Card className="w-full border-border/50 bg-card/70 backdrop-blur">
          <CardHeader>
            <CardTitle className="font-display text-2xl">{t("auth.login")}</CardTitle>
            <CardDescription>{t("auth.demoHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (lang === "zh" ? "登录中…" : "Signing in…") : t("auth.login")}
              </Button>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <Link href="/">{lang === "zh" ? "返回主页" : "Back"}</Link>
                <Link href="/register">{t("auth.register")}</Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
