import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';

interface Category {
  label: string;
  score: number; // 0-10
}

export default function ProfileRatingScreen() {
  const { scores, feedback } = useLocalSearchParams<{ scores?: string; feedback?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const categories: Category[] = useMemo(() => {
    if (!scores) {
      return [
        { label: 'Photo Quality', score: 7 },
        { label: 'Bio', score: 6 },
        { label: 'Interests', score: 8 },
      ];
    }
    try {
      const parsed = JSON.parse(scores);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch {
      return [];
    }
  }, [scores]);

  const avg = useMemo(() => {
    if (categories.length === 0) return 0;
    const total = categories.reduce((sum, c) => sum + c.score, 0);
    return total / categories.length;
  }, [categories]);

  const toResults = useCallback(() => {
    router.push({ pathname: '/results', params: { feedback } });
  }, [router, feedback]);

  return (
    <LinearGradient colors={['#0f172a', '#111827']} style={styles.screen}>
      <SafeAreaView style={{ flex: 1 }}>
        <Pressable
          onPress={() => router.back()}
          onPressIn={() => Haptics.selectionAsync()}
          style={({ pressed }) => [
            styles.backBtn,
            { top: insets.top + 8 },
            pressed && styles.backPressed,
          ]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#e5e7eb" />
        </Pressable>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Profile Rating</Text>
          <Text style={styles.subtitle}>Average score: {avg.toFixed(1)} / 10</Text>

          <View style={styles.card}>
            {categories.map((c, i) => (
              <View key={c.label + i} style={styles.row}>
                <Text style={styles.cat}>{c.label}</Text>
                <Text style={styles.score}>{c.score.toFixed(1)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.footerRow}>
            <PrimaryButton label="View Tips" onPress={toResults} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        pressed && styles.btnPressed,
        disabled && styles.btnDisabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
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
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 64,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 14,
  },
  title: { color: 'white', fontSize: 24, fontWeight: '700', letterSpacing: 0.2 },
  subtitle: { color: '#cbd5e1', fontSize: 16 },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  cat: { color: '#e5e7eb', fontSize: 16 },
  score: { color: 'white', fontSize: 16, fontWeight: '600' },
  footerRow: { alignSelf: 'stretch', marginTop: 20 },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#60a5fa',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  btnDisabled: { opacity: 0.5 },
  btnPressed: { transform: [{ scale: 0.98 }] },
  btnText: { color: 'white', fontWeight: '600' },
});
