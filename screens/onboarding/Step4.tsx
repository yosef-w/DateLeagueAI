import React from 'react';
import { View, Text } from 'react-native';
import LottieView from 'lottie-react-native';
import FadeIn from './FadeIn';
import { styles } from './styles';

export default function Step4() {
  const bullets = ['Ready to level up your profile?'];
  return (
    <>
      <FadeIn keySuffix="lot4">
        <LottieView source={require('../../assets/lottie/confetti-stars.json')} autoPlay loop style={styles.lottie} />
      </FadeIn>
      <FadeIn keySuffix="title4" delay={60}>
        <Text style={styles.title}>We turn swipes into dates</Text>
      </FadeIn>
      <FadeIn keySuffix="sub4" delay={140}>
        <Text style={styles.subtitle}>
          Upload your profile now. We’ll flag weak photos, suggest swaps, and punch-up prompts—so you get more quality matches.
        </Text>
      </FadeIn>
      <FadeIn keySuffix="body4" delay={220}>
        <View style={styles.bullets}>
          {bullets.map((line, idx) => (
            <FadeIn
              key={line}
              keySuffix={`b4-${idx}`}
              delay={260 + idx * 80}
            >
              <Text style={styles.bullet}>{line}</Text>
            </FadeIn>
          ))}
        </View>
      </FadeIn>
    </>
  );
}
