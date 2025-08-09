import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Alert,
  Text,
  Pressable,
  Platform,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import uploadToFirebase from '../utils/uploadToFirebase';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';

const ANALYZE_URL =
  'https://gemini-backend-633816661931.us-central1.run.app/analyze';

const MAX_IMAGES = 5;
const { width: SCREEN_W } = Dimensions.get('window');

type Step = 'idle' | 'uploading' | 'analyzing';
type ItemStatus = 'ready' | 'uploading' | 'uploaded' | 'error';

type PhotoItem = {
  id: string;
  uri: string;          // optimized local uri
  rawUri: string;       // original local uri (optional)
  progress: number;     // 0..1
  status: ItemStatus;
  url?: string;         // firebase URL after upload
  error?: string;
};

export default function UploadScreen(): React.ReactElement {
  const [items, setItems] = useState<PhotoItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [step, setStep] = useState<Step>('idle');
  const [overall, setOverall] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const busyRef = useRef(false);

  const canAnalyze = useMemo(() => items.length > 0 && step === 'idle', [items, step]);

  // ------ picking helpers ------
  const requestLibraryPerms = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow photo access to continue.');
      return false;
    }
    return true;
  }, []);

  const requestCameraPerms = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow camera access to continue.');
      return false;
    }
    return true;
  }, []);

  const addOptimized = useCallback(async (localUri: string) => {
    const optimized = await optimizeImage(localUri);
    setItems(prev => {
      if (prev.length >= MAX_IMAGES) return prev;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      return [
        ...prev,
        { id, uri: optimized, rawUri: localUri, progress: 0, status: 'ready' },
      ];
    });
  }, []);

  const pickFromLibrary = useCallback(async () => {
    try {
      if (!(await requestLibraryPerms())) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        // iOS supports multi-select; Android ignores and returns single
        allowsMultipleSelection: true,
        selectionLimit: MAX_IMAGES,
      });

      if (!result.canceled) {
        const remaining = MAX_IMAGES - items.length;
        const chosen = result.assets.slice(0, remaining);
        for (const asset of chosen) {
          await addOptimized(asset.uri);
        }
        // focus the first newly added
        if (chosen.length > 0) setSelectedIndex(items.length);
      }
    } catch (e) {
      console.error('Pick error', e);
      Alert.alert('Error', 'Unable to select image(s).');
    }
  }, [addOptimized, items.length, requestLibraryPerms]);

  const takePhoto = useCallback(async () => {
    try {
      if (!(await requestCameraPerms())) return;
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (!result.canceled && result.assets.length > 0) {
        await addOptimized(result.assets[0].uri);
        setSelectedIndex(items.length);
      }
    } catch (e) {
      console.error('Camera error', e);
      Alert.alert('Error', 'Unable to take photo.');
    }
  }, [addOptimized, items.length, requestCameraPerms]);

  const removeAt = useCallback((index: number) => {
    if (busyRef.current) return;
    setItems(prev => {
      const next = prev.slice();
      next.splice(index, 1);
      return next;
    });
    setSelectedIndex(i => Math.max(0, Math.min(i, items.length - 2)));
  }, [items.length]);

  const replaceAt = useCallback(async (index: number) => {
    if (!(await requestLibraryPerms())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      const optimized = await optimizeImage(result.assets[0].uri);
      setItems(prev => {
        const copy = prev.slice();
        copy[index] = {
          ...copy[index],
          uri: optimized,
          rawUri: result.assets[0].uri,
          progress: 0,
          status: 'ready',
          url: undefined,
          error: undefined,
        };
        return copy;
      });
    }
  }, [requestLibraryPerms]);

  // ------ analyze helpers ------
  const computeOverall = useCallback((arr: PhotoItem[], phase: Step) => {
    // Map phases to weight: Upload ~0..0.8, Analyze bumps to 1.0
    const avg = arr.length
      ? arr.reduce((s, it) => s + it.progress, 0) / arr.length
      : 0;
    if (phase === 'uploading') return Math.min(0.8, avg * 0.8);
    if (phase === 'analyzing') return Math.max(0.85, avg * 0.8);
    return 0;
  }, []);

  const uploadOne = useCallback(async (index: number) => {
    const item = items[index];
    if (!item) return;

    setItems(prev => {
      const copy = prev.slice();
      copy[index] = { ...copy[index], status: 'uploading', progress: 0 };
      return copy;
    });

    try {
      const url = await uploadToFirebase(item.uri, (p: number) => {
        setItems(prev => {
          const copy = prev.slice();
          if (copy[index]) copy[index] = { ...copy[index], progress: p };
          return copy;
        });
        setOverall(prevOverall =>
          computeOverall(
            // pass a temp array reflecting this progress change
            items.map((it, i) =>
              i === index ? { ...it, progress: p } : it
            ),
            'uploading'
          )
        );
      });

      setItems(prev => {
        const copy = prev.slice();
        if (copy[index]) copy[index] = { ...copy[index], status: 'uploaded', url, progress: 1 };
        return copy;
      });
    } catch (e: any) {
      console.error('Upload failed', e);
      setItems(prev => {
        const copy = prev.slice();
        if (copy[index]) copy[index] = { ...copy[index], status: 'error', error: e?.message || 'Upload failed' };
        return copy;
      });
    }
  }, [computeOverall, items, setItems]);

  const uploadAll = useCallback(async () => {
    setStep('uploading');
    setError(null);
    busyRef.current = true;
    setOverall(0);

    // Upload sequentially for more predictable progress (or flip to Promise.all)
    for (let i = 0; i < items.length; i++) {
      if (items[i].status !== 'uploaded') {
        // eslint-disable-next-line no-await-in-loop
        await uploadOne(i);
      }
    }
  }, [items, uploadOne]);

  const analyzeUrls = useCallback(async (urls: string[]) => {
    setStep('analyzing');
    setOverall(0.9);

    // Option A: batch by concatenating results
    const results: string[] = [];

    // We’ll call the same endpoint per image and aggregate.
    for (let i = 0; i < urls.length; i++) {
      const res = await fetch(ANALYZE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: urls[i],
          prompt:
            'Give me personalized feedback for improving my dating app profile based on this photo.',
        }),
      });

      const raw = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(raw);
      } catch {
        console.error('Non-JSON from backend:', raw);
        throw new Error('Backend returned an unexpected response.');
      }

      if (!res.ok) {
        const msg = data?.error || 'Analysis failed';
        throw new Error(msg);
      }
      results.push(`Photo ${i + 1}:\n${data?.result ?? 'No feedback.'}`);
      setOverall(0.9 + (0.1 * (i + 1)) / urls.length);
    }

    busyRef.current = false;
    setStep('idle');
    setOverall(1);

    router.push({
      pathname: '/results',
      params: { feedback: results.join('\n\n') },
    });
  }, [router]);

  const onAnalyzeAll = useCallback(async () => {
    if (!items.length || busyRef.current) return;
    try {
      // 1) Ensure all uploaded
      await uploadAll();
      const urls = items.map(i => i.url).filter(Boolean) as string[];
      if (!urls.length) throw new Error('No uploads completed.');
      // 2) Analyze all
      await analyzeUrls(urls);
    } catch (e: any) {
      console.error('Analyze all failed', e);
      setError(e?.message || 'Something went wrong. Please try again.');
      setStep('idle');
      busyRef.current = false;
    }
  }, [analyzeUrls, items, uploadAll]);

  const onAnalyzeSelected = useCallback(async () => {
    if (!items.length || busyRef.current) return;
    const idx = selectedIndex;
    try {
      setError(null);
      busyRef.current = true;

      // Upload only selected if needed
      if (items[idx].status !== 'uploaded') {
        setStep('uploading');
        await uploadOne(idx);
      }
      const url = items[idx].url;
      if (!url) throw new Error('Upload did not return a URL.');

      await analyzeUrls([url]);
    } catch (e: any) {
      console.error('Analyze selected failed', e);
      setError(e?.message || 'Something went wrong. Please try again.');
      setStep('idle');
      busyRef.current = false;
    }
  }, [analyzeUrls, items, selectedIndex, uploadOne]);

  const clearAll = useCallback(() => {
    if (busyRef.current) return;
    setItems([]);
    setSelectedIndex(0);
    setOverall(0);
    setError(null);
    setStep('idle');
  }, []);

  // ------ UI ------
  const renderCarouselItem = ({ item }: { item: PhotoItem }) => (
    <View style={styles.slide}>
      <Image source={{ uri: item.uri }} style={styles.image} />
      <View style={styles.perImageProgressWrap}>
        {(item.status === 'uploading' || item.status === 'error') && (
          <>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${(item.progress || 0) * 100}%` }]} />
            </View>
            {item.status === 'error' && <Text style={styles.errorBadge}>Upload failed</Text>}
          </>
        )}
      </View>
    </View>
  );

  const PlaceHolderThumb = ({ onPress }: { onPress: () => void }) => (
    <Pressable onPress={onPress} style={[styles.thumb, styles.thumbPlaceholder]}>
      <Text style={{ color: '#9ca3af', fontWeight: '600' }}>+</Text>
      <Text style={{ color: '#9ca3af', fontSize: 10, marginTop: 2 }}>Add</Text>
    </Pressable>
  );

  const canAddMore = items.length < MAX_IMAGES;

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

        <View style={styles.container}>
          <Text style={styles.title}>Upload Photos</Text>
        <Text style={styles.subtitle}>
          Add up to {MAX_IMAGES} photos. Analyze all or pick your best.
        </Text>

        <View style={styles.card}>
          {/* Empty state */}
          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.hint}>Choose photo(s) to get started</Text>
              <View style={styles.row}>
                <PrimaryButton label="Pick from Library" onPress={pickFromLibrary} />
                <PrimaryButton label="Use Camera" onPress={takePhoto} variant="ghost" />
              </View>
            </View>
          ) : (
            <>
              {/* Carousel */}
              <FlatList
                data={items}
                keyExtractor={(it) => it.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToAlignment="center"
                decelerationRate="fast"
                renderItem={renderCarouselItem}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
                  setSelectedIndex(idx);
                }}
              />

              {/* Thumbs + placeholders */}
              <View style={styles.thumbRow}>
                {items.map((it, i) => (
                  <Pressable
                    key={it.id}
                    onPress={() => setSelectedIndex(i)}
                    style={[
                      styles.thumb,
                      i === selectedIndex && styles.thumbActive,
                    ]}
                  >
                    <Image source={{ uri: it.uri }} style={styles.thumbImg} />
                  </Pressable>
                ))}
                {canAddMore &&
                  Array.from({ length: MAX_IMAGES - items.length }).map((_, i) => (
                    <PlaceHolderThumb key={`ph-${i}`} onPress={pickFromLibrary} />
                  ))}
              </View>

              {/* Actions */}
              <View style={styles.actionsRow}>
                <PrimaryButton label="Replace" onPress={() => replaceAt(selectedIndex)} variant="ghost" />
                <PrimaryButton label="Remove" onPress={() => removeAt(selectedIndex)} variant="danger" />
              </View>

              <View style={styles.actionsRow}>
                <PrimaryButton
                  label="Analyze Selected"
                  onPress={onAnalyzeSelected}
                  disabled={!canAnalyze}
                  loading={step !== 'idle'}
                />
                <PrimaryButton
                  label="Analyze All"
                  onPress={onAnalyzeAll}
                  variant="ghost"
                  disabled={!canAnalyze}
                  loading={step !== 'idle'}
                />
              </View>

              <PrimaryButton label="Add More" onPress={pickFromLibrary} variant="ghost" />

              {!!error && <Text style={styles.errorText}>{error}</Text>}

              {step !== 'idle' && (
                <View style={styles.progressWrap}>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${overall * 100}%` }]} />
                  </View>
                  <Text style={styles.progressLabel}>
                    {step === 'uploading' ? 'Uploading…' : 'Analyzing…'}
                  </Text>
                  <ActivityIndicator style={{ marginTop: 8 }} />
                </View>
              )}
            </>
          )}
        </View>

          <View style={styles.footerRow}>
            <PrimaryButton label="Clear All" onPress={clearAll} variant="ghost" />
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ---- helpers ----
async function optimizeImage(uri: string): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1280 } }],
      { compress: 0.72, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch (e) {
    console.warn('Image optimize failed, using original:', e);
    return uri;
  }
}

