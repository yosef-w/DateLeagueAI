import React from 'react';
import { Text } from 'react-native';
import LottieView from 'lottie-react-native';
import FadeIn from './FadeIn';
import BarChart from './BarChart';
import { styles, SCREEN_W } from './styles';

const chartData = [
  { label: 'Online', value: 40 },
  { label: 'Friends', value: 20 },
  { label: 'Work/School', value: 11 },
  { label: 'Other', value: 29 },
];

export default function Step2() {
  return (
    <>
      <FadeIn keySuffix="lot2">
        <LottieView source={require('../../assets/lottie/graph-pulse.json')} autoPlay loop style={styles.lottie} />
      </FadeIn>
      <FadeIn keySuffix="title2" delay={60}>
        <Text style={styles.title}>Most couples meet online now</Text>
      </FadeIn>
      <FadeIn keySuffix="sub2" delay={140}>
        <Text style={styles.subtitle}>
          Online is the #1 way new couples meet. If your profile isn’t strong, you’re invisible.
        </Text>
      </FadeIn>
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
