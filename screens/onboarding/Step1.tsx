import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import FadeIn from './FadeIn';
import { styles } from './styles';

export default function Step1() {
  return (
    <>
      {/* Hero Visual */}
      <FadeIn keySuffix="lot1">
        <View style={styles.lottieWrapper}>
          <LottieView
            source={require('../../assets/lottie/wave-loop.json')}
            autoPlay
            loop
            style={styles.lottie}
          />
        </View>
      </FadeIn>

      {/* Tagline Chip */}
      <FadeIn keySuffix="chip" delay={40}>
        <View style={local.tag}>
          <Text style={local.tagText}>AI Profile Coach</Text>
        </View>
      </FadeIn>

      {/* Title & Subtitle */}
      <FadeIn keySuffix="title1" delay={80}>
        <Text style={styles.title}>Meet DateGenie AI</Text>
      </FadeIn>

      <FadeIn keySuffix="sub1" delay={140}>
        <Text style={styles.subtitle}>
          Your personal coach for Hinge, Bumble, Tinder—upload profile screenshots and get targeted, step-by-step fixes.
        </Text>
      </FadeIn>

      {/* 🔥 One-line Hook with slogan */}
      <FadeIn keySuffix="hook" delay={220}>
        <View style={local.hookWrap}>
          <Text style={local.hookText}>
            Better photos. Better prompts.{'\n'}
            <Text style={local.hookSlogan}>They’ll think it’s magic.</Text>
          </Text>
        </View>
      </FadeIn>

      {/* Top Reasons You’ll Get a Date (2 cards) */}
      <FadeIn keySuffix="reasons" delay={320}>
        <View style={local.statsRow}>
          <View style={local.statCard}>
            <Text style={local.statBig}>Best Photos</Text>
            <Text style={local.statLabel}>Ranked for attraction</Text>
            <Text style={local.statHint}>We highlight your strongest shots & suggest swaps.</Text>
          </View>
          <View style={local.statCard}>
            <Text style={local.statBig}>Magnetic Prompts</Text>
            <Text style={local.statLabel}>Replies that convert</Text>
            <Text style={local.statHint}>Punch-up lines tailored to your vibe & apps.</Text>
          </View>
        </View>
      </FadeIn>
    </>
  );
}

const local = StyleSheet.create({
  tag: {
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(96,165,250,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(96,165,250,0.45)',
    marginBottom: 6,
  },
  tagText: { color: '#cfe1ff', fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.2 },

  // Hook styles
  hookWrap: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
    marginTop: 4,
  },
  hookText: { color: '#e5e7eb', fontSize: 16, textAlign: 'center' },
  hookStrong: { color: 'white', fontWeight: '700' as const },
  hookSlogan: { color: '#93c5fd', fontWeight: '700' as const }, // subtle pop for the slogan

  // Two cards row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    alignSelf: 'stretch',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  statBig: { color: 'white', fontSize: 16, fontWeight: '700' as const },
  statLabel: { color: '#cbd5e1', fontSize: 12, marginTop: 2 },
  statHint: { color: '#9ca3af', fontSize: 11, marginTop: 2 },
});
