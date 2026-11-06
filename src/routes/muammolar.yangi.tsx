import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageTransition } from "@/components/motion";
import { PROBLEM_CATEGORIES, type ProblemCategory } from "@/lib/constants";
import { useAuth, displayName } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/muammolar/yangi")({
  head: () => ({
    meta: [
      { title: "Muammo yuborish — Mahalla Online" },
      { name: "description", content: "Mahalladagi muammo haqida rasm va manzil bilan xabar bering." },
      { property: "og:title", content: "Muammo yuborish" },
      { property: "og:description", content: "Muammoni mahalla raisiga onlayn yuboring." },
    ],
  }),
  component: NewProblem,
});

function NewProblem() {
  const { t, lang } = useI18n();
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", category: "yol" as ProblemCategory, description: "", address: "" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && !user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-xl font-semibold">{t("loginToAct")}</p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/auth">{t("login")}</Link>
        </Button>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (form.title.trim().length < 3 || form.description.trim().length < 5) {
      toast.error("Iltimos, sarlavha va tavsifni to'ldiring");
      return;
    }
    setBusy(true);
    let photo_url: string | null = null;
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setBusy(false);
        return void toast.error("Rasm 5 MB dan oshmasin");
      }
      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.]/g, "_")}`;
      const { error } = await supabase.storage.from("problem-photos").upload(path, file);
      if (error) {
        setBusy(false);
        return void toast.error("Rasm yuklanmadi");
      }
      photo_url = path;
    }
    const { data, error } = await supabase
      .from("problems")
      .insert({ ...form, title: form.title.trim(), user_id: user.id, author_name: displayName(profile, user), photo_url })
      .select("id")
      .single();
    setBusy(false);
    if (error) return void toast.error("Xatolik yuz berdi, qaytadan urinib ko'ring");
    toast.success("Muammo yuborildi! Rahmat.");
    navigate({ to: "/muammolar/$id", params: { id: data.id } });
  }

  return (
    <PageTransition>
      <form onSubmit={submit} className="mx-auto max-w-xl space-y-5 px-4 py-8">
        <h1 className="text-3xl font-extrabold text-primary">{t("sendProblem")}</h1>
        <div className="space-y-2">
          <Label className="text-base">Sarlavha</Label>
          <Input required maxLength={120} className="h-12 bg-card text-base" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Masalan: Ko'chada chiroq yonmayapti" />
        </div>
        <div className="space-y-2">
          <Label className="text-base">Turkum</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(PROBLEM_CATEGORIES) as ProblemCategory[]).map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setForm({ ...form, category: c })}
                className={cn(
                  "h-12 rounded-xl border-2 font-semibold",
                  form.category === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
                )}
              >
                {PROBLEM_CATEGORIES[c][lang]}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-base">Tavsif</Label>
          <Textarea required maxLength={2000} rows={5} className="bg-card text-base" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label className="text-base">Manzil / ko'cha</Label>
          <Input maxLength={200} className="h-12 bg-card text-base" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed bg-card p-4">
          <Camera className="h-6 w-6 text-primary" />
          <span className="font-medium">{file ? file.name : "Rasm qo'shish (ixtiyoriy)"}</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Yuborilmoqda..." : t("send")}
        </Button>
      </form>
    </PageTransition>
  );
}
