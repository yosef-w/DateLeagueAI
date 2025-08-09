import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import FadeIn from './FadeIn';
import { styles as g } from './styles';

export default function Step3() {
  const bullets = [
    'Lead with your strongest photo — first impression = decision.',
    'Limit to 4–5 photos. Cut group shots up front.',
    'One clean line > paragraphs. Clarity wins the “yes.”',
  ];

  const lotRef = useRef<LottieView>(null);

  useEffect(() => {
    lotRef.current?.play?.();
  }, []);

  return (
    <>
      {/* Hero */}
      <FadeIn keySuffix="lot3">
        <LottieView
          ref={lotRef}
          source={require('../../assets/lottie/clock-tick.json')}
          autoPlay
          loop
          style={g.lottie}
        />
      </FadeIn>

      {/* Headline */}
      <FadeIn keySuffix="title3" delay={60}>
        <Text style={g.title}>You have ~3 seconds to win the “Yes”</Text>
      </FadeIn>

      {/* Subline */}
      <FadeIn keySuffix="sub3" delay={140}>
        <Text style={g.subtitle}>
          So many swipes. Limited attention. Every extra second costs matches.
        </Text>
      </FadeIn>

      {/* Tiny timer bar to show urgency */}
      <FadeIn keySuffix="timer" delay={180}>
        <View style={local.timerWrap}>
          <View style={[local.tick, local.tickHot]} />
          <View style={local.tick} />
          <View style={local.tick} />
          <View style={local.tick} />
          <View style={local.tick} />
        </View>
        <View style={local.timerLabels}>
          <Text style={local.timerText}>0s</Text>
          <Text style={local.timerText}>1s</Text>
          <Text style={local.timerText}>2s</Text>
          <Text style={local.timerText}>3s</Text>
          <Text style={local.timerText}>Swipe</Text>
        </View>
      </FadeIn>

      {/* Action bullets (do-this-now) */}
      <FadeIn keySuffix="body3" delay={220}>
        <View style={g.bullets}>
          {bullets.map((line, idx) => (
            <FadeIn key={line} keySuffix={`b3-${idx}`} delay={260 + idx * 80}>
              <View style={local.bulletRow}>
                <Text style={local.bulletDot}>•</Text>
                <Text style={g.bullet}>{line}</Text>
              </View>
            </FadeIn>
          ))}
        </View>
      </FadeIn>

      {/* Proof line */}
      <FadeIn keySuffix="fine3" delay={320}>
        <Text style={g.fineprint}>
          Sources: Pew Research (2023) ~30% have used apps; Forbes Health (2025) ~51 min/day usage.
        </Text>
      </FadeIn>
    </>
  );
}

const local = StyleSheet.create({
  // Timer bar
  timerWrap: {
    alignSelf: 'stretch',
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    marginTop: 8,
  },
  tick: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '20%',
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  tickHot: {
    left: 0,
    backgroundColor: '#60a5fa',
  },
  // Positions for the other ticks (evenly spaced)
  // We’ll paint the rest by stacking empty segments behind; the first is highlighted.
  timerLabels: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timerText: { color: '#9ca3af', fontSize: 11 },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start' },
  bulletDot: { color: '#60a5fa', fontSize: 16, lineHeight: 22, marginRight: 8 },
});
