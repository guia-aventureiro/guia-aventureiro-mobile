// mobile/src/components/Button.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useColors } from '../hooks/useColors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'accent';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  testID,
}) => {
  const colors = useColors();

  const buttonStyle = [
    styles.button,
    { backgroundColor: colors.primary },
    variant === 'outline' && [
      styles.buttonOutline,
      { borderColor: colors.primary, backgroundColor: 'transparent' },
    ],
    variant === 'accent' && { backgroundColor: colors.accent || colors.primary },
    (disabled || loading) && styles.buttonDisabled,
    style,
  ];

  const textStyleCombined = [
    styles.buttonText,
    { color: colors.white },
    variant === 'outline' && { color: colors.primary },
    variant === 'accent' && { color: colors.white },
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      testID={testID}
      accessibilityLabel={testID}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.white} />
      ) : (
        <Text style={textStyleCombined}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    // backgroundColor aplicado dinamicamente
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    // borderColor aplicado dinamicamente
  },
  buttonAccent: {
    // backgroundColor aplicado dinamicamente
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    // color aplicado dinamicamente
    fontSize: 16,
    fontWeight: '600',
  },
  buttonOutlineText: {
    // color aplicado dinamicamente
  },
  buttonAccentText: {
    // color aplicado dinamicamente
  },
});
