import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useColors } from '../hooks/useColors';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onClose: () => void;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: 'OK', style: 'default' }],
  onClose,
}) => {
  const colors = useColors();

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.alertContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          
          {message ? (
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {message}
            </Text>
          ) : null}

          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => {
              const isDestructive = button.style === 'destructive';
              const isCancel = button.style === 'cancel';
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    buttons.length === 1 ? styles.singleButton : null,
                    isDestructive && styles.destructiveButton,
                    isCancel && { borderColor: colors.border },
                    !isCancel && !isDestructive && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => handleButtonPress(button)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isDestructive && styles.destructiveText,
                      isCancel && { color: colors.text },
                      !isCancel && !isDestructive && { color: '#FFFFFF' },
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Hook para facilitar o uso
let alertInstance: ((config: Omit<CustomAlertProps, 'visible' | 'onClose'>) => void) | null = null;

export const setAlertInstance = (
  instance: (config: Omit<CustomAlertProps, 'visible' | 'onClose'>) => void
) => {
  alertInstance = instance;
};

export const showAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[]
) => {
  if (alertInstance) {
    alertInstance({ title, message, buttons });
  }
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  singleButton: {
    // Quando há apenas um botão, ocupa toda a largura
  },
  destructiveButton: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  destructiveText: {
    color: '#FFFFFF',
  },
});
