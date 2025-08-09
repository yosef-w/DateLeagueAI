import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

const QUESTIONS = [
  {
    question: 'Are you a male or female?',
    options: ['Male', 'Female'],
  },
  {
    question: 'What dating app do you use?',
    options: [
      'Tinder',
      'Bumble',
      'Hinge',
      'OkCupid',
      'Coffee Meets Bagel',
      'Grindr',
      'Her',
      'Match',
      'Plenty of Fish',
      'eHarmony',
      'Facebook Dating',
      'Happn',
      'BLK',
      'Chispa',
      'Taimi',
    ],
  },
  {
    question: 'How often do you get a like?',
    options: [
      'Every day',
      'Few times a week',
      'Once a week',
      'A few times a month',
      'Rarely',
    ],
  },
  {
    question: 'What are you looking for?',
    options: ['Not exactly sure', 'Dating', 'Have fun', 'Meet friends'],
  },
];

const { width: SCREEN_W } = Dimensions.get('window');

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const slide = useRef(new Animated.Value(0)).current;
  const direction = useRef(1);

  useEffect(() => {
    slide.setValue(direction.current * SCREEN_W);
    Animated.timing(slide, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [index, slide]);

  const onSelect = useCallback(
    async (option: string) => {
      if (index === QUESTIONS.length - 1) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/upload');
        return;
      }
      await Haptics.selectionAsync();
      direction.current = 1;
      setIndex(i => i + 1);
    },
    [index, router]
  );

  const goBack = useCallback(async () => {
    if (index === 0) {
      await Haptics.selectionAsync();
      router.back();
      return;
    }
    await Haptics.selectionAsync();
    direction.current = -1;
    setIndex(i => i - 1);
  }, [index, router]);

  const progress = index / QUESTIONS.length;
  const { question, options } = QUESTIONS[index];

  return (
    <LinearGradient colors={['#0f172a', '#111827']} style={styles.screen}>
      <SafeAreaView style={{ flex: 1 }}>
        <Pressable
          onPress={goBack}
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

        <View style={styles.progressWrap}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>

        <View style={styles.page}>
          <Animated.View style={[styles.card, { transform: [{ translateX: slide }] }]}>
            <Text style={styles.question}>{question}</Text>
            <View style={styles.options}>
              {options.map(opt => (
                <Pressable
                  key={opt}
                  onPress={() => onSelect(opt)}
                  onPressIn={() => Haptics.selectionAsync()}
                  style={({ pressed }) => [
                    styles.optionBtn,
                    pressed && styles.optionPressed,
                  ]}
                >
                  <Text style={styles.optionText}>{opt}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  progressWrap: {
    height: 4,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#60a5fa',
  },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    alignItems: 'center',
  },
  question: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  options: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  optionBtn: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  optionPressed: { transform: [{ scale: 0.98 }] },
  optionText: { color: '#e5e7eb', fontSize: 16, fontWeight: '600' },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    padding: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  backPressed: { transform: [{ scale: 0.98 }] },
});

