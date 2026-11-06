import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { UserPlus, PenLine, ListChecks } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CountUp, FadeUp } from "@/components/motion";
import { useI18n } from "@/lib/i18n";
import hero from "@/assets/mahalla-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mahalla Online — mahalla muammolari bir joyda" },
      { name: "description", content: "E'lonlar, muammolar va so'rovnomalar: mahallangiz bilan yig'ilishsiz onlayn bog'laning." },
      { property: "og:title", content: "Mahalla Online" },
      { property: "og:description", content: "Mahalla muammolari endi bir joyda." },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useI18n();
  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const weekAgo = new Date(Date.now() - 30 * 864e5).toISOString();
      const [a, b, c] = await Promise.all([
        supabase.from("problems").select("*", { count: "exact", head: true }).eq("status", "hal_qilindi"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("announcements").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
      ]);
      return { solved: a.count ?? 0, members: b.count ?? 0, ann: c.count ?? 0 };
    },
  });

  const steps = [
    { icon: UserPlus, title: t("step1"), d: t("step1d") },
    { icon: PenLine, title: t("step2"), d: t("step2d") },
    { icon: ListChecks, title: t("step3"), d: t("step3d") },
  ];

  return (
    <>
      <section className="ornament relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 md:grid-cols-2 md:py-16">
          <FadeUp>
            <p className="mb-3 inline-block rounded-full bg-accent/25 px-4 py-1 text-sm font-semibold text-accent-foreground">
              Mahalla Online
            </p>
            <h1 className="text-4xl font-extrabold leading-tight text-primary md:text-5xl">{t("heroTitle")}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{t("heroSub")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/muammolar/yangi">{t("sendProblem")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/elonlar">{t("seeAnnouncements")}</Link>
              </Button>
            </div>
          </FadeUp>
          <FadeUp delay={0.15}>
            <img
              src={hero}
              width={1280}
              height={896}
              alt="Mahalla ko'chasi"
              className="aspect-[4/3] w-full rounded-3xl object-cover shadow-lift"
            />
          </FadeUp>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { v: stats?.solved ?? 0, l: t("solved"), c: "text-status-done" },
            { v: stats?.members ?? 0, l: t("members"), c: "text-primary" },
            { v: stats?.ann ?? 0, l: t("newAnn"), c: "text-urgent" },
          ].map((s, i) => (
            <FadeUp key={s.l} delay={i * 0.1}>
              <div className="rounded-2xl bg-card p-6 shadow-soft">
                <p className={`font-display text-5xl font-extrabold ${s.c}`}>
                  <CountUp value={s.v} />
                </p>
                <p className="mt-2 text-lg font-medium">{s.l}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      <div className="ornament-divider mx-auto max-w-6xl" />

      <section className="mx-auto max-w-6xl px-4 py-12">
        <FadeUp>
          <h2 className="text-3xl font-extrabold text-primary">{t("howItWorks")}</h2>
        </FadeUp>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <FadeUp key={s.title} delay={i * 0.12}>
              <div className="h-full rounded-2xl bg-card p-6 shadow-soft transition-transform hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent/25 font-display text-xl font-extrabold text-accent-foreground">
                    {i + 1}
                  </span>
                  <s.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mt-4 text-xl font-bold">{s.title}</h3>
                <p className="mt-1 text-muted-foreground">{s.d}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>
    </>
  );
}
