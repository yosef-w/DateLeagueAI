import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Svg, { Rect } from 'react-native-svg';
import LottieView from 'lottie-react-native';
import { MotiView, AnimatePresence } from 'moti';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// --- Config ---
const AUTO_ADVANCE_MS = 6000; // time per screen
const PROGRESS_EASE = 250;    // small ease-in at start/end (ms)
const UPLOAD_ROUTE = '/upload';     // change to '/upload'

// Framer-style fade+slide helper
function FadeSlide({
  children,
  delay = 0,
  fromY = 14,
  keySuffix = '',
}: {
  children: React.ReactNode;
  delay?: number;
  fromY?: number;
  keySuffix?: string;
}) {
  return (
    <MotiView
      key={`fs-${keySuffix}`}
      from={{ opacity: 0, translateY: fromY }}
      animate={{ opacity: 1, translateY: 0 }}
      exit={{ opacity: 0, translateY: -6 }}
      transition={{ type: 'timing', duration: 420, delay }}
    >
      {children}
    </MotiView>
  );
}

export default function OnboardingFlow() {
  const router = useRouter();
  const pagerRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);

  // progress for the bar [0..1]
  const progress = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const isDragging = useRef(false);

  const screens = useMemo(
    () => [
      {
        key: 's1',
        title: 'Meet DateLeague AI',
        subtitle:
          'Your personal coach for Hinge, Bumble, Tinder—upload your profile screenshots and get targeted, step-by-step fixes.',
        body: [
          '• Smart analysis across all photos and prompts',
          '• Actionable tips (lighting, framing, vibe, prompt tone)',
          '• Fast results—no fluff, just wins',
        ],
        lottie: require('../assets/lottie/camera-spark.json'),
      },
      {
        key: 's2',
        title: 'Most couples meet online now',
        subtitle:
          'Online is the #1 way new couples meet. If your profile isn’t strong, you’re invisible.',
        chart: {
          yLabel: '% of new couples meeting',
          data: [
            { label: 'Online', value: 40 },
            { label: 'Friends', value: 20 },
            { label: 'Work/School', value: 11 },
            { label: 'Other', value: 29 },
          ],
        },
        lottie: require('../assets/lottie/graph-pulse.json'),
      },
      {
        key: 's3',
        title: 'Apps are where the search happens',
        subtitle:
          'Billions of swipes. Limited attention. You get seconds to win the “yes.”',
        body: [
          '• ~30% of U.S. adults have used a dating app',
          '• Users average ~51 minutes/day on apps',
          '• Standing out is hard—clarity beats clever',
        ],
        fineprint: 'Sources: Pew Research (2023); Forbes Health survey (2025).',
        lottie: require('../assets/lottie/swipe-loop.json'),
      },
      {
        key: 's4',
        title: 'We turn swipes into dates',
        subtitle:
          'Upload your profile now. We’ll flag weak photos, suggest swaps, and punch-up prompts—so you get more quality matches.',
        body: ['Ready to level up your profile?'],
        ctaLabel: 'Get Started',
        lottie: require('../assets/lottie/confetti-stars.json'),
      },
    ],
    []
  );

  const isLast = index === screens.length - 1;
  const isFirst = index === 0;

  const goToUpload = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace(UPLOAD_ROUTE);
  }, [router]);

  const goPrev = useCallback(async () => {
    if (isFirst) return;
    await Haptics.selectionAsync();
    pagerRef.current?.scrollToIndex({ index: index - 1, animated: true });
  }, [index, isFirst]);

  const goNext = useCallback(async () => {
    if (isLast) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.replace(UPLOAD_ROUTE);
      return;
    }
    await Haptics.selectionAsync();
    pagerRef.current?.scrollToIndex({ index: index + 1, animated: true });
  }, [index, isLast, router]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setIndex(i);
    isDragging.current = false;
  };

  const onScrollBegin = () => {
    isDragging.current = true;
    stopProgress();
  };

  // --- progress control ---
  function stopProgress() {
    animRef.current?.stop?.();
    progress.stopAnimation();
  }

  function resetProgress() {
    stopProgress();
    progress.setValue(0);
  }

  function startProgress() {
    if (isLast) return; // no auto on last
    resetProgress();
    const easeIn = Animated.timing(progress, {
      toValue: 0.02,
      duration: PROGRESS_EASE,
      useNativeDriver: false,
    });
    const main = Animated.timing(progress, {
      toValue: 1,
      duration: AUTO_ADVANCE_MS - PROGRESS_EASE * 2,
      useNativeDriver: false,
    });
    const easeOut = Animated.timing(progress, {
      toValue: 1,
      duration: PROGRESS_EASE,
      useNativeDriver: false,
    });
    const seq = Animated.sequence([easeIn, main, easeOut]);
    animRef.current = seq;
    seq.start(async ({ finished }) => {
      if (finished && !isDragging.current) {
        // Light haptic on auto-advance
        await Haptics.selectionAsync();
        goNext();
      }
    });
  }

  // Restart progress whenever index changes
  useEffect(() => {
    startProgress();
    return stopProgress;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // A key that forces AnimatePresence to re-run on page change
  const animKey = screens[index]?.key ?? `k-${index}`;

  return (
    <LinearGradient colors={['#0f172a', '#111827']} style={styles.screen}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Back */}
        {!isFirst && (
          <Pressable
            onPress={goPrev}
            onPressIn={() => Haptics.selectionAsync()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backPressed]}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={24} color="#e5e7eb" />
          </Pressable>
        )}
        {/* Skip */}
        <Pressable
          onPress={goToUpload}
          onPressIn={() => Haptics.selectionAsync()}
          style={({ pressed }) => [styles.skipBtn, pressed && styles.skipPressed]}
          hitSlop={8}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>

        <FlatList
        ref={pagerRef}
        data={screens}
        keyExtractor={(it) => it.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={onScrollBegin}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={({ item }) => (
          <View style={styles.page}>
            <View style={styles.card}>
              <AnimatePresence exitBeforeEnter>
                {/* Lottie */}
                {item.lottie && (
                  <MotiView
                    key={`lot-${animKey}`}
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'timing', duration: 420 }}
                  >
                    <LottieView source={item.lottie} autoPlay loop style={styles.lottie} />
                  </MotiView>
                )}

                {/* Title */}
                <FadeSlide keySuffix={`title-${animKey}`} delay={60}>
                  <Text style={styles.title}>{item.title}</Text>
                </FadeSlide>

                {/* Subtitle */}
                <FadeSlide keySuffix={`sub-${animKey}`} delay={140}>
                  <Text style={styles.subtitle}>{item.subtitle}</Text>
                </FadeSlide>

                {/* Bullets */}
                {'body' in item && item.body && (
                  <FadeSlide keySuffix={`body-${animKey}`} delay={220}>
                    <View style={styles.bullets}>
                      {item.body.map((line, idx) => (
                        <FadeSlide key={`b-${animKey}-${idx}`} keySuffix={`b-${animKey}-${idx}`} delay={260 + idx * 80} fromY={10}>
                          <Text style={styles.bullet}>{line}</Text>
                        </FadeSlide>
                      ))}
                    </View>
                  </FadeSlide>
                )}

                {/* Chart */}
                {'chart' in item && item.chart && (
                  <FadeSlide keySuffix={`chart-${animKey}`} delay={260}>
                    <BarChart
                      width={Math.min(SCREEN_W - 48, 360)}
                      height={180}
                      items={item.chart.data}
                      yLabel={item.chart.yLabel}
                    />
                  </FadeSlide>
                )}

                {/* Fineprint */}
                {'fineprint' in item && item.fineprint && (
                  <FadeSlide keySuffix={`fine-${animKey}`} delay={300}>
                    <Text style={styles.fineprint}>{item.fineprint}</Text>
                  </FadeSlide>
                )}
              </AnimatePresence>
            </View>
          </View>
        )}
        />

        {/* Dots */}
        <View style={styles.dotsRow}>
          {screens.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        {/* Progress bar (auto-advance) */}
        {!isLast && (
          <View style={styles.progressWrap}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        )}

        {/* Continue button */}
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          onPress={goNext}
          onPressIn={() => Haptics.selectionAsync()}
        >
          <Text style={styles.ctaText}>
            {isLast ? screens[index].ctaLabel || 'Continue' : 'Continue'}
          </Text>
        </Pressable>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ---------------- Small interactive bar chart (tap to highlight + haptics) ---------------- */

type ChartItem = { label: string; value: number };

function BarChart({
  width,
  height,
  items,
  yLabel,
}: {
  width: number;
  height: number;
  items: ChartItem[];
  yLabel?: string;
}) {
  const [active, setActive] = useState<number | null>(0);
  const max = Math.max(...items.map((d) => d.value), 1);
  const padding = 12;
  const barGap = 10;
  const barCount = items.length;
  const barWidth = (width - padding * 2 - barGap * (barCount - 1)) / barCount;

  return (
    <View style={styles.chartWrap}>
      {!!yLabel && <Text style={styles.chartLabel}>{yLabel}</Text>}
      <Svg width={width} height={height}>
        {items.map((d, i) => {
          const h = (d.value / max) * (height - 40);
          const x = padding + i * (barWidth + barGap);
          const y = height - h - 20;
          const isActive = i === active;

          return (
            <Pressable
              key={d.label + i}
              onPress={async () => {
                setActive(i);
                await Haptics.selectionAsync();
              }}
              style={{ position: 'absolute', left: x, top: y, width: barWidth, height: h }}
            >
              <Rect
                x={0}
                y={0}
                width={barWidth}
                height={h}
                rx={6}
                ry={6}
                fill={isActive ? '#60a5fa' : 'rgba(255,255,255,0.25)'}
              />
            </Pressable>
          );
        })}
      </Svg>
      <View style={[styles.chartLabelsRow, { width }]}> 
        {items.map((d, i) => (
          <Pressable
            key={d.label + i}
            onPress={async () => {
              setActive(i);
              await Haptics.selectionAsync();
            }}
            style={styles.chartLabelItem}
          >
            <Text style={[styles.chartXLabel, i === active && styles.chartXLabelActive]} numberOfLines={1}>
              {d.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {active != null && (
        <Text style={styles.chartValue}>
          {items[active].label}: {items[active].value}%
        </Text>
      )}
      <Text style={styles.chartFootnote}>Tap bars to highlight</Text>
    </View>
  );
}

/* ---------------- styles ---------------- */

const styles = StyleSheet.create({
  screen: { flex: 1 },
  page: {
    width: SCREEN_W,
    height: SCREEN_H,
    paddingHorizontal: 16,
    paddingTop: 80,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
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
  skipBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  skipPressed: { transform: [{ scale: 0.98 }] },
  skipText: { color: '#e5e7eb', fontWeight: '600' },

  lottie: {
    width: 160,
    height: 160,
    alignSelf: 'center',
    marginBottom: 8,
  },
  title: { color: 'white', fontSize: 28, fontWeight: '700', letterSpacing: 0.2 },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 16,
    marginTop: 6,
    marginBottom: 14,
  },
  bullets: { gap: 8, marginTop: 6 },
  bullet: { color: '#e5e7eb', fontSize: 16, lineHeight: 22 },

  dotsRow: {
    position: 'absolute',
    bottom: 112,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8, height: 8, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: { backgroundColor: '#60a5fa' },

  progressWrap: {
    position: 'absolute',
    bottom: 88,
    left: 16,
    right: 16,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#60a5fa',
  },

  cta: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#60a5fa',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  ctaPressed: { transform: [{ scale: 0.98 }] },
  ctaText: { color: 'white', fontWeight: '700', fontSize: 16 },

  fineprint: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 14,
  },

  chartWrap: { marginTop: 6, alignItems: 'center' },
  chartLabel: { color: '#e5e7eb', marginBottom: 8, fontSize: 12 },
  chartLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  chartLabelItem: { flex: 1, alignItems: 'center' },
  chartXLabel: { color: '#cbd5e1', fontSize: 12 },
  chartXLabelActive: { color: 'white', fontWeight: '700' },
  chartValue: { color: '#e5e7eb', marginTop: 8, fontSize: 12 },
  chartFootnote: { color: '#9ca3af', marginTop: 2, fontSize: 10 },
});
