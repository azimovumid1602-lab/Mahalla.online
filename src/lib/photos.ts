import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePhotoUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["photo", path],
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      if (!path) return null;
      if (path.startsWith("http")) return path;
      const { data } = await supabase.storage.from("problem-photos").createSignedUrl(path, 3600);
      return data?.signedUrl ?? null;
    },
  }).data;
}
