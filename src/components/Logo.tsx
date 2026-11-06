import { cn } from "@/lib/utils";

/** Mahalla Online logotipi: M harfi va joylashuv belgisi. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="Mahalla Online"
      className={cn("h-10 w-10", className)}
    >
      <rect width="64" height="64" rx="14" className="fill-primary" />
      <polyline
        points="18,48 18,28 32,42 46,28 46,48"
        fill="none"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-primary-foreground"
      />
      <polygon points="27.7,21.4 36.3,21.4 32,27.8" className="fill-urgent" />
      <circle cx="32" cy="18.5" r="5.2" className="fill-urgent" />
      <circle cx="32" cy="18.5" r="2" className="fill-primary-foreground" />
    </svg>
  );
}
