import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  merchant: any | null;
  refreshMerchant: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  merchant: null,
  refreshMerchant: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [merchant, setMerchant] = useState<any | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchMerchant(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchMerchant(session.user.id);
      else setMerchant(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchMerchant = async (userId: string) => {
    const { data } = await supabase.from('merchants').select('*').eq('id', userId).single();
    if (data) setMerchant(data);
  };

  const refreshMerchant = async () => {
    if (session) await fetchMerchant(session.user.id);
  };

  return (
    <AuthContext.Provider value={{ session, loading, merchant, refreshMerchant }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
