import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import PrimaryButton from '../components/PrimaryButton';

interface Category {
  label: string;
  score: number; // 0-10
  desc?: string;
}

type GradeInfo = {
  letter: string;
  color: string;    // letter color (green/yellow/red only)
  ringFrom: string; // grade ring gradient start
  ringTo: string;   // grade ring gradient end
  blurb: string;    // short encouragement/callout
};

/** Canonical breakdown we always show (order matters) */
const CANONICAL: { label: string; defaultScore: number }[] = [
  { label: 'Lead Photo Quality',  defaultScore: 8.4 },
  { label: 'Variety of Photos',   defaultScore: 4.6 }, // <5 to show "Needs work"
  { label: 'Prompt Creativity',   defaultScore: 4.9 }, // <5 to show "Needs work"
  { label: 'Bio Clarity',         defaultScore: 6.8 },
  { label: 'Interests & Tags',    defaultScore: 4.3 }, // <5 to show "Needs work"
  { label: 'Profile Cohesion',    defaultScore: 7.2 },
  { label: 'First-Photo Impact',  defaultScore: 6.4 },
  { label: 'Swipe-Worthy Factor', defaultScore: 7.1 },
];

/** Short, user-friendly subtext per category */
const LABEL_DESC: Record<string, string> = {
  'Lead Photo Quality':  'Sharp face, good light, clean background.',
  'Variety of Photos':   'Shows hobbies, social proof, and different looks.',
  'Prompt Creativity':   'Unique, playful, reply-friendly lines.',
  'Bio Clarity':         'Short, specific, easy to read fast.',
  'Interests & Tags':    'Relevant prompts, badges, and cues filled in.',
  'Profile Cohesion':    'Photos + text tell one consistent story.',
  'First-Photo Impact':  'Instant hook in the first 3 seconds.',
  'Swipe-Worthy Factor': 'Overall “would I swipe right?” appeal.',
};

