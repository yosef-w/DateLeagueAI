import React from 'react';
import { View, Text } from 'react-native';
import LottieView from 'lottie-react-native';
import FadeSlide from './FadeSlide';
import { styles } from './styles';

export default function Step4() {
  const bullets = ['Ready to level up your profile?'];
  return (
    <>
      <FadeSlide keySuffix="lot4">
        <LottieView source={require('../../assets/lottie/confetti-stars.json')} autoPlay loop style={styles.lottie} />
      </FadeSlide>
      <FadeSlide keySuffix="title4" delay={60}>
        <Text style={styles.title}>We turn swipes into dates</Text>
      </FadeSlide>
      <FadeSlide keySuffix="sub4" delay={140}>
        <Text style={styles.subtitle}>
          Upload your profile now. We’ll flag weak photos, suggest swaps, and punch-up prompts—so you get more quality matches.
        </Text>
      </FadeSlide>
      <FadeSlide keySuffix="body4" delay={220}>
        <View style={styles.bullets}>
          {bullets.map((line, idx) => (
            <FadeSlide keySuffix={`b4-${idx}`} delay={260 + idx * 80} fromY={10}>
              <Text style={styles.bullet}>{line}</Text>
            </FadeSlide>
          ))}
        </View>
      </FadeSlide>
    </>
  );
}
