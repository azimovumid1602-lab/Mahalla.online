import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { STATUSES, STATUS_META, type Status } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: Status }) {
  const { lang } = useI18n();
  const m = STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold", m.cls)}>
      <span className={cn("h-2.5 w-2.5 rounded-full", m.dot)} />
      {m[lang]}
    </span>
  );
}

export function StatusTimeline({ status }: { status: Status }) {
  const { lang } = useI18n();
  const reduce = useReducedMotion();
  const idx = STATUSES.indexOf(status);
  return (
    <ol className="space-y-0">
      {STATUSES.map((s, i) => {
        const done = i <= idx;
        const m = STATUS_META[s];
        return (
          <li key={s} className="relative flex gap-4 pb-6 last:pb-0">
            {i < STATUSES.length - 1 && (
              <span className="absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-1 rounded bg-border">
                <motion.span
                  className="block w-full rounded bg-primary"
                  initial={{ height: reduce ? (i < idx ? "100%" : 0) : 0 }}
                  animate={{ height: i < idx ? "100%" : 0 }}
                  transition={{ duration: 0.4, delay: i * 0.35 }}
                />
              </span>
            )}
            <motion.span
              initial={reduce ? false : { scale: 0.6, opacity: 0.4 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.35 }}
              className={cn(
                "relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-2",
                done ? cn(m.dot, "border-transparent text-primary-foreground") : "border-border bg-card text-muted-foreground",
              )}
            >
              {done ? <Check className="h-5 w-5" /> : i + 1}
            </motion.span>
            <div className="pt-2">
              <p className={cn("font-semibold", !done && "text-muted-foreground")}>{m[lang]}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="ornament rounded-2xl border-2 border-dashed bg-card/60 px-6 py-12 text-center">
      <p className="text-4xl">🫖</p>
      <p className="mt-3 text-lg text-muted-foreground">{text}</p>
    </div>
  );
}
