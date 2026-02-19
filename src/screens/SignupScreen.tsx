// mobile/src/screens/SignupScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useColors } from '../hooks/useColors';
import { validatePasswordStrength, getPasswordStrengthColor, getPasswordStrengthLabel } from '../utils/passwordValidator';

export const SignupScreen = ({ navigation }: any) => {
  const colors = useColors();
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [], isValid: false });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const validate = () => {
    let valid = true;
    const newErrors = { name: '', email: '', password: '', confirmPassword: '' };

    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório';
      valid = false;
    }

    if (!email.trim()) {
      newErrors.email = 'Email é obrigatório';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email inválido';
      valid = false;
    }

    if (!password) {
      newErrors.password = 'Senha é obrigatória';
      valid = false;
    } else {
      const strength = validatePasswordStrength(password);
      if (!strength.isValid) {
        newErrors.password = strength.feedback[0] || 'Senha muito fraca';
        valid = false;
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirme sua senha';
      valid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    const strength = validatePasswordStrength(text);
    setPasswordStrength(strength);
  };

  const handleSignup = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await signup(name.trim(), email.trim(), password);
    } catch (error) {
      // Erro já tratado no AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>✈️</Text>
          <Text style={[styles.title, { color: colors.text }]}>Guia do Aventureiro</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Crie sua conta</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Nome completo"
            placeholder="Seu nome"
            value={name}
            onChangeText={setName}
            error={errors.name}
            autoCapitalize="words"
          />

          <Input
            label="Email"
            placeholder="seu@email.com"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="Senha"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChangeText={handlePasswordChange}
            error={errors.password}
            secureTextEntry
            autoCapitalize="none"
          />

          {password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthHeader}>
                <Text style={[styles.strengthLabel, { color: colors.textSecondary }]}>
                  Força da senha:
                </Text>
                <Text style={[styles.strengthValue, { color: getPasswordStrengthColor(passwordStrength.score) }]}>
                  {getPasswordStrengthLabel(passwordStrength.score)}
                </Text>
              </View>
              <View style={styles.strengthBar}>
                {[0, 1, 2, 3, 4].map((level) => (
                  <View
                    key={level}
                    style={[
                      styles.strengthBarSegment,
                      {
                        backgroundColor:
                          level <= passwordStrength.score
                            ? getPasswordStrengthColor(passwordStrength.score)
                            : colors.border,
                      },
                    ]}
                  />
                ))}
              </View>
              {passwordStrength.feedback.length > 0 && (
                <View style={styles.feedbackContainer}>
                  {passwordStrength.feedback.slice(0, 2).map((feedback, index) => (
                    <Text key={index} style={[styles.feedbackText, { color: colors.textSecondary }]}>
                      • {feedback}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          <Input
            label="Confirmar senha"
            placeholder="Digite novamente"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={errors.confirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <Button
            title="Criar conta"
            onPress={handleSignup}
            loading={loading}
            style={styles.signupButton}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.loginLink}
          >
            <Text style={[styles.loginText, { color: colors.textSecondary }]}>
              Já tem uma conta?{' '}
              <Text style={[styles.loginTextBold, { color: colors.primary }]}>Entrar</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    width: '100%',
  },
  signupButton: {
    marginTop: 8,
  },
  loginLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
  },
  loginTextBold: {
    fontWeight: '700',
  },
  strengthContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthLabel: {
    fontSize: 12,
  },
  strengthValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  strengthBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  strengthBarSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  feedbackContainer: {
    gap: 4,
  },
  feedbackText: {
    fontSize: 11,
  },
});