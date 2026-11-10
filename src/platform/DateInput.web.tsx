// mobile/src/platform/DateInput.web.tsx
// Campo de data — versão web usando <input type="date"> nativo do navegador.
// Mantém o mesmo contrato do componente nativo: value/onChangeText em DD/MM/AAAA.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../hooks/useColors';
import { format, parse, isValid } from 'date-fns';

interface DateInputWebProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  placeholder?: string;
  testID?: string;
}

// DD/MM/AAAA -> AAAA-MM-DD (formato esperado pelo input date)
const toIsoDate = (value: string): string => {
  if (!value) return '';
  try {
    const parsed = parse(value, 'dd/MM/yyyy', new Date());
    return isValid(parsed) ? format(parsed, 'yyyy-MM-dd') : '';
  } catch {
    return '';
  }
};

// AAAA-MM-DD -> DD/MM/AAAA (formato usado pelo resto do app)
const toBrazilianDate = (iso: string): string => {
  if (!iso) return '';
  try {
    const parsed = parse(iso, 'yyyy-MM-dd', new Date());
    return isValid(parsed) ? format(parsed, 'dd/MM/yyyy') : '';
  } catch {
    return '';
  }
};

export const DateInput: React.FC<DateInputWebProps> = ({
  label,
  value,
  onChangeText,
  error,
  testID,
}) => {
  const colors = useColors();
  const textColor = colors.background === '#F8F9FA' ? '#000000' : colors.text;

  const handleChange = (event: any) => {
    onChangeText(toBrazilianDate(event.target.value));
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={[styles.label, { color: colors.text }]}>{label}</Text> : null}

      {React.createElement('input' as any, {
        type: 'date',
        value: toIsoDate(value),
        onChange: handleChange,
        'data-testid': testID ? `${testID}-input` : undefined,
        'aria-label': label || 'Data',
        style: {
          width: '100%',
          height: 48,
          paddingLeft: 16,
          paddingRight: 16,
          fontSize: 16,
          fontFamily: 'inherit',
          color: textColor,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: error ? colors.error || '#DC2626' : colors.border,
          borderRadius: 12,
          outline: 'none',
          boxSizing: 'border-box',
        } as any,
      })}

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
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});
