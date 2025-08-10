import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
// eslint-disable-next-line import/no-unresolved
import * as AppleAuthentication from 'expo-apple-authentication';
// eslint-disable-next-line import/no-unresolved
import * as Google from 'expo-auth-session/providers/google';
import { signInWithCredential, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { auth } from '../firebase/config';

WebBrowser.maybeCompleteAuthSession();

export default function SsoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scores, feedback } = useLocalSearchParams<{ scores?: string; feedback?: string }>();

  const next = useCallback(() => {
    if (scores) {
      router.replace({ pathname: '/rating', params: { scores, feedback } });
    } else {
      router.replace('/upload');
    }
  }, [router, scores, feedback]);

  useEffect(() => {
    if (auth.currentUser) {
      next();
    }
  }, [next]);

  const [, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: 'YOUR_GOOGLE_CLIENT_ID',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = (response.params as any)?.id_token;
      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken);
        signInWithCredential(auth, credential)
          .then(next)
          .catch(() => {
            Alert.alert('Error', 'Google sign-in failed');
          });
      }
    }
  }, [response, next]);

  const onGoogle = async () => {
    await promptAsync();
  };

  const onApple = async () => {
    try {
      const res = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!res.identityToken) throw new Error('No identity token');
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({ idToken: res.identityToken });
      await signInWithCredential(auth, credential);
      next();
    } catch (e: any) {
      if (e.code === 'ERR_CANCELED') return;
      Alert.alert('Error', 'Apple sign-in failed');
    }
  };

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

        <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={styles.title}>Sign in to continue</Text>
          <View style={styles.actions}>
            <PrimaryButton label="Sign in with Apple" onPress={onApple} />
            <PrimaryButton label="Sign in with Google" onPress={onGoogle} />
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Haptics.selectionAsync()}
      style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
    >
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 0.2,
  },
  actions: {
    gap: 16,
  },
  btn: {
    backgroundColor: '#60a5fa',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnPressed: { opacity: 0.95, transform: [{ scale: 0.98 }] },
  btnText: {
    color: '#0b2447',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  backBtn: {
    position: 'absolute',
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

