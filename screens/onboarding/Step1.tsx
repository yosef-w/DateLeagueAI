import React from 'react';
import { View, Text } from 'react-native';
import LottieView from 'lottie-react-native';
import FadeSlide from './FadeSlide';
import { styles } from './styles';

export default function Step1() {
  const bullets = [
    '• Smart analysis across all photos and prompts',
    '• Actionable tips (lighting, framing, vibe, prompt tone)',
    '• Fast results—no fluff, just wins',
  ];
  return (
    <>
      <FadeSlide keySuffix="lot1">
        <LottieView source={require('../../assets/lottie/camera-spark.json')} autoPlay loop style={styles.lottie} />
      </FadeSlide>
      <FadeSlide keySuffix="title1" delay={60}>
        <Text style={styles.title}>Meet DateLeague AI</Text>
      </FadeSlide>
      <FadeSlide keySuffix="sub1" delay={140}>
        <Text style={styles.subtitle}>
          Your personal coach for Hinge, Bumble, Tinder—upload your profile screenshots and get targeted, step-by-step fixes.
        </Text>
      </FadeSlide>
      <FadeSlide keySuffix="body1" delay={220}>
        <View style={styles.bullets}>
          {bullets.map((line, idx) => (
            <FadeSlide keySuffix={`b1-${idx}`} delay={260 + idx * 80} fromY={10}>
              <Text style={styles.bullet}>{line}</Text>
            </FadeSlide>
          ))}
        </View>
      </FadeSlide>
    </>
  );
}
