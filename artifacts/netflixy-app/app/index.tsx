import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

// Lazy-load WebView only on native to avoid web crashes
let WebView: any = null;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

// ─── Setup Screen ─────────────────────────────────────────────────────────────
function SetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setApiUrl, loading } = useApp();
  const [url, setUrl] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [err, setErr] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true, easing: Easing.linear }),
    ]).start();
  };

  const handleConnect = async () => {
    const trimmed = url.trim().replace(/\/+$/, '');
    if (!trimmed) {
      setErr('Paste your API URL first');
      shake();
      return;
    }
    if (!trimmed.startsWith('http')) {
      setErr('URL must start with http:// or https://');
      shake();
      return;
    }
    setConnecting(true);
    setErr('');
    try {
      const res = await fetch(`${trimmed}/api/access`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      await res.json();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await setApiUrl(trimmed);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not reach server';
      setErr(msg);
      shake();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setConnecting(false);
    }
  };

  const s = styles(colors);

  return (
    <View style={[s.setupContainer, { paddingTop: Math.max(insets.top + 40, Platform.OS === 'web' ? 107 : 40) }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Logo */}
      <View style={s.logoWrap}>
        <View style={s.logoCircle}>
          <Text style={s.logoLetter}>N</Text>
        </View>
        <Text style={s.logoName}>NETFLIXY</Text>
      </View>

      <Text style={s.tagline}>Your sessions. Your stream.</Text>

      {/* Card */}
      <Animated.View style={[s.card, { transform: [{ translateX: shakeAnim }] }]}>
        <Text style={s.label}>API SERVER URL</Text>
        <TextInput
          style={s.input}
          value={url}
          onChangeText={(t) => { setUrl(t); setErr(''); }}
          placeholder="https://your-api.replit.app"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          onSubmitEditing={handleConnect}
        />
        {err ? <Text style={s.errorText}>{err}</Text> : null}
        <TouchableOpacity
          style={[s.btn, (connecting || loading) && s.btnDisabled]}
          onPress={handleConnect}
          disabled={connecting || loading}
          activeOpacity={0.8}
        >
          {connecting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={s.btnText}>CONNECT</Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      <Text style={s.hint}>
        Paste the URL of your deployed Netflixy API server
      </Text>
    </View>
  );
}

// ─── Player Screen ─────────────────────────────────────────────────────────────
function PlayerScreen({ cookieValue }: { cookieValue: string }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setApiUrl, fetchSession } = useApp();
  const [showSettings, setShowSettings] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);

  const cookieHeader = `NetflixId=${cookieValue}`;

  if (Platform.OS === 'web') {
    return (
      <View style={[styles(colors).webFallback, { paddingTop: Math.max(insets.top, 67) }]}>
        <Feather name="smartphone" size={48} color={colors.primary} />
        <Text style={styles(colors).webFallbackTitle}>Open on your phone</Text>
        <Text style={styles(colors).webFallbackText}>
          Scan the QR code in the URL bar with Expo Go to stream on your device.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar hidden />

      {/* Full-screen WebView with cookie as initial request header */}
      <WebView
        key={webViewKey}
        source={{
          uri: 'https://www.netflix.com/browse',
          headers: { Cookie: cookieHeader },
        }}
        style={{ flex: 1 }}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles(colors).loaderOverlay}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        )}
      />

      {/* Floating settings button */}
      {!showSettings ? (
        <TouchableOpacity
          style={[styles(colors).fab, { bottom: insets.bottom + 20, right: 16 }]}
          onPress={() => setShowSettings(true)}
          activeOpacity={0.8}
        >
          <Feather name="settings" size={18} color="#fff" />
        </TouchableOpacity>
      ) : (
        <View style={[styles(colors).settingsPanel, { bottom: insets.bottom + 16, right: 16, left: 16 }]}>
          <TouchableOpacity
            style={styles(colors).settingsBtn}
            onPress={async () => {
              setShowSettings(false);
              await fetchSession();
              setWebViewKey((k) => k + 1);
            }}
          >
            <Feather name="refresh-cw" size={14} color="#fff" />
            <Text style={styles(colors).settingsBtnText}>New Session</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles(colors).settingsBtn, styles(colors).settingsBtnDanger]}
            onPress={() => {
              setShowSettings(false);
              setApiUrl(null);
            }}
          >
            <Feather name="link" size={14} color="#fff" />
            <Text style={styles(colors).settingsBtnText}>Change API URL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles(colors).settingsDismiss}
            onPress={() => setShowSettings(false)}
          >
            <Text style={styles(colors).settingsDismissText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── No Sessions Screen ────────────────────────────────────────────────────────
function NoSessionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { fetchSession, loading, setApiUrl } = useApp();

  return (
    <View style={[styles(colors).centerScreen, { paddingTop: Platform.OS === 'web' ? 107 : insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <Feather name="tv" size={48} color={colors.mutedForeground} />
      <Text style={styles(colors).noSessionTitle}>No Active Sessions</Text>
      <Text style={styles(colors).noSessionText}>
        Go to the admin panel and activate at least one cookie session.
      </Text>
      <TouchableOpacity style={styles(colors).retryBtn} onPress={fetchSession} disabled={loading} activeOpacity={0.8}>
        {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles(colors).retryBtnText}>Retry</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setApiUrl(null)} style={{ marginTop: 12 }}>
        <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Change API URL</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function Index() {
  const colors = useColors();
  const { apiUrl, session, loading, error, initialized, fetchSession, setApiUrl } = useApp();

  if (!initialized) {
    return (
      <View style={[styles(colors).centerScreen]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!apiUrl) return <SetupScreen />;

  if (loading && !session) {
    return (
      <View style={styles(colors).centerScreen}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles(colors).noSessionText, { marginTop: 16 }]}>Connecting...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles(colors).centerScreen}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <Feather name="wifi-off" size={48} color={colors.mutedForeground} />
        <Text style={styles(colors).noSessionTitle}>Connection Failed</Text>
        <Text style={styles(colors).noSessionText}>{error}</Text>
        <TouchableOpacity style={styles(colors).retryBtn} onPress={fetchSession} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles(colors).retryBtnText}>Retry</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setApiUrl(null)} style={{ marginTop: 12 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Change URL</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!session || !session.found || !session.cookieValue) {
    return <NoSessionsScreen />;
  }

  return <PlayerScreen cookieValue={session.cookieValue} />;
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    setupContainer: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 24,
      alignItems: 'center',
    },
    logoWrap: {
      alignItems: 'center',
      marginBottom: 8,
    },
    logoCircle: {
      width: 72,
      height: 72,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    logoLetter: {
      color: '#fff',
      fontSize: 42,
      fontFamily: 'Inter_700Bold',
      lineHeight: 48,
    },
    logoName: {
      color: colors.foreground,
      fontSize: 18,
      fontFamily: 'Inter_700Bold',
      letterSpacing: 6,
    },
    tagline: {
      color: colors.mutedForeground,
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      marginTop: 8,
      marginBottom: 40,
    },
    card: {
      width: '100%',
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    label: {
      color: colors.mutedForeground,
      fontSize: 11,
      fontFamily: 'Inter_600SemiBold',
      letterSpacing: 2,
      marginBottom: 10,
    },
    input: {
      backgroundColor: colors.muted,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.foreground,
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      marginBottom: 8,
    },
    errorText: {
      color: colors.primary,
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      marginBottom: 12,
    },
    btn: {
      backgroundColor: colors.primary,
      borderRadius: 6,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 4,
    },
    btnDisabled: {
      opacity: 0.5,
    },
    btnText: {
      color: '#fff',
      fontSize: 14,
      fontFamily: 'Inter_700Bold',
      letterSpacing: 2,
    },
    hint: {
      color: colors.mutedForeground,
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      marginTop: 20,
      textAlign: 'center',
    },
    centerScreen: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    noSessionTitle: {
      color: colors.foreground,
      fontSize: 20,
      fontFamily: 'Inter_700Bold',
      marginTop: 16,
      marginBottom: 8,
    },
    noSessionText: {
      color: colors.mutedForeground,
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      textAlign: 'center',
      lineHeight: 22,
    },
    retryBtn: {
      marginTop: 24,
      backgroundColor: colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 6,
    },
    retryBtnText: {
      color: '#fff',
      fontFamily: 'Inter_700Bold',
      fontSize: 14,
      letterSpacing: 1,
    },
    loaderOverlay: {
      position: 'absolute',
      inset: 0,
      backgroundColor: '#000',
      alignItems: 'center',
      justifyContent: 'center',
    },
    fab: {
      position: 'absolute',
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.7)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    settingsPanel: {
      position: 'absolute',
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#333',
      padding: 8,
      gap: 4,
    },
    settingsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: '#2a2a2a',
    },
    settingsBtnDanger: {
      backgroundColor: '#2a2a2a',
    },
    settingsBtnText: {
      color: '#fff',
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
    },
    settingsDismiss: {
      alignItems: 'center',
      paddingVertical: 10,
    },
    settingsDismissText: {
      color: '#8c8c8c',
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
    },
    webFallback: {
      flex: 1,
      backgroundColor: '#000',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      paddingBottom: 34,
    },
    webFallbackTitle: {
      color: '#fff',
      fontSize: 22,
      fontFamily: 'Inter_700Bold',
      marginTop: 20,
      marginBottom: 10,
    },
    webFallbackText: {
      color: '#8c8c8c',
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      textAlign: 'center',
      lineHeight: 24,
    },
  });
