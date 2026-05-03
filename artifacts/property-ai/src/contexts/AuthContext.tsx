import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const DEMO_KEY = "propertyai_demo_mode";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isDemoMode: boolean;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  isDemoMode: false,
  enterDemoMode: () => {},
  exitDemoMode: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(
    () => sessionStorage.getItem(DEMO_KEY) === "true"
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      // Real sign-in always clears demo mode
      if (session) {
        setIsDemoMode(false);
        sessionStorage.removeItem(DEMO_KEY);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      if (session) {
        setIsDemoMode(false);
        sessionStorage.removeItem(DEMO_KEY);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  function enterDemoMode() {
    sessionStorage.setItem(DEMO_KEY, "true");
    setIsDemoMode(true);
  }

  function exitDemoMode() {
    sessionStorage.removeItem(DEMO_KEY);
    setIsDemoMode(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signOut,
        isDemoMode,
        enterDemoMode,
        exitDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
