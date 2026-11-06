import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BellRing, CalendarDays, Pin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeUp, PageTransition } from "@/components/motion";
import { EmptyState } from "@/components/problem-ui";
import { ANN_CATEGORIES, formatDate, type AnnCategory } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/elonlar")({
  head: () => ({
    meta: [
      { title: "E'lonlar — Mahalla Online" },
      { name: "description", content: "Pensiya, yig'ilish, kommunal va tadbir e'lonlari." },
      { property: "og:title", content: "Mahalla e'lonlari" },
      { property: "og:description", content: "Mahallangizdagi eng so'nggi e'lonlar." },
    ],
  }),
  component: Announcements,
});

const catColor: Record<AnnCategory, string> = {
  pensiya: "bg-accent/25 text-accent-foreground",
  yigilish: "bg-primary/10 text-primary",
  kommunal: "bg-status-progress/15 text-status-progress",
  tadbir: "bg-status-done/15 text-status-done",
  muhim: "bg-urgent/15 text-urgent",
};

function downloadIcs(title: string, body: string, at: string) {
  const d = new Date(at);
  const fmt = (x: Date) => x.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const end = new Date(d.getTime() + 3600e3);
  const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${fmt(d)}\nDTEND:${fmt(end)}\nSUMMARY:${title}\nDESCRIPTION:${body.replace(/\n/g, " ")}\nBEGIN:VALARM\nTRIGGER:-PT2H\nACTION:DISPLAY\nDESCRIPTION:${title}\nEND:VALARM\nEND:VEVENT\nEND:VCALENDAR`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = "eslatma.ics";
  a.click();
  toast.success("Eslatma taqvimga qo'shildi");
}

export function useAnnouncements() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function Announcements() {
  const { t, lang } = useI18n();
  const [cat, setCat] = useState<AnnCategory | "all">("all");
  const { data, isLoading } = useAnnouncements();
  const list = (data ?? []).filter((a) => cat === "all" || a.category === cat);

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-extrabold text-primary">{t("announcements")}</h1>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {(["all", ...Object.keys(ANN_CATEGORIES)] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c as AnnCategory | "all")}
              className={cn(
                "h-11 shrink-0 rounded-full border-2 px-4 font-semibold",
                cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
              )}
            >
              {c === "all" ? t("all") : ANN_CATEGORIES[c as AnnCategory][lang]}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-4">
          {isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
          {!isLoading && list.length === 0 && <EmptyState text="Hozircha e'lonlar yo'q. Tez orada yangiliklar bo'ladi!" />}
          {list.map((a, i) => (
            <FadeUp key={a.id} delay={Math.min(i * 0.06, 0.3)}>
              <article
                className={cn(
                  "rounded-2xl bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift",
                  a.pinned && "border-l-4 border-urgent",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  {a.pinned && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-urgent px-3 py-1 text-sm font-bold text-urgent-foreground">
                      <Pin className="h-4 w-4" /> {t("pinned")}
                    </span>
                  )}
                  <span className={cn("rounded-full px-3 py-1 text-sm font-semibold", catColor[a.category as AnnCategory])}>
                    {ANN_CATEGORIES[a.category as AnnCategory][lang]}
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-bold">{a.title}</h2>
                <p className="mt-2 text-foreground/85">{a.body}</p>
                {a.event_at && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary p-3">
                    <span className="inline-flex items-center gap-2 font-bold text-primary">
                      <CalendarDays className="h-5 w-5" /> {formatDate(a.event_at, lang)}
                    </span>
                    <Button size="sm" variant="accent" onClick={() => downloadIcs(a.title, a.body, a.event_at!)}>
                      <BellRing /> {t("remind")}
                    </Button>
                  </div>
                )}
                <p className="mt-3 text-sm text-muted-foreground">{formatDate(a.created_at, lang)}</p>
              </article>
            </FadeUp>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
