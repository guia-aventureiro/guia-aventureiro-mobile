// Utilitário para formatar valores em Real brasileiro
export function formatBRL(value: number | string) {
  let num =
    typeof value === 'string' ? Number(value.toString().replace(/[^\d]/g, '')) / 100 : value;
  if (isNaN(num)) num = 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { useColors } from '../hooks/useColors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  testID?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  testID,
  style,
  editable = true,
  ...props
}) => {
  const colors = useColors();

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={[styles.label, { color: colors.text }]}>{label}</Text> : null}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.error || '#DC2626' : colors.border,
            color: colors.text,
          },
          editable === false && {
            backgroundColor: colors.border + '30',
            opacity: 0.8,
          },
          style,
        ]}
        placeholderTextColor={colors.textSecondary}
        editable={editable}
        testID={testID}
        accessibilityLabel={testID}
        {...props}
      />
      {error ? (
        <Text style={[styles.errorText, { color: colors.error || '#DC2626' }]}>{error}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputError: {
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
});
