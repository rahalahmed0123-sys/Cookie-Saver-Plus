import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View, Easing } from 'react-native';

export function SplashAnimation({ children }: { children: React.ReactNode }) {
  const [done, setDone] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade + slide text in
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start(() => {
      // Hold then fade out entire splash
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 700,
        delay: 1000,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setDone(true));
    });
  }, []);

  if (done) return <>{children}</>;

  return (
    <View style={s.root}>
      <Animated.View style={[s.splash, { opacity: containerOpacity }]}>
        <Animated.View style={{ opacity, transform: [{ translateY }], alignItems: 'center' }}>
          <Text style={s.madeBy}>MADE BY</Text>
          <Text style={s.name}>Ahmed Rahal</Text>
          <View style={s.line} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  splash: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  madeBy: { color: '#555', fontSize: 11, letterSpacing: 4, marginBottom: 10 },
  name: { color: '#fff', fontSize: 30, fontFamily: 'Inter_700Bold', letterSpacing: 1, marginBottom: 12 },
  line: { width: 120, height: 2, backgroundColor: '#E50914', borderRadius: 2 },
});
