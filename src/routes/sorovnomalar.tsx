import { createFileRoute } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeUp, PageTransition } from "@/components/motion";
import { EmptyState } from "@/components/problem-ui";
import { PollCard } from "@/components/PollCard";
import { usePolls } from "@/lib/polls";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/sorovnomalar")({
  head: () => ({
    meta: [
      { title: "So'rovnomalar — Mahalla Online" },
      { name: "description", content: "Mahalla qarorlarida ovoz bering." },
      { property: "og:title", content: "Mahalla so'rovnomalari" },
      { property: "og:description", content: "Fikringiz muhim — ovoz bering." },
    ],
  }),
  component: Polls,
});

function Polls() {
  const { t } = useI18n();
  const { data, isLoading } = usePolls();
  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <h1 className="text-3xl font-extrabold text-primary">{t("polls")}</h1>
        {isLoading && <Skeleton className="h-56 rounded-2xl" />}
        {!isLoading && data?.length === 0 && <EmptyState text="Hozircha so'rovnoma yo'q." />}
        {data?.map((p, i) => (
          <FadeUp key={p.id} delay={i * 0.08}>
            <PollCard poll={p} />
          </FadeUp>
        ))}
      </div>
    </PageTransition>
  );
}
