import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';

export default function SignupLikesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <LinearGradient colors={['#0f172a', '#111827']} style={styles.screen}>
      <SafeAreaView style={{ flex: 1 }}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            router.back();
          }}
          style={({ pressed }) => [
            styles.backBtn,
            { top: insets.top + 8 },
            pressed && styles.backPressed,
          ]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#e5e7eb" />
        </Pressable>

        <View style={[styles.page, { paddingTop: insets.top + 56 }]}>
          <Text style={styles.title}>More likes with Date Genie</Text>
          <View style={styles.graph}>
            <View style={styles.barGroup}>
              <View style={[styles.bar, styles.barCurrent]} />
              <Text style={styles.barLabel}>Current</Text>
            </View>
            <View style={styles.barGroup}>
              <View style={[styles.bar, styles.barGenie]} />
              <Text style={styles.barLabel}>Date Genie</Text>
            </View>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/upload');
            }}
            style={({ pressed }) => [styles.continueBtn, pressed && styles.continuePressed]}
          >
            <Text style={styles.continueText}>Continue</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 48,
  },
  graph: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    width: '80%',
    maxWidth: 320,
    marginBottom: 48,
  },
  barGroup: {
    alignItems: 'center',
    width: 80,
  },
  bar: {
    width: '100%',
    borderRadius: 8,
  },
  barCurrent: {
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  barGenie: {
    height: 200,
    backgroundColor: '#60a5fa',
  },
  barLabel: {
    color: '#e5e7eb',
    marginTop: 8,
    fontWeight: '600',
  },
  continueBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 999,
    backgroundColor: '#60a5fa',
  },
  continuePressed: { opacity: 0.8 },
  continueText: {
    color: '#1e3a8a',
    fontSize: 16,
    fontWeight: '700',
  },
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
});

