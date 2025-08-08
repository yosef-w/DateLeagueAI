import React from 'react';
import { View, Text } from 'react-native';
import LottieView from 'lottie-react-native';
import FadeIn from './FadeIn';
import { styles } from './styles';

export default function Step3() {
  const bullets = [
    '• ~30% of U.S. adults have used a dating app',
    '• Users average ~51 minutes/day on apps',
    '• Standing out is hard—clarity beats clever',
  ];
  return (
    <>
      <FadeIn keySuffix="lot3">
        <LottieView source={require('../../assets/lottie/swipe-loop.json')} autoPlay loop style={styles.lottie} />
      </FadeIn>
      <FadeIn keySuffix="title3" delay={60}>
        <Text style={styles.title}>Apps are where the search happens</Text>
      </FadeIn>
      <FadeIn keySuffix="sub3" delay={140}>
        <Text style={styles.subtitle}>
          Billions of swipes. Limited attention. You get seconds to win the “yes.”
        </Text>
      </FadeIn>
      <FadeIn keySuffix="body3" delay={220}>
        <View style={styles.bullets}>
          {bullets.map((line, idx) => (
            <FadeIn
              key={line}
              keySuffix={`b3-${idx}`}
              delay={260 + idx * 80}
            >
              <Text style={styles.bullet}>{line}</Text>
            </FadeIn>
          ))}
        </View>
      </FadeIn>
      <FadeIn keySuffix="fine3" delay={300}>
        <Text style={styles.fineprint}>
          Sources: Pew Research (2023); Forbes Health survey (2025).
        </Text>
      </FadeIn>
    </>
  );
}
