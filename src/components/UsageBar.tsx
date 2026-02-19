// mobile/src/components/UsageBar.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useColors } from '../hooks/useColors';
import { Ionicons } from '@expo/vector-icons';

interface UsageBarProps {
  label: string;
  current: number;
  limit: number;
  icon?: keyof typeof Ionicons.glyphMap;
  unlimited?: boolean;
  showUpgrade?: boolean;
  onUpgrade?: () => void;
  unit?: string;
}

export const UsageBar: React.FC<UsageBarProps> = ({
  label,
  current,
  limit,
  icon = 'stats-chart',
  unlimited = false,
  showUpgrade = false,
  onUpgrade,
  unit = '',
}) => {
  const colors = useColors();

  const percentage = unlimited ? 0 : Math.min((current / limit) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  const getBarColor = () => {
    if (unlimited) return colors.success;
    if (isAtLimit) return colors.error;
    if (isNearLimit) return colors.warning;
    return colors.primary;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          <Ionicons name={icon} size={20} color={colors.text} />
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        </View>
        {showUpgrade && onUpgrade && (
          <TouchableOpacity onPress={onUpgrade} style={styles.upgradeButton}>
            <Ionicons name="arrow-up-circle" size={18} color={colors.primary} />
            <Text style={[styles.upgradeText, { color: colors.primary }]}>Upgrade</Text>
          </TouchableOpacity>
        )}
      </View>

      {unlimited ? (
        <View style={styles.unlimitedContainer}>
          <Ionicons name="infinite" size={24} color={colors.success} />
          <Text style={[styles.unlimitedText, { color: colors.success }]}>Ilimitado</Text>
        </View>
      ) : (
        <>
          <View style={styles.statsContainer}>
            <Text style={[styles.current, { color: isAtLimit ? colors.error : colors.text }]}>
              {current}{unit}
            </Text>
            <Text style={[styles.divider, { color: colors.textSecondary }]}>/</Text>
            <Text style={[styles.limit, { color: colors.textSecondary }]}>
              {limit}{unit}
            </Text>
            <Text style={[styles.percentage, { color: getBarColor() }]}>
              ({percentage.toFixed(0)}%)
            </Text>
          </View>

          <View style={[styles.barContainer, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${percentage}%`,
                  backgroundColor: getBarColor(),
                },
              ]}
            />
          </View>

          {isNearLimit && !isAtLimit && (
            <View style={styles.warningContainer}>
              <Ionicons name="warning" size={14} color={colors.warning} />
              <Text style={[styles.warningText, { color: colors.warning }]}>
                Você está chegando no limite!
              </Text>
            </View>
          )}

          {isAtLimit && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={14} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>
                Limite atingido!
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  upgradeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  unlimitedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  unlimitedText: {
    fontSize: 15,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  current: {
    fontSize: 20,
    fontWeight: '700',
  },
  divider: {
    fontSize: 16,
    fontWeight: '400',
  },
  limit: {
    fontSize: 16,
    fontWeight: '400',
  },
  percentage: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  barContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
