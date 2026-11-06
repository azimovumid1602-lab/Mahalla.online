import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PollData } from "@/components/PollCard";

export function usePolls() {
  return useQuery({
    queryKey: ["polls"],
    queryFn: async (): Promise<PollData[]> => {
      const [{ data: polls }, { data: options }, { data: votes }] = await Promise.all([
        supabase.from("polls").select("*").order("created_at", { ascending: false }),
        supabase.from("poll_options").select("*").order("position"),
        supabase.from("poll_votes").select("poll_id, option_id, user_id"),
      ]);
      return (polls ?? []).map((p) => ({
        ...p,
        options: (options ?? []).filter((o) => o.poll_id === p.id),
        votes: (votes ?? []).filter((v) => v.poll_id === p.id),
      }));
    },
  });
}
