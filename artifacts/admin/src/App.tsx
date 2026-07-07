import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { setExtraHeaders } from '@workspace/api-client-react';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [authed, setAuthed] = useState<boolean>(() => {
    const stored = localStorage.getItem('netflixy_admin_key');
    if (stored) {
      setExtraHeaders({ 'x-admin-key': stored });
      return true;
    }
    return false;
  });

  useEffect(() => {
    if (!authed) {
      setExtraHeaders({});
    }
  }, [authed]);

  function handleLogin(key: string) {
    setExtraHeaders({ 'x-admin-key': key });
    queryClient.clear();
    setAuthed(true);
  }

  if (!authed) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
