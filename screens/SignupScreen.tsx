import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Dimensions, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import PrimaryButton from '../components/PrimaryButton';

type Question = {
  question: string;
  subtitle: string;
  options: string[];
  multi?: boolean;
};

const QUESTIONS: Question[] = [
  {
    question: 'What is your gender?',
    subtitle: 'We tune feedback to typical photo and prompt patterns by gender. You can opt out.',
    options: ['Male', 'Female', 'Prefer not to say'],
  },
  {
    question: 'What is your age range?',
    subtitle: 'Age groups respond to different photo styles and prompt tones—we’ll tailor suggestions.',
    options: ['18-24', '25-34', '35-44', '45-54', '55+'],
  },
  {
    question: 'What dating app do you use?',
    subtitle: 'Each app has its own rhythm and norms. Tell us where you swipe so tips match the real feed.',
    options: [
      'Tinder','Bumble','Hinge','OkCupid','Coffee Meets Bagel','Grindr','Her','Match',
      'Plenty of Fish','eHarmony','Facebook Dating','Happn','BLK','Chispa','Taimi',
    ],
    multi: true, // ONLY this one is multi-select
  },
  {
    question: 'How often do you get a like?',
    subtitle: 'This helps us gauge baseline visibility and how aggressive to be with changes.',
    options: ['Every day','Few times a week','Once a week','A few times a month','Rarely'],
  },
  {
    question: 'What are you looking for?',
    subtitle: 'We’ll recommend prompts and photo vibes that match your intention.',
    options: ['Not exactly sure','Dating','Have fun','Meet friends'],
  },
];

const { width: SCREEN_W } = Dimensions.get('window');

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(Array(QUESTIONS.length).fill(null));
  const [multiSet, setMultiSet] = useState<Set<string>>(new Set());
  const [bottomBarH, setBottomBarH] = useState(0); // <- measure button/area height

  const slide = useRef(new Animated.Value(0)).current;
  const direction = useRef(1);
  const scrollRef = useRef<ScrollView>(null);

  const q = QUESTIONS[index];
  const isMulti = !!q.multi;
  const showContinue = isMulti && multiSet.size > 0;

  useEffect(() => {
    slide.setValue(direction.current * SCREEN_W);
    Animated.timing(slide, { toValue: 0, duration: 260, useNativeDriver: true }).start();

    scrollRef.current?.scrollTo({ y: 0, animated: false });

    if (q.multi) {
      const prev = answers[index];
      const initial = new Set<string>();
      if (prev) prev.split(',').forEach(v => initial.add(v));
      setMultiSet(initial);
    } else {
      setMultiSet(new Set());
    }
    // reset measured height when we leave/enter multi
    setBottomBarH(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const advance = useCallback(async () => {
    if (index === QUESTIONS.length - 1) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push('/likes');
      return;
    }
    await Haptics.selectionAsync();
    direction.current = 1;
    setIndex(i => i + 1);
  }, [index, router]);

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

  const onSelectSingle = useCallback(async (opt: string) => {
    setAnswers(a => {
      const copy = [...a];
      copy[index] = opt;
      return copy;
    });
    await advance();
  }, [index, advance]);

  const onToggleMulti = useCallback(async (opt: string) => {
    setMultiSet(prev => {
      const next = new Set(prev);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      return next;
    });
  }, []);

  const onConfirmMulti = useCallback(async () => {
    if (multiSet.size === 0) return;
    const val = Array.from(multiSet).join(',');
    setAnswers(a => {
      const copy = [...a];
      copy[index] = val;
      return copy;
    });
    await advance();
  }, [multiSet, index, advance]);

  const CARD_MAX_W = Math.min(560, SCREEN_W - 24);

  // Dynamic bottom padding so last options scroll above the button
  const extraPad = showContinue ? bottomBarH + 12 : 24;

  return (
    <LinearGradient colors={['#0f172a', '#111827']} style={s.screen}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Back */}
        <Pressable
          onPress={goBack}
          onPressIn={() => Haptics.selectionAsync()}
          style={({ pressed }) => [s.backBtn, { top: insets.top + 8 }, pressed && s.backPressed]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color="#e5e7eb" />
        </Pressable>

        <View style={[s.page, { paddingTop: insets.top + 56, paddingBottom: Math.max(16, insets.bottom) }]}>
          <Animated.View style={[s.card, { maxWidth: CARD_MAX_W, transform: [{ translateX: slide }] }]}>
            <Text style={s.question}>{q.question}</Text>
            {!!q.subtitle && <Text style={s.subtitle}>{q.subtitle}</Text>}

            <ScrollView
              ref={scrollRef}
              style={s.options}
              contentContainerStyle={[s.optionsContent, { paddingBottom: extraPad }]}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              // Make the scrollbar and iOS content inset respect the bottom bar
              scrollIndicatorInsets={{ bottom: showContinue ? bottomBarH : 0, top: 0, left: 0, right: 0 }}
              contentInset={Platform.OS === 'ios' ? { bottom: showContinue ? bottomBarH : 0, top: 0 } : undefined}
            >
              {q.options.map(opt => {
                const active = isMulti ? multiSet.has(opt) : answers[index] === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => isMulti ? onToggleMulti(opt) : onSelectSingle(opt)}
                    onPressIn={() => Haptics.selectionAsync()}
                    style={({ pressed }) => [s.optionBtn, active && s.optionSelected, pressed && s.optionPressed]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: !!active }}
                    accessibilityLabel={opt}
                  >
                    <View style={s.optionRow}>
                      <Text style={[s.optionText, active && s.optionTextActive]} numberOfLines={2}>
                        {opt}
                      </Text>
                      <Ionicons
                        name={active ? 'checkmark-circle' : isMulti ? 'ellipse-outline' : 'chevron-forward'}
                        size={22}
                        color={active ? '#93c5fd' : 'rgba(229,231,235,0.5)'}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Bottom anchored Continue (measured for padding) */}
          {showContinue && (
            <View
              style={[s.bottomBar, { paddingBottom: Math.max(12, insets.bottom) }]}
              onLayout={e => setBottomBarH(e.nativeEvent.layout.height)}
            >
              <PrimaryButton label="Continue" onPress={onConfirmMulti} style={{ width: '100%' }} />
            </View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  page: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  card: {
    width: '100%',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },

  question: {
    color: 'white',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: 460,
    lineHeight: 19,
  },

  options: { width: '100%' },
  optionsContent: {
    alignItems: 'stretch',
    gap: 12,
    // paddingBottom is set dynamically
  },

  optionBtn: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  optionSelected: {
    borderColor: '#60a5fa',
    backgroundColor: 'rgba(96,165,250,0.15)',
  },
  optionPressed: { transform: [{ scale: 0.98 }] },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionText: {
    color: '#e5e7eb',
    fontSize: 18,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'left',
  },
  optionTextActive: { color: '#ffffff' },

  bottomBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 0,
    alignItems: 'center',
    paddingTop: 8,
    backgroundColor: 'transparent',
  },

  backBtn: {
    position: 'absolute',
    top: 16,
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
