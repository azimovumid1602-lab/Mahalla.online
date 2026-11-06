import { motion, useReducedMotion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type PollData = {
  id: string;
  question: string;
  active: boolean;
  options: { id: string; label: string }[];
  votes: { option_id: string; user_id: string }[];
};

export function PollCard({ poll }: { poll: PollData }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const reduce = useReducedMotion();
  const mine = poll.votes.find((v) => v.user_id === user?.id);
  const total = poll.votes.length;
  const showResults = !!mine || !poll.active;

  async function vote(optionId: string) {
    if (!user) return void toast.info(t("loginToAct"));
    const { error } = await supabase.from("poll_votes").insert({ poll_id: poll.id, option_id: optionId, user_id: user.id });
    if (error) return void toast.error("Siz allaqachon ovoz bergansiz");
    toast.success("Ovozingiz qabul qilindi!");
    qc.invalidateQueries({ queryKey: ["polls"] });
  }

  return (
    <div className="rounded-2xl bg-card p-5 shadow-soft">
      <h2 className="text-xl font-bold">{poll.question}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{total} {t("votes")}</p>
      <div className="mt-4 space-y-3">
        {poll.options.map((o) => {
          const count = poll.votes.filter((v) => v.option_id === o.id).length;
          const pct = total ? Math.round((count / total) * 100) : 0;
          if (!showResults)
            return (
              <button
                key={o.id}
                onClick={() => vote(o.id)}
                className="flex min-h-14 w-full items-center rounded-xl border-2 border-primary/25 px-4 text-left font-semibold transition-all hover:border-primary hover:bg-secondary active:scale-[0.98]"
              >
                {o.label}
              </button>
            );
          return (
            <div key={o.id} className={cn("relative overflow-hidden rounded-xl bg-secondary", mine?.option_id === o.id && "ring-2 ring-primary")}>
              <motion.div
                className="absolute inset-y-0 left-0 bg-primary/20"
                initial={{ width: reduce ? `${pct}%` : 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
              <div className="relative flex min-h-14 items-center justify-between gap-3 px-4 font-semibold">
                <span className="inline-flex items-center gap-2">
                  {mine?.option_id === o.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                  {o.label}
                </span>
                <span className="text-primary">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
      {mine && <p className="mt-3 text-sm font-semibold text-status-done">{t("voted")}</p>}
    </div>
  );
}
