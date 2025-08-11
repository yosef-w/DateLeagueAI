import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View, StyleProp, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';

interface Props {
  label: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  disabled?: boolean;
  variant?: 'solid' | 'ghost';
  style?: StyleProp<ViewStyle>;
}

export default function PrimaryButton({
  label,
  onPress,
  icon,
  loading,
  disabled,
  variant = 'solid',
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Haptics.selectionAsync()}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        variant === 'ghost' && styles.btnGhost,
        pressed && styles.btnPressed,
        (disabled || loading) && styles.btnDisabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.content}>
        {icon && (
          <Ionicons
            name={icon}
            size={16}
            color={variant === 'ghost' ? '#e5e7eb' : '#ffffff'}
            style={{ marginRight: 8 }}
          />
        )}
        <Text style={variant === 'ghost' ? styles.textGhost : styles.text}>{label}</Text>
        {loading && (
          <ActivityIndicator
            size="small"
            color={variant === 'ghost' ? '#e5e7eb' : '#ffffff'}
            style={{ marginLeft: 8 }}
          />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#60a5fa',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.25)',
  },
  btnPressed: { transform: [{ scale: 0.98 }] },
  btnDisabled: { opacity: 0.5 },
  text: { color: 'white', fontWeight: '700', fontSize: 16 },
  textGhost: { color: '#e5e7eb', fontWeight: '700', fontSize: 16 },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});

