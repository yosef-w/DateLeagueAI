import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
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

  // Already signed in? Jump ahead.
  useEffect(() => {
    if (auth.currentUser) next();
  }, [next]);

  const [isLoadingApple, setIsLoadingApple] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  const [, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: 'YOUR_GOOGLE_CLIENT_ID', // replace with your OAuth client ID
  });

  useEffect(() => {
    const go = async () => {
      if (response?.type === 'success') {
        try {
          setIsLoadingGoogle(true);
          const idToken = (response.params as any)?.id_token;
          if (!idToken) throw new Error('No Google id_token');
          const credential = GoogleAuthProvider.credential(idToken);
          await signInWithCredential(auth, credential);
          next();
        } catch (err) {
          Alert.alert('Error', 'Google sign-in failed');
        } finally {
          setIsLoadingGoogle(false);
        }
      }
    };
    go();
  }, [response, next]);

  const onGoogle = async () => {
    try {
      setIsLoadingGoogle(true);
      await promptAsync();
    } catch {
      setIsLoadingGoogle(false);
    }
  };

  const onApple = async () => {
    try {
      setIsLoadingApple(true);
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
      if (e?.code !== 'ERR_CANCELED') {
        Alert.alert('Error', 'Apple sign-in failed');
      }
    } finally {
      setIsLoadingApple(false);
    }
  };

  const disabled = isLoadingApple || isLoadingGoogle;

  return (
    <LinearGradient colors={['#0f172a', '#0b1324']} style={styles.screen}>
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

        {/* Vertically centered content */}
        <View style={[styles.centerWrap, { paddingBottom: insets.bottom + 24 }]}>
          <Text style={styles.title}>Sign in to continue</Text>
          <Text style={styles.subtitle}>
            Save your progress, sync across devices, and get faster recommendations.
          </Text>

          {/* extra spacing under the title */}
          <View style={{ height: 16 }} />

          {/* Glass card */}
          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <BrandBlueButton
              label="Sign in with Apple"
              icon="logo-apple"
              onPress={onApple}
              loading={isLoadingApple}
              disabled={disabled}
              darkIcon
            />
            <BrandBlueButton
              label="Sign in with Google"
              icon="logo-google"
              onPress={onGoogle}
              loading={isLoadingGoogle}
              disabled={disabled}
              darkIcon
            />
          </LinearGradient>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ---------------- Reusable App-Blue Brand Button ---------------- */
function BrandBlueButton({
  label,
  icon,
  onPress,
  loading,
  disabled,
  darkIcon = true,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  darkIcon?: boolean; // keeps icon dark enough for AA contrast on white chip
}) {
  const iconColor = darkIcon ? '#0b2447' : '#111827';
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Haptics.selectionAsync()}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btnBlue,
        pressed && styles.btnPressed,
        (disabled || loading) && styles.btnDisabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.btnContent}>
        <View style={styles.brandChip}>
          <Ionicons name={icon} size={16} color={iconColor} />
        </View>
        <Text style={styles.btnBlueText}>{label}</Text>
        {loading && <ActivityIndicator size="small" color="#0b2447" style={{ marginLeft: 8 }} />}
      </View>
    </Pressable>
  );
}

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  screen: { flex: 1 },

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

  // Vertically centered stack with some top padding
  centerWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 48, // padding above the card & below the title area
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 360,
    lineHeight: 20,
  },

  card: {
    width: '100%',
    maxWidth: 520,
    padding: 16,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  // App-blue buttons
  btnBlue: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#60a5fa',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  btnBlueText: {
    color: '#0b2447',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  btnPressed: { transform: [{ scale: 0.985 }], opacity: 0.96 },
  btnDisabled: { opacity: 0.6 },

  btnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },

  // White circular chip holding the Ionicons brand glyph
  brandChip: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
});
