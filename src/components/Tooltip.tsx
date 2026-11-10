// mobile/src/components/Tooltip.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useColors } from '../hooks/useColors';

const { width, height } = Dimensions.get('window');

interface TooltipProps {
  visible: boolean;
  message: string;
  targetPosition?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  position?: 'top' | 'bottom' | 'center';
  onClose: () => void;
  buttonText?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  visible,
  message,
  targetPosition,
  position = 'bottom',
  onClose,
  buttonText = 'Entendi',
}) => {
  const colors = useColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible]);

  if (!visible) return null;

  const getTooltipPosition = () => {
    if (!targetPosition) {
      // Posição central padrão
      return {
        top: height / 2 - 100,
        left: 20,
        right: 20,
      };
    }

    const { x, y, width: targetWidth, height: targetHeight } = targetPosition;
    const tooltipWidth = width - 40; // 20px padding em cada lado
    const tooltipHeight = 150; // Estimativa

    if (position === 'bottom') {
      return {
        top: y + targetHeight + 16,
        left: Math.max(20, Math.min(x - tooltipWidth / 2 + targetWidth / 2, width - tooltipWidth - 20)),
      };
    } else if (position === 'top') {
      return {
        top: y - tooltipHeight - 16,
        left: Math.max(20, Math.min(x - tooltipWidth / 2 + targetWidth / 2, width - tooltipWidth - 20)),
      };
    } else {
      return {
        top: height / 2 - 100,
        left: 20,
        right: 20,
      };
    }
  };

  const renderSpotlight = () => {
    if (!targetPosition) return null;

    const { x, y, width: targetWidth, height: targetHeight } = targetPosition;
    const spotlightPadding = 8;

    return (
      <View style={StyleSheet.absoluteFill}>
        {/* Top overlay */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: y - spotlightPadding,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
          }}
        />
        {/* Left overlay */}
        <View
          style={{
            position: 'absolute',
            top: y - spotlightPadding,
            left: 0,
            width: x - spotlightPadding,
            height: targetHeight + spotlightPadding * 2,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
          }}
        />
        {/* Right overlay */}
        <View
          style={{
            position: 'absolute',
            top: y - spotlightPadding,
            left: x + targetWidth + spotlightPadding,
            right: 0,
            height: targetHeight + spotlightPadding * 2,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
          }}
        />
        {/* Bottom overlay */}
        <View
          style={{
            position: 'absolute',
            top: y + targetHeight + spotlightPadding,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
          }}
        />
        {/* Spotlight border */}
        <View
          style={{
            position: 'absolute',
            top: y - spotlightPadding,
            left: x - spotlightPadding,
            width: targetWidth + spotlightPadding * 2,
            height: targetHeight + spotlightPadding * 2,
            borderRadius: 12,
            borderWidth: 3,
            borderColor: colors.primary,
          }}
        />
      </View>
    );
  };

  const tooltipPosition = getTooltipPosition();

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Spotlight effect */}
        {renderSpotlight()}

        {/* Tooltip card */}
        <Animated.View
          style={[
            styles.tooltipCard,
            { backgroundColor: colors.card },
            tooltipPosition,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Arrow indicator */}
          {targetPosition && position === 'bottom' && (
            <View style={[styles.arrowTop, { borderBottomColor: colors.card }]} />
          )}
          {targetPosition && position === 'top' && (
            <View style={[styles.arrowBottom, { borderTopColor: colors.card }]} />
          )}

          <Text style={[styles.message, { color: colors.text }]}>{message}</Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>{buttonText}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  tooltipCard: {
    position: 'absolute',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  arrowTop: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  arrowBottom: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
