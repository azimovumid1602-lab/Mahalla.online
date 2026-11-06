import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pin, PinOff, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageTransition } from "@/components/motion";
import { EmptyState, StatusBadge } from "@/components/problem-ui";
import { ANN_CATEGORIES, STATUSES, STATUS_META, formatDate, type AnnCategory, type Status } from "@/lib/constants";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useAnnouncements } from "@/routes/elonlar";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Boshqaruv paneli — Mahalla Online" },
      { name: "description", content: "Mahalla raisi uchun boshqaruv paneli." },
      { property: "og:title", content: "Boshqaruv paneli" },
      { property: "og:description", content: "E'lonlar, muammolar va so'rovnomalarni boshqarish." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { isAdmin, loading } = useAuth();
  const { lang } = useI18n();
  const qc = useQueryClient();
  const { data: problems } = useQuery({
    queryKey: ["problems"],
    queryFn: async () => (await supabase.from("problems").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: anns } = useAnnouncements();

  if (loading) return null;
  if (!isAdmin) return <div className="mx-auto max-w-xl px-4 py-12"><EmptyState text="Bu sahifa faqat mahalla raisi uchun." /></div>;

  const counts = STATUSES.map((s) => ({ s, n: problems?.filter((p) => p.status === s).length ?? 0 }));

  async function setStatus(id: string, status: Status) {
    const { error } = await supabase.from("problems").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return void toast.error("Xatolik");
    toast.success("Holat yangilandi");
    qc.invalidateQueries({ queryKey: ["problems"] });
  }
  async function togglePin(id: string, pinned: boolean) {
    await supabase.from("announcements").update({ pinned: !pinned }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["announcements"] });
  }
  async function delAnn(id: string) {
    await supabase.from("announcements").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["announcements"] });
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <h1 className="text-3xl font-extrabold text-primary">Boshqaruv paneli</h1>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {counts.map(({ s, n }) => (
            <div key={s} className="rounded-2xl bg-card p-4 shadow-soft">
              <p className="font-display text-4xl font-extrabold">{n}</p>
              <StatusBadge status={s} />
            </div>
          ))}
        </div>

        <section className="rounded-2xl bg-card p-5 shadow-soft">
          <h2 className="text-xl font-bold">Muammolar</h2>
          <div className="mt-3 divide-y">
            {problems?.map((p) => (
              <div key={p.id} className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold">{p.title}</p>
                  <p className="text-sm text-muted-foreground">{p.address} · 👍 {p.upvotes} · {formatDate(p.created_at, lang, false)}</p>
                </div>
                <select
                  value={p.status}
                  onChange={(e) => setStatus(p.id, e.target.value as Status)}
                  className="h-12 rounded-xl border-2 bg-background px-3 font-semibold"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s][lang]}</option>)}
                </select>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <AnnouncementForm />
          <PollForm />
        </div>

        <section className="rounded-2xl bg-card p-5 shadow-soft">
          <h2 className="text-xl font-bold">E'lonlar</h2>
          <div className="mt-3 divide-y">
            {anns?.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 py-3">
                <p className="font-semibold">{a.pinned && "📌 "}{a.title}</p>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" aria-label="Pin" onClick={() => togglePin(a.id, a.pinned)}>
                    {a.pinned ? <PinOff /> : <Pin />}
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="O'chirish" onClick={() => delAnn(a.id)}>
                    <Trash2 className="text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageTransition>
  );
}

function AnnouncementForm() {
  const { lang } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState({ title: "", body: "", category: "muhim" as AnnCategory, event_at: "", pinned: false });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("announcements").insert({
      ...f,
      event_at: f.event_at ? new Date(f.event_at).toISOString() : null,
      created_by: user?.id ?? null,
    });
    if (error) return void toast.error("E'lon qo'shilmadi");
    toast.success("E'lon joylandi");
    setF({ title: "", body: "", category: "muhim", event_at: "", pinned: false });
    qc.invalidateQueries({ queryKey: ["announcements"] });
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl bg-card p-5 shadow-soft">
      <h2 className="text-xl font-bold">Yangi e'lon</h2>
      <Input required placeholder="Sarlavha" className="h-12 text-base" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <Textarea required placeholder="Matn" className="text-base" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
      <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as AnnCategory })} className="h-12 w-full rounded-xl border-2 bg-background px-3">
        {(Object.keys(ANN_CATEGORIES) as AnnCategory[]).map((c) => <option key={c} value={c}>{ANN_CATEGORIES[c][lang]}</option>)}
      </select>
      <div className="space-y-1">
        <Label>Sana va vaqt (ixtiyoriy)</Label>
        <Input type="datetime-local" className="h-12" value={f.event_at} onChange={(e) => setF({ ...f, event_at: e.target.value })} />
      </div>
      <label className="flex items-center gap-2 font-medium">
        <input type="checkbox" className="h-5 w-5" checked={f.pinned} onChange={(e) => setF({ ...f, pinned: e.target.checked })} />
        Muhim (yuqorida qadash)
      </label>
      <Button type="submit" className="w-full">Joylash</Button>
    </form>
  );
}

function PollForm() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState(["Ha", "Yo'q"]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = opts.map((o) => o.trim()).filter(Boolean);
    if (clean.length < 2) return void toast.error("Kamida 2 ta variant kerak");
    const { data, error } = await supabase.from("polls").insert({ question: q, created_by: user?.id ?? null }).select("id").single();
    if (error) return void toast.error("So'rovnoma yaratilmadi");
    await supabase.from("poll_options").insert(clean.map((label, position) => ({ poll_id: data.id, label, position })));
    toast.success("So'rovnoma yaratildi");
    setQ("");
    setOpts(["Ha", "Yo'q"]);
    qc.invalidateQueries({ queryKey: ["polls"] });
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl bg-card p-5 shadow-soft">
      <h2 className="text-xl font-bold">Yangi so'rovnoma</h2>
      <Input required placeholder="Savol" className="h-12 text-base" value={q} onChange={(e) => setQ(e.target.value)} />
      {opts.map((o, i) => (
        <div key={i} className="flex gap-2">
          <Input className="h-12 text-base" value={o} onChange={(e) => setOpts(opts.map((x, j) => (j === i ? e.target.value : x)))} />
          {opts.length > 2 && (
            <Button type="button" size="icon" variant="ghost" onClick={() => setOpts(opts.filter((_, j) => j !== i))}><X /></Button>
          )}
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => setOpts([...opts, ""])}><Plus /> Variant</Button>
      <Button type="submit" className="w-full">Yaratish</Button>
    </form>
  );
}
