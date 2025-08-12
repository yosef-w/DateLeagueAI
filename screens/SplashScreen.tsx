import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import PrimaryButton from '../components/PrimaryButton';

export default function SplashScreen() {
  const router = useRouter();
  const onStart = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding');
  };

  return (
    <LinearGradient colors={['#0f172a', '#111827']} style={styles.screen}>
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>DateGenie AI</Text>
        <PrimaryButton label="Get Started" onPress={onStart} style={styles.btn} />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, gap: 24 },
  title: { color: 'white', fontSize: 32, fontWeight: '800', textAlign: 'center' },
  btn: { alignSelf: 'stretch' },
});

