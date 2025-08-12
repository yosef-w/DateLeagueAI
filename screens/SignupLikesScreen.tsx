import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import PrimaryButton from '../components/PrimaryButton';

export default function SignupLikesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Chart sizing
  const PLOT_HEIGHT = 220;     // height of the plotting area (bars + grid)
  const GRID_LINES  = 5;       // includes the bottom x-axis
  const LABEL_GAP   = 26;      // space reserved below the axis for labels

  // Target bar heights (in pixels within PLOT_HEIGHT)
  const BEFORE_TARGET = 56;
  const GENIE_TARGET  = 210;

  // Animated bar heights: start at 0 (so they grow UP from the axis)
  const beforeH = useRef(new Animated.Value(0)).current;
  const genieH  = useRef(new Animated.Value(0)).current;

  // Sparkle dots inside DateGenie bar
  const spark1 = useRef(new Animated.Value(0)).current;
  const spark2 = useRef(new Animated.Value(0)).current;
  const spark3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Bars bounce up from baseline
    Animated.stagger(120, [
      Animated.timing(beforeH, {
        toValue: BEFORE_TARGET,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(genieH, {
        toValue: GENIE_TARGET,
        duration: 900,
        easing: Easing.out(Easing.elastic(1)),
        useNativeDriver: false,
      }),
    ]).start();

    // Sparkle loops
    const loop = (v: Animated.Value, delay: number, dur = 1600) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, { toValue: 1, duration: dur, easing: Easing.out(Easing.quad), useNativeDriver: false }),
          Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: false }),
        ])
      );
    const l1 = loop(spark1, 200);
    const l2 = loop(spark2, 800);
    const l3 = loop(spark3, 1200);
    l1.start(); l2.start(); l3.start();
    return () => { l1.stop(); l2.stop(); l3.stop(); };
  }, [beforeH, genieH, spark1, spark2, spark3]);

  const onContinue = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/sso');
  };

  return (
    <LinearGradient colors={['#0f172a', '#111827']} style={s.screen}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Back */}
        <Pressable
          onPress={() => { Haptics.selectionAsync(); router.back(); }}
          style={({ pressed }) => [s.backBtn, { top: insets.top + 8 }, pressed && s.backPressed]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color="#e5e7eb" />
        </Pressable>

        <View style={[s.page, { paddingTop: insets.top + 56 }]}>
          {/* Headline */}
          <Text style={s.kicker}>Why DateGenie works</Text>
          <Text style={s.title}>More likes. Better matches.</Text>
          <Text style={s.subtitle}>
            We fix the first photo, the order, and the one-liners that get replies. Simple changes, outsized results.
          </Text>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Projected Likes</Text>

            {/* Chart area: plot on top, labels under the axis */}
            <View style={{ width: '100%' }}>
              {/* PLOT (grid + bars). Height excludes label area. */}
              <View style={[s.plotArea, { height: PLOT_HEIGHT }]}>
                {/* Grid lines */}
                {Array.from({ length: GRID_LINES }).map((_, i) => {
                  const y = (i / (GRID_LINES - 1)) * PLOT_HEIGHT; // 0..PLOT_HEIGHT (from bottom)
                  const isAxis = i === 0; // bottom-most line
                  return (
                    <View
                      key={i}
                      style={[
                        s.gridRule,
                        {
                          bottom: y,
                          height: isAxis ? 2 : 1,
                          opacity: isAxis ? 0.9 : 0.5, // stronger visibility
                        },
                      ]}
                    />
                  );
                })}

                {/* Bars row aligned to bottom of plot */}
                <View style={s.barsRow}>
                  {/* Before */}
                  <View style={s.barGroup}>
                    <Animated.View style={[s.bar, s.barBefore, { height: beforeH }]} />
                  </View>

                  {/* DateGenie */}
                  <View style={s.barGroup}>
                    <View style={s.genieBarWrap}>
                      <Animated.View style={[s.bar, s.barGenie, { height: genieH }]} />
                      <View pointerEvents="none" style={s.sparklesClip}>
                        <Sparkle v={spark1} leftPct={0.25} />
                        <Sparkle v={spark2} leftPct={0.55} delay />
                        <Sparkle v={spark3} leftPct={0.72} small />
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* Labels row BELOW the x-axis */}
              <View style={[s.labelsRow, { height: LABEL_GAP }]}>
                <View style={s.labelCell}><Text style={s.barLabel}>Before</Text></View>
                <View style={s.labelCell}><Text style={s.barLabel}>DateGenie</Text></View>
              </View>
            </View>
          </View>

          {/* CTA */}
          <PrimaryButton label="Continue" onPress={onContinue} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* Sparkle dot floats upward & fades inside the DateGenie bar */
function Sparkle({
  v,
  leftPct,
  delay = false,
  small = false,
}: {
  v: Animated.Value;
  leftPct: number; // 0..1 across bar width
  delay?: boolean;
  small?: boolean;
}) {
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [20, -120] });
  const opacity     = v.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 1, 0] });
  const scale       = v.interpolate({ inputRange: [0, 1], outputRange: [small ? 0.8 : 1, small ? 1 : 1.2] });

  return (
    <Animated.View
      style={[
        sparkStyles.sparkle,
        {
          left: `${leftPct * 100}%` as any, // allow percentage
          transform: [{ translateY }, { scale }],
          opacity,
          marginTop: delay ? 6 : 0,
          width: small ? 6 : 8,
          height: small ? 6 : 8,
        },
      ]}
    />
  );
}

const sparkStyles = StyleSheet.create({
  sparkle: {
    position: 'absolute',
    bottom: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#93c5fd',
    shadowOpacity: 0.7,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});

const s = StyleSheet.create({
  screen: { flex: 1 },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  kicker: { color: '#93c5fd', fontSize: 12, fontWeight: '700', letterSpacing: 0.4, marginBottom: 6 },
  title: { color: 'white', fontSize: 26, fontWeight: '800', textAlign: 'center' },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 22,
    maxWidth: 360,
    lineHeight: 20,
  },

  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
    marginBottom: 28,
  },
  cardTitle: { color: 'white', fontWeight: '700', marginBottom: 10, textAlign: 'center' },

  // Plot area (grid + bars)
  plotArea: {
    position: 'relative',
    width: '100%',
    marginTop: 6,
  },

  // Grid lines (full width). Bottom line is the x-axis (thicker/higher opacity in code above).
  gridRule: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.6)', // more visible
  },

  // Bars aligned to the bottom of the plot
  barsRow: {
    position: 'absolute',
    bottom: 0,
    left: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  barGroup: {
    alignItems: 'center',
    width: 120,
  },
  bar: {
    width: '100%',
    borderRadius: 10,
  },
  barBefore: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  genieBarWrap: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    borderRadius: 10,
  },
  barGenie: {
    backgroundColor: '#60a5fa',
    shadowColor: '#60a5fa',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  sparklesClip: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0, top: 0,
    overflow: 'hidden',
  },

  // Labels live below the x-axis
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    marginTop: 6,
    height: 26,
  },
  labelCell: { width: 120, alignItems: 'center' },
  barLabel: { color: '#e5e7eb', fontWeight: '700' },


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