export default function ProfileRatingScreen() {
  const { scores, feedback } = useLocalSearchParams<{ scores?: string; feedback?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  /** Merge incoming scores into canonical list, then append unknown categories (case-insensitive). */
  const categories: Category[] = useMemo(() => {
    // 1) Start with canonical as working array
    let merged = CANONICAL.map(c => ({ ...c })); // {label, defaultScore}

    // 2) Build map from incoming (label -> clamped score)
    const incomingMap = new Map<string, number>();
    let incomingArray: { label: string; score: number }[] = [];
    if (scores) {
      try {
        const parsed = JSON.parse(scores);
        if (Array.isArray(parsed)) {
          incomingArray = parsed
            .filter((c: any) => c && typeof c.label === 'string' && typeof c.score === 'number')
            .map((c: any) => ({ label: c.label.trim(), score: Math.max(0, Math.min(10, c.score)) }));
          for (const c of incomingArray) incomingMap.set(c.label.toLowerCase(), c.score);
        }
      } catch {
        // ignore malformed
      }
    }

    // 3) Merge incoming values into canonical by label (case-insensitive)
    merged = merged.map(c => {
      const key = c.label.toLowerCase();
      const val = incomingMap.get(key);
      return { label: c.label, defaultScore: typeof val === 'number' ? val : c.defaultScore };
    });

    // 4) Append unknown categories (present in incoming but not in canonical)
    const canonicalKeys = new Set(CANONICAL.map(c => c.label.toLowerCase()));
    const unknowns = incomingArray.filter(c => !canonicalKeys.has(c.label.toLowerCase()));

    // 5) Convert to Category with desc
    const canonicalWithDesc: Category[] = merged.map(c => ({
      label: c.label,
      score: c.defaultScore,
      desc: LABEL_DESC[c.label] ?? 'Additional signal from analysis.',
    }));
    const extras: Category[] = unknowns.map(u => ({
      label: u.label,
      score: u.score,
      desc: 'Additional signal from analysis.',
    }));

    return [...canonicalWithDesc, ...extras];
  }, [scores]);

  const avg = useMemo(() => {
    if (categories.length === 0) return 0;
    const total = categories.reduce((sum, c) => sum + c.score, 0);
    return total / categories.length;
  }, [categories]);

  /** Traditional grading scale (0–10) where 7.0 => C- */
  const grade: GradeInfo = useMemo(() => {
    const a = avg;
    const letter =
      a >= 9.7 ? 'A+' :
      a >= 9.3 ? 'A'  :
      a >= 9.0 ? 'A-' :
      a >= 8.7 ? 'B+' :
      a >= 8.3 ? 'B'  :
      a >= 8.0 ? 'B-' :
      a >= 7.7 ? 'C+' :
      a >= 7.3 ? 'C'  :
      a >= 7.0 ? 'C-' :
      a >= 6.7 ? 'D+' :
      a >= 6.3 ? 'D'  :
      a >= 6.0 ? 'D-' : 'F';

    // GREEN (#34d399), YELLOW (#fbbf24), RED (#ef4444) only
    const GREEN = '#34d399';
    const YELLOW = '#fbbf24';
    const RED = '#ef4444';

    const palette: Record<string, GradeInfo> = {
      'A+': { letter: 'A+', color: GREEN, ringFrom: 'rgba(52,211,153,0.25)', ringTo: 'rgba(52,211,153,0.55)', blurb: 'Elite profile. Keep the momentum.' },
      'A':  { letter: 'A',  color: GREEN, ringFrom: 'rgba(52,211,153,0.25)', ringTo: 'rgba(52,211,153,0.55)', blurb: 'You’re date-ready. Minor polish = gold.' },
      'A-': { letter: 'A-', color: GREEN, ringFrom: 'rgba(52,211,153,0.25)', ringTo: 'rgba(52,211,153,0.55)', blurb: 'Nearly perfect. A few tweaks = A+.' },

      'B+': { letter: 'B+', color: YELLOW, ringFrom: 'rgba(251,191,36,0.25)', ringTo: 'rgba(251,191,36,0.55)', blurb: 'Strong foundation. Optimize the hook.' },
      'B':  { letter: 'B',  color: YELLOW, ringFrom: 'rgba(251,191,36,0.25)', ringTo: 'rgba(251,191,36,0.55)', blurb: 'Good — sharpen first impressions.' },
      'B-': { letter: 'B-', color: YELLOW, ringFrom: 'rgba(251,191,36,0.25)', ringTo: 'rgba(251,191,36,0.55)', blurb: 'Close. Lead photo + prompt punch-up.' },

      'C+': { letter: 'C+', color: YELLOW, ringFrom: 'rgba(251,191,36,0.25)', ringTo: 'rgba(251,191,36,0.55)', blurb: 'Potential’s there. Let’s make it obvious.' },
      'C':  { letter: 'C',  color: YELLOW, ringFrom: 'rgba(251,191,36,0.25)', ringTo: 'rgba(251,191,36,0.55)', blurb: 'You’re blending in. We’ll fix that.' },
      'C-': { letter: 'C-', color: YELLOW, ringFrom: 'rgba(251,191,36,0.25)', ringTo: 'rgba(251,191,36,0.55)', blurb: 'Quick wins ahead. Start with photos.' },

      'D+': { letter: 'D+', color: RED, ringFrom: 'rgba(239,68,68,0.25)', ringTo: 'rgba(239,68,68,0.55)', blurb: 'Time to overhaul — we’ll guide you.' },
      'D':  { letter: 'D',  color: RED, ringFrom: 'rgba(239,68,68,0.25)', ringTo: 'rgba(239,68,68,0.55)', blurb: 'Low visibility. Let’s rebuild the hook.' },
      'D-': { letter: 'D-', color: RED, ringFrom: 'rgba(239,68,68,0.25)', ringTo: 'rgba(239,68,68,0.55)', blurb: 'We’ll start with the basics and climb.' },

      'F':  { letter: 'F',  color: RED, ringFrom: 'rgba(239,68,68,0.25)', ringTo: 'rgba(239,68,68,0.55)', blurb: 'Fresh start. We’ll rebuild this right.' },
    };
    return palette[letter];
  }, [avg]);

  /** Pick at most 2 chips, stacked vertically */
  const strength = useMemo(
    () => categories.find(c => c.score >= 8.0)?.label,
    [categories]
  );
  const needWork = useMemo(
    () => categories.find(c => c.score < 5.0)?.label,
    [categories]
  );

  const toResults = useCallback(() => {
    router.push({ pathname: '/results', params: { feedback } });
  }, [router, feedback]);

  return (
    <LinearGradient colors={['#0f172a', '#111827']} style={styles.screen}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Back */}
        <Pressable
          onPress={() => router.back()}
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

        <ScrollView
          contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={styles.title}>Your Profile Grade</Text>

          {/* Grade Card */}
          <View style={styles.gradeCard}>
            {/* Ring stack keeps pulses centered relative to the ring */}
            <View style={styles.ringStack}>
              {/* Pulsing auras (centered using absolute fill + flex) */}
              <CenteredPulse color={grade.color} size={128} />
              <CenteredPulse color={grade.color} size={144} delay={500} />

              {/* Actual grade ring */}
              <LinearGradient
                colors={[grade.ringFrom, grade.ringTo]}
                style={styles.gradeRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.gradeInner}>
                  <Text style={[styles.avgNumber, { color: 'white' }]}>{avg.toFixed(1)}</Text>
                  <Text style={[styles.gradeLetter, { color: grade.color }]}>{grade.letter}</Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.gradeCopy}>
              <Text style={styles.gradeLine}>
                You’re at <Text style={styles.gradeEm}>{avg.toFixed(1)}/10</Text> — that’s a{' '}
                <Text style={[styles.gradeEm, { color: grade.color }]}>{grade.letter}</Text>.
              </Text>
              <Text style={styles.gradeBlurb}>{grade.blurb}</Text>

              {/* Vertical chips (at most 2) */}
              <View style={styles.chipsColumn}>
                {strength && <ChipSmall label={`Strength: ${strength}`} tone="good" />}
                {needWork && <ChipSmall label={`Needs work: ${needWork}`} tone="warn" />}
              </View>
            </View>
          </View>

          {/* Category breakdown */}
          <View style={styles.card}>
            <Text style={styles.breakdownTitle}>Breakdown</Text>
            <Text style={styles.breakdownSubtext}>Scores are out of 10. Higher is better.</Text>

            {categories.map((c, i) => (
              <CategoryRow key={c.label + i} label={c.label} score={c.score} desc={c.desc} />
            ))}
          </View>

          {/* CTA */}
          <View style={styles.footerRow}>
            <PrimaryButton label="View Personalized Tips" onPress={toResults} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ---------------- centered pulse helpers ---------------- */

function CenteredPulse({
  color,
  size = 128,
  delay = 0,
}: {
  color: string;
  size?: number;
  delay?: number;
}) {
  return (
    <View style={styles.pulseFillCenter} pointerEvents="none">
      <MotiView
        from={{ opacity: 0.35, scale: 0.9 }}
        animate={{ opacity: 0, scale: 1.15 }}
        transition={{ type: 'timing', duration: 1400, delay, loop: true }}
        style={{
          width: size + 24,
          height: size + 24,
          borderRadius: (size + 24) / 2,
          backgroundColor: `${color}33`, // ~20% alpha
        }}
      />
    </View>
  );
}

/* ---------------- breakdown row ---------------- */
function CategoryRow({ label, score, desc }: { label: string; score: number; desc?: string }) {
  const pct = Math.max(0, Math.min(100, (score / 10) * 100));
  // GREEN / YELLOW / RED only
  const color =
    score >= 7.5 ? '#34d399' :   // green
    score >= 6.0 ? '#fbbf24' :   // yellow
    '#ef4444';                   // red

  const isRed = color === '#ef4444';

  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cat}>{label}</Text>
          {!!desc && <Text style={styles.catSub}>{desc}</Text>}
        </View>
        <Text style={styles.score}>{score.toFixed(1)}</Text>
      </View>

      <View style={styles.barBg}>
        {/* Pulse halo only for red bars */}
        {isRed && (
          <MotiView
            from={{ opacity: 0.22, scaleX: 1.0 }}
            animate={{ opacity: 0, scaleX: 1.08 }}
            transition={{ type: 'timing', duration: 1200, loop: true }}
            style={styles.redPulse}
            pointerEvents="none"
          />
        )}
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>

      {score < 5.0 && (
        <View style={[styles.needsPill, { borderColor: color }]}>
          <Text style={[styles.needsPillText, { color }]}>Needs work</Text>
        </View>
      )}
    </View>
  );
}