function PrimaryButton({
  label,
  onPress,
  disabled,
  variant = 'solid',
  loading = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'solid' | 'ghost' | 'danger';
  loading?: boolean;
}) {
  const style = [
    styles.btn,
    variant === 'ghost' && styles.btnGhost,
    variant === 'danger' && styles.btnDanger,
    disabled && styles.btnDisabled,
  ];
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [style, pressed && styles.btnPressed]}>
      <Text style={styles.btnText}>
        {loading ? (Platform.OS === 'ios' ? '…' : '...') : label}
      </Text>
    </Pressable>
  );
}

// ---- styles ----
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
    flex: 1,
    padding: 20,
    paddingTop: 64,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 16,
  },
  title: { color: 'white', fontSize: 24, fontWeight: '700', letterSpacing: 0.2 },
  subtitle: { color: '#cbd5e1', fontSize: 14, textAlign: 'center', maxWidth: 360 },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  emptyState: { alignItems: 'center', gap: 14, paddingVertical: 12 },
  row: { flexDirection: 'row', gap: 12 },
  hint: { color: '#e5e7eb', opacity: 0.8, fontSize: 14 },

  slide: { width: SCREEN_W - 40, alignItems: 'center' },
  image: { width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#0b1020' },
  perImageProgressWrap: { marginTop: 8, width: '100%' },

  thumbRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  thumb: {
    width: 56, height: 56, borderRadius: 8, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  thumbActive: { borderColor: '#60a5fa', borderWidth: 2 },
  thumbImg: { width: '100%', height: '100%' },
  thumbPlaceholder: { backgroundColor: 'rgba(255,255,255,0.06)' },

  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },

  progressWrap: { marginTop: 12, alignItems: 'center' },
  progressBarBg: {
    height: 8, width: '100%', borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: '#60a5fa' },
  progressLabel: { color: '#e5e7eb', fontSize: 12, marginTop: 6 },

  errorBadge: {
    marginTop: 6, alignSelf: 'flex-start', color: '#fecaca',
    backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.4)',
    borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, fontSize: 12,
  },
  errorText: {
    color: '#fecaca', backgroundColor: 'rgba(239,68,68,0.12)',
    borderColor: 'rgba(239,68,68,0.4)', borderWidth: StyleSheet.hairlineWidth,
    padding: 8, borderRadius: 8, marginTop: 10,
  },

  footerRow: { marginTop: 12, alignSelf: 'stretch' },

  btn: {
    flex: 1, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12,
    backgroundColor: '#60a5fa', alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.18)',
  },
  btnGhost: { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.25)' },
  btnDanger: { backgroundColor: '#ef4444' },
  btnDisabled: { opacity: 0.5 },
  btnPressed: { transform: [{ scale: 0.98 }] },
  btnText: { color: 'white', fontWeight: '600' },
});
