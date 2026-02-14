import { useState } from "react";
import { useLocation, Link } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";

export default function Register() {
  const [, setLocation] = useLocation();
  const { register } = useAuth();
  const { t, lang } = useI18n();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(name.trim() || "User", email.trim(), password);
      toast.success(lang === "zh" ? "注册成功" : "Account created");
      setLocation("/app");
    } catch (err) {
      toast.error(lang === "zh" ? "该邮箱已注册" : "Email already exists");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-lg items-center px-6">
        <Card className="w-full border-border/50 bg-card/70 backdrop-blur">
          <CardHeader>
            <CardTitle className="font-display text-2xl">{t("auth.register")}</CardTitle>
            <CardDescription>{t("auth.demoHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name">{t("auth.name")}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (lang === "zh" ? "创建中…" : "Creating…") : t("auth.register")}
              </Button>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <Link href="/">{lang === "zh" ? "返回主页" : "Back"}</Link>
                <Link href="/login">{t("auth.login")}</Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
