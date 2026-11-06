import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MapPin, ThumbsUp, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTransition } from "@/components/motion";
import { EmptyState, StatusBadge, StatusTimeline } from "@/components/problem-ui";
import { PROBLEM_CATEGORIES, formatDate, type ProblemCategory } from "@/lib/constants";
import { useAuth, displayName } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { usePhotoUrl } from "@/lib/photos";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/muammolar/$id")({
  head: () => ({
    meta: [
      { title: "Muammo tafsilotlari — Mahalla Online" },
      { name: "description", content: "Muammo holati, izohlar va qo'llab-quvvatlovchilar." },
      { property: "og:title", content: "Mahalla muammosi" },
      { property: "og:description", content: "Muammo holatini kuzating." },
    ],
  }),
  component: ProblemDetail,
});

function ProblemDetail() {
  const { id } = Route.useParams();
  const { t, lang } = useI18n();
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [comment, setComment] = useState("");

  const { data: p, isLoading } = useQuery({
    queryKey: ["problem", id],
    queryFn: async () => (await supabase.from("problems").select("*").eq("id", id).maybeSingle()).data,
  });
  const { data: comments } = useQuery({
    queryKey: ["comments", id],
    queryFn: async () =>
      (await supabase.from("comments").select("*").eq("problem_id", id).order("created_at")).data ?? [],
  });
  const { data: myVote } = useQuery({
    queryKey: ["myUpvote", id, user?.id],
    enabled: !!user,
    queryFn: async () =>
      !!(await supabase.from("problem_upvotes").select("problem_id").eq("problem_id", id).eq("user_id", user!.id).maybeSingle()).data,
  });
  const photo = usePhotoUrl(p?.photo_url);

  async function toggleVote() {
    if (!user) return void toast.info(t("loginToAct"));
    const { error } = myVote
      ? await supabase.from("problem_upvotes").delete().eq("problem_id", id).eq("user_id", user.id)
      : await supabase.from("problem_upvotes").insert({ problem_id: id, user_id: user.id });
    if (error) return void toast.error("Xatolik");
    qc.invalidateQueries({ queryKey: ["problem", id] });
    qc.invalidateQueries({ queryKey: ["myUpvote", id] });
    qc.invalidateQueries({ queryKey: ["problems"] });
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !comment.trim()) return;
    const { error } = await supabase
      .from("comments")
      .insert({ problem_id: id, user_id: user.id, author_name: displayName(profile, user), body: comment.trim().slice(0, 1000) });
    if (error) return void toast.error("Izoh yuborilmadi");
    setComment("");
    qc.invalidateQueries({ queryKey: ["comments", id] });
  }

  if (isLoading) return <div className="mx-auto max-w-3xl space-y-4 px-4 py-8"><Skeleton className="h-64 rounded-2xl" /></div>;
  if (!p) return <div className="mx-auto max-w-3xl px-4 py-8"><EmptyState text="Muammo topilmadi" /></div>;

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <Link to="/muammolar" className="inline-flex items-center gap-2 font-semibold text-primary">
          <ArrowLeft className="h-5 w-5" /> {t("problems")}
        </Link>
        <article className="rounded-2xl bg-card p-5 shadow-soft">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={p.status} />
            <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold">
              {PROBLEM_CATEGORIES[p.category as ProblemCategory][lang]}
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold">{p.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{p.author_name} · {formatDate(p.created_at, lang)}</p>
          {photo && <img src={photo} alt={p.title} loading="lazy" className="mt-4 max-h-96 w-full rounded-xl object-cover" />}
          <p className="mt-4 text-lg">{p.description}</p>
          {p.address && (
            <p className="mt-3 inline-flex items-center gap-2 text-muted-foreground"><MapPin className="h-5 w-5" />{p.address}</p>
          )}
          <Button onClick={toggleVote} size="lg" variant={myVote ? "default" : "outline"} className={cn("mt-5 w-full sm:w-auto")}>
            <ThumbsUp /> {t("meToo")} · {p.upvotes}
          </Button>
        </article>

        <section className="rounded-2xl bg-card p-5 shadow-soft">
          <h2 className="mb-4 text-xl font-bold">Holat</h2>
          <StatusTimeline status={p.status} />
        </section>

        <section className="rounded-2xl bg-card p-5 shadow-soft">
          <h2 className="text-xl font-bold">{t("comments")} ({comments?.length ?? 0})</h2>
          <div className="mt-4 space-y-3">
            {comments?.length === 0 && <p className="text-muted-foreground">Birinchi bo'lib fikr bildiring.</p>}
            {comments?.map((c) => (
              <div key={c.id} className="rounded-xl bg-secondary p-3">
                <p className="text-sm font-bold text-primary">{c.author_name || "Fuqaro"} <span className="font-normal text-muted-foreground">· {formatDate(c.created_at, lang)}</span></p>
                <p className="mt-1">{c.body}</p>
              </div>
            ))}
          </div>
          {user ? (
            <form onSubmit={addComment} className="mt-4 space-y-2">
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t("writeComment")} className="bg-background text-base" />
              <Button type="submit" disabled={!comment.trim()}>{t("send")}</Button>
            </form>
          ) : (
            <Button asChild variant="outline" className="mt-4"><Link to="/auth">{t("loginToAct")}</Link></Button>
          )}
        </section>
      </div>
    </PageTransition>
  );
}
