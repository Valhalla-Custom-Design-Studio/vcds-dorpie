import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('window');

interface AnimatedSplashProps {
  onFinish: () => void;
}

export default function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (!imageLoaded) return;

    // Hide native splash only after our image is ready — prevents black frame
    SplashScreen.hideAsync().catch(() => {});

    // Fade + scale in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Hold then fade out
      setTimeout(() => {
        Animated.timing(fadeOut, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => onFinish());
      }, 4200);
    });
  }, [imageLoaded]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut, backgroundColor: '#021A1A' }]}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          width: width,
          height: height,
        }}
      >
        <Image
          source={require('../../assets/splash-animated.webp')}
          style={styles.splash}
          resizeMode="cover"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            // Fallback: if webp fails, still proceed
            setImageLoaded(true);
          }}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splash: {
    width: width,
    height: height,
  },
});
