import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MapPin, Plus, ThumbsUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeUp, PageTransition } from "@/components/motion";
import { EmptyState, StatusBadge } from "@/components/problem-ui";
import { PROBLEM_CATEGORIES, STATUSES, STATUS_META, formatDate, type ProblemCategory, type Status } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/muammolar/")({
  head: () => ({
    meta: [
      { title: "Muammolar — Mahalla Online" },
      { name: "description", content: "Mahalladagi yo'l, suv, elektr va boshqa muammolar ro'yxati va holati." },
      { property: "og:title", content: "Mahalla muammolari" },
      { property: "og:description", content: "Muammolarni kuzating va qo'llab-quvvatlang." },
    ],
  }),
  component: Problems,
});

function Problems() {
  const { t, lang } = useI18n();
  const [cat, setCat] = useState<ProblemCategory | "all">("all");
  const [status, setStatus] = useState<Status | "all">("all");
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["problems"],
    queryFn: async () => {
      const { data, error } = await supabase.from("problems").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const list = (data ?? []).filter(
    (p) =>
      (cat === "all" || p.category === cat) &&
      (status === "all" || p.status === status) &&
      (!q || (p.title + p.description + p.address).toLowerCase().includes(q.toLowerCase())),
  );

  const chip = (active: boolean) =>
    cn("h-11 shrink-0 rounded-full border-2 px-4 font-semibold", active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card");

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold text-primary">{t("problems")}</h1>
          <Button asChild>
            <Link to="/muammolar/yangi">
              <Plus /> <span className="hidden sm:inline">{t("sendProblem")}</span>
            </Link>
          </Button>
        </div>
        <Input className="mt-5 h-12 rounded-xl bg-card text-base" placeholder={t("search")} value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          <button className={chip(cat === "all")} onClick={() => setCat("all")}>{t("all")}</button>
          {(Object.keys(PROBLEM_CATEGORIES) as ProblemCategory[]).map((c) => (
            <button key={c} className={chip(cat === c)} onClick={() => setCat(c)}>
              {PROBLEM_CATEGORIES[c][lang]}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button className={chip(status === "all")} onClick={() => setStatus("all")}>{t("all")}</button>
          {STATUSES.map((s) => (
            <button key={s} className={chip(status === s)} onClick={() => setStatus(s)}>
              {STATUS_META[s][lang]}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-4">
          {isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
          {!isLoading && list.length === 0 && <EmptyState text="Bunday muammo topilmadi. Ajoyib — demak hammasi joyida!" />}
          {list.map((p, i) => (
            <FadeUp key={p.id} delay={Math.min(i * 0.06, 0.3)}>
              <Link
                to="/muammolar/$id"
                params={{ id: p.id }}
                className="block rounded-2xl bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={p.status} />
                  <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold">
                    {PROBLEM_CATEGORIES[p.category as ProblemCategory][lang]}
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-bold">{p.title}</h2>
                <p className="mt-1 line-clamp-2 text-foreground/80">{p.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {p.address && (
                    <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{p.address}</span>
                  )}
                  <span className="inline-flex items-center gap-1 font-semibold text-primary"><ThumbsUp className="h-4 w-4" />{p.upvotes}</span>
                  <span>{formatDate(p.created_at, lang, false)}</span>
                </div>
              </Link>
            </FadeUp>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
