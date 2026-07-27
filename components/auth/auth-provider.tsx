"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";

type AuthState = {
  user: User | null;
  /** True until the first auth event resolves. */
  loading: boolean;
};

const AuthContext = React.createContext<AuthState>({
  user: null,
  loading: true,
});

export function useAuth(): AuthState {
  return React.useContext(AuthContext);
}

/**
 * Subscribes to Supabase auth changes, exposes the current user, and keeps the
 * zustand store in sync: hydrate progress from the DB on sign-in, clear it on
 * sign-out. Mirrors the `theme-provider.tsx` wrapper pattern.
 */
export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: User | null;
}) {
  const [user, setUser] = React.useState<User | null>(initialUser);
  const [loading, setLoading] = React.useState(initialUser === null);
  // Avoid re-hydrating the store on every token refresh — only when the
  // signed-in user actually changes.
  const hydratedFor = React.useRef<string | null>(null);

  React.useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const hydrate = useStore.getState().hydrateFromServer;
    const reset = useStore.getState().reset;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setLoading(false);

      if (nextUser) {
        if (hydratedFor.current !== nextUser.id) {
          hydratedFor.current = nextUser.id;
          void hydrate();
        }
      } else {
        hydratedFor.current = null;
        reset();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
