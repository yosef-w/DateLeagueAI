import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import FadeIn from './FadeIn';
import BarChart from './BarChart';
import { styles as g, SCREEN_W } from './styles';

const chartData = [
  { label: 'Online', value: 55 },   
  { label: 'Friends', value: 20 },
  { label: 'Work/School', value: 11 },
  { label: 'Other', value: 8 },        
];

export default function Step2() {
  const lotRef = useRef<LottieView>(null);

  useEffect(() => {
    lotRef.current?.play?.();
  }, []);

  return (
    <>
      {/* Hero Animation */}
      <FadeIn keySuffix="lot2">
        <View style={local.heroWrap}>
          <LottieView
            ref={lotRef}
            source={require('../../assets/lottie/social-bubble.json')}
            autoPlay
            loop
            style={local.lottie}
          />
        </View>
      </FadeIn>

      {/* Headline */}
      <FadeIn keySuffix="title2" delay={60}>
        <Text style={g.title}>Most couples meet online now</Text>
      </FadeIn>

      {/* Subline */}
      <FadeIn keySuffix="sub2" delay={140}>
        <Text style={g.subtitle}>
          Apps are the arena. Blink and you’re skipped. <Text style={local.subStrong}>Stand out or disappear.</Text>
        </Text>
      </FadeIn>

      {/* Chart */}
      <FadeIn keySuffix="chart2" delay={220}>
        <BarChart
          width={Math.min(SCREEN_W - 48, 360)}
          height={180}
          items={chartData}
          yLabel="% of new couples meeting"
        />
      </FadeIn>
    </>
  );
}

const local = StyleSheet.create({
  heroWrap: {
    alignItems: 'center',
    marginTop: -6,
  },
  lottie: {
    width: 300,
    height: 180,
    alignSelf: 'center',
  },
  subStrong: { color: 'white', fontWeight: '700' as const },
});
