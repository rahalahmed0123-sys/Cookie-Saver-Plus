import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';

// Only load WebView on native
let WebView: any = null;
if (Platform.OS !== 'web') {
  try { WebView = require('react-native-webview').WebView; } catch {}
}

// ─── Colours ──────────────────────────────────────────────────────────────────
const C = {
  bg: '#000',
  card: '#111',
  border: '#222',
  primary: '#E50914',
  fg: '#fff',
  muted: '#888',
};

// ─── Setup ────────────────────────────────────────────────────────────────────
function Setup() {
  const { setApiUrl } = useApp();
  const insets = useSafeAreaInsets();
  const [url, setUrl] = require('react').useState('');
  const [busy, setBusy] = require('react').useState(false);
  const [err, setErr] = require('react').useState('');

  const connect = async () => {
    const clean = url.trim().replace(/\/+$/, '');
    if (!clean.startsWith('http')) { setErr('Enter a valid URL starting with http'); return; }
    setBusy(true); setErr('');
    try {
      const r = await fetch(`${clean}/api/access`);
      if (!r.ok) throw new Error(`Server error ${r.status}`);
      await r.json();
      await setApiUrl(clean);
    } catch (e: any) {
      setErr(e.message || 'Could not reach server');
    } finally { setBusy(false); }
  };

  return (
    <View style={[s.screen, { paddingTop: insets.top + 40 }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={s.logoBox}>
        <View style={s.logoCircle}><Text style={s.logoN}>N</Text></View>
        <Text style={s.logoText}>NETFLIXY</Text>
      </View>
      <Text style={s.tagline}>Your sessions. Your stream.</Text>

      <View style={s.card}>
        <Text style={s.label}>API SERVER URL</Text>
        <TextInput
          style={s.input}
          value={url}
          onChangeText={t => { setUrl(t); setErr(''); }}
          placeholder="https://your-api.replit.app"
          placeholderTextColor={C.muted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          onSubmitEditing={connect}
        />
        {!!err && <Text style={s.err}>{err}</Text>}
        <TouchableOpacity style={[s.btn, busy && { opacity: 0.5 }]} onPress={connect} disabled={busy} activeOpacity={0.8}>
          {busy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnText}>CONNECT</Text>}
        </TouchableOpacity>
      </View>
      <Text style={s.hint}>Paste the URL of your deployed Netflixy API server</Text>
    </View>
  );
}

// ─── Player ───────────────────────────────────────────────────────────────────
function Player({ cookie }: { cookie: string }) {
  const { setApiUrl, fetchSession } = useApp();
  const insets = useSafeAreaInsets();
  const [menu, setMenu] = require('react').useState(false);
  const [key, setKey] = require('react').useState(0);

  if (Platform.OS === 'web') {
    return (
      <View style={[s.screen, s.center]}>
        <Text style={s.title}>Session Ready ✓</Text>
        <Text style={[s.tagline, { marginBottom: 24 }]}>Cookie loaded. Click below to open Netflix.</Text>
        <TouchableOpacity style={s.btn} onPress={() => (window as any).open('https://www.netflix.com', '_blank')} activeOpacity={0.8}>
          <Text style={s.btnText}>OPEN NETFLIX</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setApiUrl(null)} style={{ marginTop: 16 }}>
          <Text style={{ color: C.muted, fontSize: 13 }}>Change API URL</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar hidden />
      <WebView
        key={key}
        source={{ uri: 'https://www.netflix.com/browse', headers: { Cookie: `NetflixId=${cookie}` } }}
        style={{ flex: 1 }}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={[s.screen, s.center, StyleSheet.absoluteFillObject]}>
            <ActivityIndicator color={C.primary} size="large" />
          </View>
        )}
      />
      {!menu ? (
        <TouchableOpacity style={[s.fab, { bottom: insets.bottom + 20 }]} onPress={() => setMenu(true)}>
          <Text style={{ color: '#fff', fontSize: 18 }}>⚙</Text>
        </TouchableOpacity>
      ) : (
        <View style={[s.menuPanel, { bottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={s.menuBtn} onPress={async () => { setMenu(false); await fetchSession(); setKey(k => k + 1); }}>
            <Text style={s.menuBtnText}>↻  New Session</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.menuBtn} onPress={() => { setMenu(false); setApiUrl(null); }}>
            <Text style={s.menuBtnText}>⇄  Change API URL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.menuDismiss} onPress={() => setMenu(false)}>
            <Text style={{ color: C.muted }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function Index() {
  const { apiUrl, session, loading, error, initialized, fetchSession, setApiUrl } = useApp();
  const insets = useSafeAreaInsets();

  if (!initialized) return <View style={[s.screen, s.center]}><ActivityIndicator color={C.primary} size="large" /></View>;
  if (!apiUrl) return <Setup />;

  if (loading && !session) return (
    <View style={[s.screen, s.center]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <ActivityIndicator color={C.primary} size="large" />
      <Text style={[s.muted, { marginTop: 12 }]}>Connecting…</Text>
    </View>
  );

  if (error) return (
    <View style={[s.screen, s.center]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <Text style={s.title}>Connection Failed</Text>
      <Text style={[s.muted, { textAlign: 'center', marginBottom: 24 }]}>{error}</Text>
      <TouchableOpacity style={s.btn} onPress={fetchSession}><Text style={s.btnText}>Retry</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => setApiUrl(null)} style={{ marginTop: 12 }}><Text style={{ color: C.muted, fontSize: 13 }}>Change URL</Text></TouchableOpacity>
    </View>
  );

  if (!session?.found || !session?.cookieValue) return (
    <View style={[s.screen, s.center]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <Text style={s.title}>No Active Sessions</Text>
      <Text style={[s.muted, { textAlign: 'center', marginBottom: 24 }]}>Activate a session in the admin panel first.</Text>
      <TouchableOpacity style={s.btn} onPress={fetchSession} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnText}>Retry</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setApiUrl(null)} style={{ marginTop: 12 }}><Text style={{ color: C.muted, fontSize: 13 }}>Change URL</Text></TouchableOpacity>
    </View>
  );

  return <Player cookie={session.cookieValue} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 24 },
  center: { alignItems: 'center', justifyContent: 'center' },
  logoBox: { alignItems: 'center', marginBottom: 8 },
  logoCircle: { width: 72, height: 72, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoN: { color: '#fff', fontSize: 44, fontFamily: 'Inter_700Bold', lineHeight: 52 },
  logoText: { color: C.fg, fontSize: 18, fontFamily: 'Inter_700Bold', letterSpacing: 6 },
  tagline: { color: C.muted, fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 8, marginBottom: 36, textAlign: 'center' },
  card: { width: '100%', backgroundColor: C.card, borderRadius: 10, padding: 20, borderWidth: 1, borderColor: C.border },
  label: { color: C.muted, fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 2, marginBottom: 10 },
  input: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, color: C.fg, fontFamily: 'Inter_400Regular', fontSize: 14, marginBottom: 8 },
  err: { color: C.primary, fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 10 },
  btn: { backgroundColor: C.primary, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold', letterSpacing: 2 },
  hint: { color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 20, fontFamily: 'Inter_400Regular' },
  title: { color: C.fg, fontSize: 22, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  muted: { color: C.muted, fontSize: 14, fontFamily: 'Inter_400Regular' },
  fab: { position: 'absolute', right: 16, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.75)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  menuPanel: { position: 'absolute', left: 16, right: 16, backgroundColor: '#1a1a1a', borderRadius: 12, borderWidth: 1, borderColor: '#333', padding: 8, gap: 4 },
  menuBtn: { paddingVertical: 13, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#2a2a2a' },
  menuBtnText: { color: C.fg, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  menuDismiss: { alignItems: 'center', paddingVertical: 10 },
});