/* ---------------- tiny chips (vertical) ---------------- */
function ChipSmall({ label, tone }: { label: string; tone: 'good' | 'warn' }) {
  const bg = tone === 'good' ? 'rgba(52,211,153,0.10)' : 'rgba(251,191,36,0.10)';
  const border = tone === 'good' ? 'rgba(52,211,153,0.35)' : 'rgba(251,191,36,0.35)';
  const text = tone === 'good' ? '#34d399' : '#fbbf24';
  return (
    <View style={[styles.chipSm, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.chipSmText, { color: text }]} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

/* ---------------- CTA ---------------- */
/* ---------------- styles ---------------- */
const RING_SIZE = 112;

const styles = StyleSheet.create({
  screen: { flex: 1 },

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

  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 64,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 14,
  },

  title: { color: 'white', fontSize: 24, fontWeight: '700', letterSpacing: 0.2 },

  gradeCard: {
    width: '100%',
    maxWidth: 560,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  // Wrapper that holds pulses + ring and ensures perfect centering
  ringStack: {
    width: RING_SIZE,
    height: RING_SIZE,
    marginRight: 8,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Absolute-fill container that centers its child (the pulse)
  pulseFillCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },

  gradeRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeInner: {
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: 'rgba(17,24,39,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  avgNumber: { fontSize: 22, fontWeight: '700' },
  gradeLetter: { fontSize: 28, fontWeight: '900', marginTop: 2 },

  gradeCopy: { flex: 1 },
  gradeLine: { color: '#e5e7eb', fontSize: 14, lineHeight: 20 },
  gradeEm: { fontWeight: '700', color: 'white' },
  gradeBlurb: { color: '#cbd5e1', fontSize: 13, marginTop: 6 },

  // vertical chips stack
  chipsColumn: {
    gap: 6,
    paddingTop: 8,
  },
  chipSm: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
  },
  chipSmText: { fontSize: 12, fontWeight: '700' },

  card: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  breakdownTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  breakdownSubtext: {
    color: '#cbd5e1',
    fontSize: 12,
    marginBottom: 10,
  },

  row: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },

  cat: { color: 'white', fontSize: 16, fontWeight: '700' },
  catSub: { color: '#9ca3af', fontSize: 12, marginTop: 2 },

  score: { fontSize: 16, fontWeight: '700', color: 'white' },

  barBg: {
    position: 'relative',
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#34d399', // overridden inline per color logic
  },
  // Pulse halo (sits behind the fill) — only rendered for red bars
  redPulse: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -2,
    bottom: -2,
    borderRadius: 999,
    backgroundColor: 'rgba(239,68,68,0.3)',
  },

  needsPill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  needsPillText: { fontSize: 12, fontWeight: '700' },

  footerRow: { alignSelf: 'stretch', marginTop: 16 },
});
