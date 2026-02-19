// mobile/src/components/PlanBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../hooks/useColors';
import { Plan } from '../types/subscription';

interface PlanBadgeProps {
  plan: Plan;
  size?: 'small' | 'medium' | 'large';
}

export const PlanBadge: React.FC<PlanBadgeProps> = ({ plan, size = 'medium' }) => {
  const colors = useColors();

  const planConfig = {
    free: { 
      label: 'Gratuito', 
      emoji: '🆓',
      color: colors.textSecondary,
      bgColor: colors.border,
    },
    premium: { 
      label: 'Premium', 
      emoji: '⭐',
      color: '#FFB300',
      bgColor: '#FFF9E6',
    },
    pro: { 
      label: 'Pro', 
      emoji: '💎',
      color: '#7B2CBF',
      bgColor: '#F0E6FF',
    },
  };

  const config = planConfig[plan];
  const sizeStyles = {
    small: { paddingVertical: 2, paddingHorizontal: 8, fontSize: 11 },
    medium: { paddingVertical: 4, paddingHorizontal: 12, fontSize: 13 },
    large: { paddingVertical: 6, paddingHorizontal: 16, fontSize: 15 },
  };

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bgColor },
        { 
          paddingVertical: sizeStyles[size].paddingVertical,
          paddingHorizontal: sizeStyles[size].paddingHorizontal,
        },
      ]}
    >
      <Text style={[styles.badgeText, { color: config.color, fontSize: sizeStyles[size].fontSize }]}>
        {config.emoji} {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontWeight: '600',
  },
});
