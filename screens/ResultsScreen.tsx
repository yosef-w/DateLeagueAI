// app/results.tsx (or wherever your ResultsScreen lives)
import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';

type Section = { title: string; body: string };

export default function ResultsScreen() {
  const { feedback } = useLocalSearchParams<{ feedback?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const sections = useMemo(() => parseFeedback(feedback ?? ''), [feedback]);
  const [active, setActive] = useState(0);
  const activeText = sections[active]?.body ?? '';

  const onCopy = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(formatExport(sections));
      Alert.alert('Copied', 'Feedback copied to clipboard.');
    } catch {
      Alert.alert('Error', 'Could not copy.');
    }
  }, [sections]);

  const onSave = useCallback(async () => {
    try {
      const content = formatExport(sections);
      const filename = `results-${Date.now()}.txt`;
      const uri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(uri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      Alert.alert('Saved', `Saved to app documents as ${filename}`);
    } catch {
      Alert.alert('Error', 'Could not save file.');
    }
  }, [sections]);

  const onShare = useCallback(async () => {
    try {
      const available = await Sharing.isAvailableAsync();
      const content = formatExport(sections);
      if (!available) {
        await Clipboard.setStringAsync(content);
        Alert.alert('Copied', 'Sharing not available here—copied to clipboard instead.');
        return;
      }
      const tmp = FileSystem.cacheDirectory + `results-${Date.now()}.txt`;
      await FileSystem.writeAsStringAsync(tmp, content);
      await Sharing.shareAsync(tmp, {
        mimeType: 'text/plain',
        dialogTitle: 'Share Results',
      });
    } catch {
      Alert.alert('Error', 'Could not share.');
    }
  }, [sections]);

  return (
    <LinearGradient colors={['#0f172a', '#111827']} style={styles.screen}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Back */}
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
          style={{ flex: 1 }}
          contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Analysis Results</Text>
        <Text style={styles.subtitle}>
          Tips tailored to your photo{sections.length > 1 ? 's' : ''}. You can copy, share, or save for later.
        </Text>

        <View style={styles.card}>
          {/* Tabs for multi-photo feedback (Photo 1, Photo 2, …) */}
          {sections.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabRow}
            >
              {sections.map((s, i) => (
                <Pressable
                  key={(s.title || `Photo ${i + 1}`) + i}
                  onPress={() => setActive(i)}
                  style={[styles.tab, i === active && styles.tabActive]}
                >
                  <Text style={[styles.tabText, i === active && styles.tabTextActive]}>
                    {s.title || `Photo ${i + 1}`}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {/* Markdown-rendered feedback */}
          <ScrollView
            contentContainerStyle={styles.bodyWrap}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {activeText ? (
              <Markdown style={markdownStyles}>{activeText}</Markdown>
            ) : (
              <Text style={styles.placeholder}>No feedback returned.</Text>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <PrimaryButton label="Copy" onPress={onCopy} />
            <PrimaryButton label="Share" onPress={onShare} variant="ghost" />
            <PrimaryButton label="Save" onPress={onSave} variant="ghost" />
          </View>
          </View>

          <View style={styles.footerRow}>
            <PrimaryButton label="Analyze more photos" onPress={() => router.replace('/')} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ---------------- helpers ---------------- */

function parseFeedback(text: string): Section[] {
  if (!text?.trim()) return [{ title: 'Feedback', body: '' }];

  // If your Upload flow concatenates results like:
  // "Photo 1:\n...\n\nPhoto 2:\n..."
  const blocks = splitByPhoto(text);
  if (blocks.length > 0) return blocks;

  return [{ title: 'Feedback', body: text.trim() }];
}

function splitByPhoto(text: string): Section[] {
  // Split on lines that start with "Photo X:" or "Image X:" (case-insensitive)
  const regex = /^(Photo|Image)\s+(\d+)\s*:\s*/i;
  const lines = text.split(/\r?\n/);
  const out: Section[] = [];

  let currentTitle: string | null = null;
  let currentBody: string[] = [];

  for (const line of lines) {
    const m = line.match(regex);
    if (m) {
      if (currentTitle) out.push({ title: currentTitle, body: currentBody.join('\n').trim() });
      currentTitle = `Photo ${m[2]}`;
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }
  if (currentTitle) out.push({ title: currentTitle, body: currentBody.join('\n').trim() });

  return out.filter(s => s.body.length > 0);
}

function formatExport(sections: Section[]): string {
  if (sections.length <= 1) return sections[0]?.body ?? '';
  return sections
    .map((s, i) => `${s.title || `Photo ${i + 1}`}:\n${s.body}\n`)
    .join('\n');
}

function PrimaryButton({
  label,
  onPress,
  disabled,
  variant = 'solid',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'solid' | 'ghost';
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        variant === 'ghost' && styles.btnGhost,
        pressed && styles.btnPressed,
        disabled && styles.btnDisabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.btnText, variant === 'ghost' && styles.btnTextGhost]}>{label}</Text>
    </Pressable>
  );
}

/* ---------------- styles ---------------- */

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
  subtitle: { color: '#cbd5e1', fontSize: 14, textAlign: 'center', maxWidth: 360 },

  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  tabRow: { gap: 8, paddingBottom: 8 },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
    marginRight: 8,
  },
  tabActive: { backgroundColor: '#60a5fa22', borderColor: '#60a5fa' },
  tabText: { color: '#cbd5e1', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: 'white' },

  bodyWrap: { paddingTop: 8, paddingBottom: 4 },
  placeholder: { color: '#9ca3af', fontSize: 14 },

  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 14 },

  footerRow: { alignSelf: 'stretch', marginTop: 10 },

  btn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#60a5fa',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  btnGhost: { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.25)' },
  btnDisabled: { opacity: 0.5 },
  btnPressed: { transform: [{ scale: 0.98 }] },
  btnText: { color: 'white', fontWeight: '600' },
  btnTextGhost: { color: '#e5e7eb' },
});

/* Markdown theme (handles ### headings, bold, lists, code, etc.) */
const markdownStyles = {
  body: { color: '#e5e7eb', fontSize: 16, lineHeight: 22 },
  heading1: { color: 'white', fontSize: 24, marginBottom: 8, fontWeight: '700' as const },
  heading2: { color: 'white', fontSize: 20, marginTop: 16, marginBottom: 6, fontWeight: '700' as const },
  heading3: { color: '#60a5fa', fontSize: 18, marginTop: 14, marginBottom: 4, fontWeight: '600' as const },
  strong: { fontWeight: '700' as const, color: 'white' },
  em: { fontStyle: 'italic' as const },
  bullet_list: { marginVertical: 8 },
  ordered_list: { marginVertical: 8 },
  bullet_list_icon: { color: '#60a5fa' },
  ordered_list_icon: { color: '#60a5fa' },
  list_item: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 2 },
  link: { color: '#93c5fd' },
  code_inline: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
  },
  fence: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 10,
    borderRadius: 8,
    color: '#e5e7eb',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
  },
} as const;

