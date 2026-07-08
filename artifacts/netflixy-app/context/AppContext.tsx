import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Session {
  found: boolean;
  cookieValue: string | null;
  label: string | null;
  activeCount: number;
}

interface AppContextType {
  apiUrl: string | null;
  setApiUrl: (url: string | null) => Promise<void>;
  session: Session | null;
  loading: boolean;
  error: string | null;
  fetchSession: () => Promise<void>;
  initialized: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [apiUrl, setApiUrlState] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('netflixy_api_url').then((url) => {
      if (url) setApiUrlState(url);
      setInitialized(true);
    });
  }, []);

  useEffect(() => {
    if (initialized && apiUrl) fetchSession();
  }, [initialized, apiUrl]);

  const setApiUrl = async (url: string | null) => {
    const clean = url ? url.trim().replace(/\/+$/, '') : null;
    if (clean) await AsyncStorage.setItem('netflixy_api_url', clean);
    else await AsyncStorage.removeItem('netflixy_api_url');
    setApiUrlState(clean);
    setSession(null);
    setError(null);
  };

  const fetchSession = async () => {
    if (!apiUrl) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/access`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: Session = await res.json();
      setSession(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContext.Provider value={{ apiUrl, setApiUrl, session, loading, error, fetchSession, initialized }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
