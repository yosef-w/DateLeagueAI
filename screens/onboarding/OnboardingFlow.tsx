import React, { useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';

import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
import Step4 from './Step4';
import { styles } from './styles';

const steps = [Step1, Step2, Step3, Step4];

export default function OnboardingFlow() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  const goNext = useCallback(async () => {
    if (isLast) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push('/upload');
      return;
    }
    await Haptics.selectionAsync();
    setIndex((i) => i + 1);
  }, [isLast, router]);

  const goPrev = useCallback(async () => {
    if (isFirst) return;
    await Haptics.selectionAsync();
    setIndex((i) => i - 1);
  }, [isFirst]);

  const goToUpload = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/upload');
  }, [router]);

  const Step = steps[index];

  return (
    <LinearGradient colors={['#0f172a', '#111827']} style={styles.screen}>
      <SafeAreaView style={{ flex: 1 }}>
        {!isFirst && (
          <Pressable
            onPress={goPrev}
            onPressIn={() => Haptics.selectionAsync()}
            style={({ pressed }) => [
              styles.backBtn,
              { top: insets.top + 8 },
              pressed && styles.backPressed,
            ]}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={24} color="#e5e7eb" />
          </Pressable>
        )}
        <Pressable
          onPress={goToUpload}
          onPressIn={() => Haptics.selectionAsync()}
          style={({ pressed }) => [
            styles.skipBtn,
            { top: insets.top + 8 },
            pressed && styles.skipPressed,
          ]}
          hitSlop={8}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>

        <View style={styles.page}>
          <View style={styles.card}>
            <Step />
          </View>
        </View>

        <View style={styles.dotsRow}>
          {steps.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          onPress={goNext}
          onPressIn={() => Haptics.selectionAsync()}
        >
          <Text style={styles.ctaText}>{isLast ? 'Get Started' : 'Continue'}</Text>
        </Pressable>
      </SafeAreaView>
    </LinearGradient>
  );
}
