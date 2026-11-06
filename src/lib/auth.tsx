import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Profile = { id: string; full_name: string; phone: string | null; street: string | null };
type AuthState = {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthState>({
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load(u: User | null) {
    setUser(u);
    if (!u) {
      setProfile(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    const [{ data: p }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, phone, street").eq("id", u.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", u.id),
    ]);
    setProfile(p);
    setIsAdmin(!!roles?.some((r) => r.role === "admin"));
    setLoading(false);
  }

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED" || event === "INITIAL_SESSION") {
        setTimeout(() => load(session?.user ?? null), 0);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider
      value={{
        user,
        profile,
        isAdmin,
        loading,
        refresh: async () => {
          const { data } = await supabase.auth.getUser();
          await load(data.user);
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

export function displayName(profile: Profile | null, user: User | null) {
  return profile?.full_name || user?.email?.split("@")[0] || "Fuqaro";
}
