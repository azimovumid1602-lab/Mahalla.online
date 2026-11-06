import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Kirish — Mahalla Online" },
      { name: "description", content: "Mahalla Online'ga kiring yoki ro'yxatdan o'ting." },
      { property: "og:title", content: "Kirish — Mahalla Online" },
      { property: "og:description", content: "Mahallangizga onlayn qo'shiling." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/profil", replace: true });
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "up") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
      });
      setBusy(false);
      if (error) return void toast.error(error.message);
      setSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return void toast.error("Email yoki parol noto'g'ri");
      toast.success("Xush kelibsiz!");
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Google orqali kirib bo'lmadi");
  }

  if (sent)
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold text-primary">Emailingizni tekshiring</h1>
        <p className="mt-3 text-lg">{email} manziliga tasdiqlash havolasi yuborildi.</p>
      </div>
    );

  return (
    <div className="ornament min-h-[70vh] px-4 py-12">
      <form onSubmit={submit} className="mx-auto max-w-md space-y-4 rounded-2xl bg-card p-6 shadow-lift">
        <h1 className="text-2xl font-extrabold text-primary">{mode === "in" ? "Kirish" : "Ro'yxatdan o'tish"}</h1>
        {mode === "up" && (
          <div className="space-y-2">
            <Label className="text-base">Ism familiya</Label>
            <Input required className="h-12 text-base" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-base">Email</Label>
          <Input type="email" required className="h-12 text-base" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className="text-base">Parol</Label>
          <Input type="password" required minLength={6} className="h-12 text-base" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {mode === "in" ? "Kirish" : "Ro'yxatdan o'tish"}
        </Button>
        <Button type="button" variant="outline" size="lg" className="w-full" onClick={google}>
          Google bilan davom etish
        </Button>
        <button type="button" className="w-full py-2 font-semibold text-primary" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "Hisobingiz yo'qmi? Ro'yxatdan o'ting" : "Hisobingiz bormi? Kiring"}
        </button>
      </form>
    </div>
  );
}
