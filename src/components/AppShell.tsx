import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Home, Megaphone, AlertTriangle, User, Vote, Shield, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const tabs = [
    { to: "/", label: t("home"), icon: Home },
    { to: "/elonlar", label: t("announcements"), icon: Megaphone },
    { to: "/muammolar", label: t("problems"), icon: AlertTriangle },
    { to: "/sorovnomalar", label: t("polls"), icon: Vote },
    { to: "/profil", label: t("profile"), icon: User },
  ] as const;
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
            <span className="font-display text-lg font-extrabold text-primary">Mahalla Online</span>
          </Link>
          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {tabs.slice(1).map((tb) => (
              <Link
                key={tb.to}
                to={tb.to}
                className={cn(
                  "rounded-lg px-3 py-2 font-medium text-foreground/80 hover:bg-secondary",
                  isActive(tb.to) && "bg-secondary text-primary",
                )}
              >
                {tb.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" className={cn("rounded-lg px-3 py-2 font-medium text-urgent hover:bg-secondary", isActive("/admin") && "bg-secondary")}>
                {t("admin")}
              </Link>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex rounded-xl border-2 border-primary/20 p-0.5" role="group" aria-label="Til">
              {(["uz", "ru"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={cn(
                    "h-9 rounded-lg px-3 text-sm font-bold uppercase",
                    lang === l ? "bg-primary text-primary-foreground" : "text-primary",
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
            {isAdmin && (
              <Link to="/admin" className="md:hidden" aria-label={t("admin")}>
                <Shield className="h-6 w-6 text-urgent" />
              </Link>
            )}
            {user ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("logout")}
                className="hidden md:inline-flex"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/", replace: true });
                }}
              >
                <LogOut />
              </Button>
            ) : (
              <Button asChild size="sm" className="hidden md:inline-flex">
                <Link to="/auth">{t("login")}</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="mt-16 border-t bg-card">
        <div className="ornament-divider" />
        <div className="mx-auto max-w-6xl px-4 py-8 text-muted-foreground">
          <p className="font-display text-lg font-bold text-primary">Mahalla Online</p>
          <p className="mt-1">{lang === "uz" ? "Qo'shnilar uchun, qo'shnilar tomonidan." : "Для соседей, от соседей."}</p>
          <p className="mt-4 text-sm">© {new Date().getFullYear()} Mahalla Online</p>
        </div>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-card md:hidden">
        <div className="grid grid-cols-5">
          {tabs.map((tb) => (
            <Link
              key={tb.to}
              to={tb.to}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-muted-foreground",
                isActive(tb.to) && "text-primary",
              )}
            >
              <tb.icon className="h-6 w-6" />
              {tb.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
