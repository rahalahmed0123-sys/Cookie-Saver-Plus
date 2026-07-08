import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View, Easing } from 'react-native';

interface Props {
  children: React.ReactNode;
}

export function SplashAnimation({ children }: Props) {
  const [done, setDone] = useState(false);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Fade in + slide up the text
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Expand the line under the text
      Animated.timing(lineWidth, {
        toValue: 1,
        duration: 500,
        delay: 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true, // scaleX is a transform, native driver OK
      }).start(() => {
        // 3. Hold, then fade the whole splash out
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 600,
          delay: 900,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }).start(() => setDone(true));
      });
    });
  }, []);

  if (done) return <>{children}</>;

  return (
    <View style={styles.root}>
      {/* Splash overlay */}
      <Animated.View style={[styles.splash, { opacity: containerOpacity }]}>
        <Animated.View
          style={{ opacity, transform: [{ translateY }], alignItems: 'center' }}
        >
          <Text style={styles.madeBy}>MADE BY</Text>
          <Text style={styles.name}>Ahmed Rahal</Text>
          <Animated.View
            style={[
              styles.line,
              {
                transform: [{ scaleX: lineWidth }],
              },
            ]}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  splash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  madeBy: {
    color: '#555',
    fontSize: 11,
    letterSpacing: 4,
    fontFamily: 'Inter_400Regular',
    marginBottom: 10,
  },
  name: {
    color: '#fff',
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
    marginBottom: 14,
  },
  line: {
    height: 2,
    backgroundColor: '#E50914',
    borderRadius: 2,
  },
});
