import { useState } from 'react';

interface LoginProps {
  onLogin: (key: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/sessions', {
        headers: { 'x-admin-key': key.trim() },
      });
      if (res.status === 401 || res.status === 503) {
        setError('Invalid admin key. Try again.');
        setLoading(false);
        return;
      }
      // Key works — store and proceed
      localStorage.setItem('netflixy_admin_key', key.trim());
      onLogin(key.trim());
    } catch {
      setError('Cannot reach the API server.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase">NETFLIXY_ADMIN</span>
          </div>
          <h1 className="font-mono text-lg font-bold tracking-tight">Access Required</h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">Enter your admin key to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">
              Admin Key
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="••••••••••••••••"
              autoFocus
              className="w-full bg-card border border-border rounded px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs font-mono text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !key.trim()}
            className="w-full bg-primary text-primary-foreground font-mono text-sm font-bold py-2.5 rounded tracking-widest uppercase transition-opacity disabled:opacity-40 hover:opacity-90"
          >
            {loading ? 'Verifying...' : 'Authenticate'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs font-mono text-muted-foreground/50">
          Set <code className="text-muted-foreground">ADMIN_KEY</code> env var on the server
        </p>
      </div>
    </div>
  );
}
