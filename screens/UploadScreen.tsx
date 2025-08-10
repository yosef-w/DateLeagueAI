import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Alert,
  Text,
  Pressable,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

const MAX_IMAGES = 6;
const NUM_COLS = 3;
const { width: SCREEN_W } = Dimensions.get('window');

type ItemStatus = 'ready' | 'uploading' | 'uploaded' | 'error';

type PhotoItem = {
  id: string;
  uri: string;          // optimized local uri
  rawUri: string;       // original local uri
  progress: number;     // 0..1 (reserved for upload)
  status: ItemStatus;
  url?: string;         // firebase URL after upload
  error?: string;
};

const BACKEND_URL = __DEV__
  ? 'http://localhost:3000/analyze'
  : 'https://<your-prod-host>/analyze';

// -------------------- Component --------------------
export default function UploadScreen(): React.ReactElement {
  // Fixed-length 6 slots; null = empty
  const [slots, setSlots] = useState<(PhotoItem | null)[]>(
    Array.from({ length: MAX_IMAGES }, () => null)
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [busy, setBusy] = useState(false); // general guard for user actions

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const busyRef = useRef(false);

  const filled = useMemo(() => slots.filter(Boolean) as PhotoItem[], [slots]);

  // ------ permissions ------
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

  // ------ utils ------
  const firstEmptyIndex = useCallback(() => slots.findIndex(s => s === null), [slots]);

  const setSlot = useCallback((index: number, item: PhotoItem | null) => {
    setSlots(prev => {
      const copy = prev.slice();
      copy[index] = item;
      return copy;
    });
  }, []);

  const optimizeAndSet = useCallback(async (index: number, localUri: string) => {
    const optimized = await optimizeImage(localUri);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setSlot(index, { id, uri: optimized, rawUri: localUri, progress: 0, status: 'ready' });
  }, [setSlot]);

  // ------ per-slot add/replace/remove ------
  const addOrReplaceAt = useCallback(async (index: number) => {
    if (busyRef.current) return;
    if (!(await requestLibraryPerms())) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      await optimizeAndSet(index, result.assets[0].uri);
      setSelectedIndex(index);
      Haptics.selectionAsync();
    }
  }, [optimizeAndSet, requestLibraryPerms]);

  const removeAt = useCallback(async (index: number) => {
    if (busyRef.current) return;
    setSlot(index, null);
    setSelectedIndex(prev => Math.max(0, Math.min(prev, MAX_IMAGES - 1)));
    Haptics.selectionAsync();
  }, [setSlot]);

  // ------ bulk add ------
  const pickFromLibraryBulk = useCallback(async () => {
    try {
      if (busyRef.current) return;
      if (!(await requestLibraryPerms())) return;

      // collect empty indices up front, so we fill deterministically
      const empties: number[] = [];
      slots.forEach((s, i) => { if (!s) empties.push(i); });
      if (empties.length === 0) {
        Alert.alert('All set', 'All six slots are filled.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsMultipleSelection: true,          // iOS multi-select; Android may return single
        selectionLimit: empties.length,         // cap to remaining capacity
      });

      if (!result.canceled) {
        busyRef.current = true;
        setBusy(true);

        const chosen = result.assets.slice(0, empties.length);
        // place sequentially into each empty slot
        for (let i = 0; i < chosen.length; i++) {
          // eslint-disable-next-line no-await-in-loop
          await optimizeAndSet(empties[i], chosen[i].uri);
        }

        // focus the first newly filled index
        if (empties.length > 0) setSelectedIndex(empties[0]);

        busyRef.current = false;
        setBusy(false);
        Haptics.selectionAsync();
      }
    } catch (e) {
      console.error('Pick error', e);
      busyRef.current = false;
      setBusy(false);
      Alert.alert('Error', 'Unable to select image(s).');
    }
  }, [optimizeAndSet, requestLibraryPerms, slots]);

  const takePhotoFillNext = useCallback(async () => {
    try {
      if (busyRef.current) return;
      if (!(await requestCameraPerms())) return;

      const idx = firstEmptyIndex();
      if (idx === -1) {
        Alert.alert('All set', 'All six slots are filled.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        await optimizeAndSet(idx, result.assets[0].uri);
        setSelectedIndex(idx);
        Haptics.selectionAsync();
      }
    } catch (e) {
      console.error('Camera error', e);
      Alert.alert('Error', 'Unable to take photo.');
    }
  }, [firstEmptyIndex, optimizeAndSet, requestCameraPerms]);

  // ------ analyze flow ------
  const getImageUrlsFromSlots = useCallback(async (items: (PhotoItem | null)[]) => {
    const filledItems = items.filter(Boolean) as PhotoItem[];
    const urls: string[] = [];
    for (const item of filledItems) {
      if (item.url) {
        urls.push(item.url);
        continue;
      }
      // Upload optimized local file to Firebase Storage and store the download URL
      const downloadURL = await uploadImageAsync(item.uri);
      urls.push(downloadURL);
      // persist the URL back into the slot (optional)
      const idx = items.findIndex(x => x?.id === item.id);
      if (idx !== -1) {
        setSlot(idx, { ...item, url: downloadURL, status: 'uploaded', progress: 1 });
      }
    }
    return urls;
  }, [setSlot]);

  const analyzePhotos = useCallback(async () => {
    try {
      if (busyRef.current) return;
      setBusy(true);
      busyRef.current = true;

      const imageUrls = await getImageUrlsFromSlots(slots);
      if (imageUrls.length === 0) {
        Alert.alert('No photos', 'Please add at least one photo.');
        return;
      }

      const prompt =
        'Give combined, concise, and specific feedback on these dating profile photos. Focus on first-impression strength, clarity, and attractiveness for swipe decisions.';

      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, imageUrls }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Analyze failed: ${res.status}`);
      }

      const data = await res.json();

      // Build sample rating categories; backend may also return `scores`
      const rating = data.scores || [
        { label: 'Photo Quality', score: 7 },
        { label: 'Bio', score: 6 },
        { label: 'Interests', score: 8 },
      ];

      // Navigate to rating screen first, then allow user to view tips
      router.push({
        pathname: '/rating',
        params: {
          feedback: data.result || '',
          scores: JSON.stringify(rating),
        },
      });
    } catch (e: any) {
      console.error('Analyze error', e);
      Alert.alert('Error', e.message || 'Unable to analyze photos.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [getImageUrlsFromSlots, slots, router]);

  return (
    <LinearGradient colors={['#0f172a', '#111827']} style={ui.screen}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Back */}
        <Pressable
          onPress={() => router.back()}
          onPressIn={() => Haptics.selectionAsync()}
          style={({ pressed }) => [
            ui.backBtn,
            { top: insets.top + 8 },
            pressed && ui.backPressed,
          ]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#e5e7eb" />
        </Pressable>

        <ScrollView contentContainerStyle={ui.container}>
          <Text style={ui.title}>Upload Photos</Text>
          <Text style={ui.subtitle}>Add up to {MAX_IMAGES} photos. Tap a slot to add or replace.</Text>

          <View style={ui.card}>
            {/* 3 × 2 grid (no huge gaps) */}
            <View style={ui.grid}>
              {slots.map((s, i) => {
                const isActive = i === selectedIndex;
                if (!s) {
                  return (
                    <Pressable
                      key={`empty-${i}`}
                      onPress={() => addOrReplaceAt(i)}
                      style={({ pressed }) => [
                        ui.tile,
                        ui.tileEmpty,
                        isActive && ui.tileActive,
                        pressed && ui.tilePressed,
                      ]}
                    >
                      <Ionicons name="add" size={26} color="#9ca3af" />
                      <Text style={ui.tileHint}>Add</Text>
                    </Pressable>
                  );
                }
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => setSelectedIndex(i)}
                    style={({ pressed }) => [
                      ui.tile,
                      isActive && ui.tileActive,
                      pressed && ui.tilePressed,
                    ]}
                  >
                    <Image source={{ uri: s.uri }} style={ui.tileImg} />
                    {/* little controls bottom-right */}
                    <View style={ui.tileControls}>
                      <Pressable onPress={() => addOrReplaceAt(i)} style={ui.ctrlBtn}>
                        <Ionicons name="swap-horizontal" size={16} color="#e5e7eb" />
                      </Pressable>
                      <Pressable onPress={() => removeAt(i)} style={ui.ctrlBtn}>
                        <Ionicons name="trash" size={16} color="#e5e7eb" />
                      </Pressable>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Actions */}
            <View style={[ui.actionsRow, { marginTop: 14 }]}>
              <PrimaryButton label="Pick from Library" onPress={pickFromLibraryBulk} />
              <PrimaryButton label="Use Camera" onPress={takePhotoFillNext} variant="ghost" />
            </View>
            <View style={[ui.actionsRow, { marginTop: 10 }]}>
              <PrimaryButton label={busy ? 'Analyzing…' : 'Analyze Photos'} onPress={analyzePhotos} disabled={busy} />
            </View>
          </View>
        </ScrollView>
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
        ui.btn,
        variant === 'ghost' && ui.btnGhost,
        pressed && ui.btnPressed,
        disabled && ui.btnDisabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[ui.btnText, variant === 'ghost' && ui.btnTextGhost]}>{label}</Text>
    </Pressable>
  );
}

// ---- Firebase upload (inlined) ----
async function uploadImageAsync(uri: string): Promise<string> {
  // Read file as blob in RN
  const blob: Blob = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = () => reject(new TypeError('Network request failed'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });

  const contentType = (blob as any).type || 'image/jpeg';
  const extension = contentType.includes('png') ? 'png' : 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const storageRef = ref(storage, `photos/${filename}`);

  await uploadBytes(storageRef, blob, { contentType });

  // @ts-ignore React Native Blob may have non-standard close
  (blob as any).close?.();

  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

// ---- styles ----
const CARD_MAX_W = 560;          // widen card a bit so tiles can be larger
const PADDING_H = 16;
const GRID_COL_GAP = 10;         // small consistent gap
const GRID_ROW_GAP = 10;
const cardWidth = Math.min(SCREEN_W - PADDING_H * 2, CARD_MAX_W);
const tileSize = Math.floor((cardWidth - GRID_COL_GAP * (NUM_COLS - 1)) / NUM_COLS);

const ui = StyleSheet.create({
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
    padding: 20,
    paddingTop: 64,
    alignItems: 'center',
    gap: 16,
  },
  title: { color: 'white', fontSize: 24, fontWeight: '700', letterSpacing: 0.2 },
  subtitle: { color: '#cbd5e1', fontSize: 14, textAlign: 'center', maxWidth: 360 },

  card: {
    width: cardWidth,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  // Grid with controlled, tight gaps
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    columnGap: GRID_COL_GAP,
    rowGap: GRID_ROW_GAP,
  },

  tile: {
    width: tileSize,
    height: tileSize,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0b1020',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tileEmpty: { backgroundColor: 'rgba(255,255,255,0.06)' },
  tileActive: { borderColor: '#60a5fa', borderWidth: 2 },
  tilePressed: { transform: [{ scale: 0.98 }] },
  tileImg: { width: '100%', height: '100%' },

  tileControls: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 999,
  },
  ctrlBtn: { paddingHorizontal: 4, paddingVertical: 2 },

  tileHint: {
    color: '#9ca3af',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },

  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },

  // Buttons
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
  btnGhost: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.25)',
  },
  btnDisabled: { opacity: 0.5 },
  btnPressed: { transform: [{ scale: 0.98 }] },
  btnText: { color: 'white', fontWeight: '600' },
  btnTextGhost: { color: '#e5e7eb' },
});
