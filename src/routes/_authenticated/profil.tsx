import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTransition } from "@/components/motion";
import { EmptyState, StatusBadge } from "@/components/problem-ui";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { usePolls } from "@/lib/polls";

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({
    meta: [
      { title: "Profil — Mahalla Online" },
      { name: "description", content: "Mening muammolarim, ovozlarim va ma'lumotlarim." },
      { property: "og:title", content: "Profil — Mahalla Online" },
      { property: "og:description", content: "Shaxsiy sahifa." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { t } = useI18n();
  const { user, profile, refresh } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", phone: "", street: "" });
  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name, phone: profile.phone ?? "", street: profile.street ?? "" });
  }, [profile]);

  const { data: mine } = useQuery({
    queryKey: ["myProblems", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("problems").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: polls } = usePolls();
  const myVotes = (polls ?? []).flatMap((p) => {
    const v = p.votes.find((x) => x.user_id === user?.id);
    return v ? [{ q: p.question, a: p.options.find((o) => o.id === v.option_id)?.label }] : [];
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("profiles").update(form).eq("id", user.id);
    if (error) return void toast.error("Saqlanmadi");
    toast.success("Saqlandi");
    refresh();
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-primary">{t("profile")}</h1>
          <Button
            variant="ghost"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth", replace: true });
            }}
          >
            <LogOut /> {t("logout")}
          </Button>
        </div>

        <section className="rounded-2xl bg-card p-5 shadow-soft">
          <h2 className="text-xl font-bold">{t("myProblems")}</h2>
          <div className="mt-3 space-y-2">
            {mine?.length === 0 && <EmptyState text="Siz hali muammo yubormagansiz." />}
            {mine?.map((p) => (
              <Link key={p.id} to="/muammolar/$id" params={{ id: p.id }} className="flex items-center justify-between gap-3 rounded-xl bg-secondary p-3">
                <span className="font-semibold">{p.title}</span>
                <StatusBadge status={p.status} />
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-card p-5 shadow-soft">
          <h2 className="text-xl font-bold">{t("myVotes")}</h2>
          <div className="mt-3 space-y-2">
            {myVotes.length === 0 && <p className="text-muted-foreground">Hali ovoz bermagansiz.</p>}
            {myVotes.map((v) => (
              <div key={v.q} className="rounded-xl bg-secondary p-3">
                <p className="font-semibold">{v.q}</p>
                <p className="text-primary">→ {v.a}</p>
              </div>
            ))}
          </div>
        </section>

        <form onSubmit={save} className="space-y-4 rounded-2xl bg-card p-5 shadow-soft">
          <h2 className="text-xl font-bold">{t("editInfo")}</h2>
          <p className="text-muted-foreground">{user?.email}</p>
          {(
            [
              ["full_name", "Ism familiya"],
              ["phone", "Telefon"],
              ["street", "Ko'cha / uy"],
            ] as const
          ).map(([k, l]) => (
            <div key={k} className="space-y-2">
              <Label className="text-base">{l}</Label>
              <Input className="h-12 text-base" maxLength={120} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </div>
          ))}
          <Button type="submit">{t("save")}</Button>
        </form>
      </div>
    </PageTransition>
  );
}
