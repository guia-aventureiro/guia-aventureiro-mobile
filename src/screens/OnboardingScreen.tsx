// mobile/src/screens/OnboardingScreen.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Image,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../hooks/useColors';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Bem-vindo ao Guia do Aventureiro! 🎒',
    description: 'Crie roteiros de viagem personalizados com a ajuda da inteligência artificial.',
    icon: '✨',
    color: '#005A8D', // Primary color
  },
  {
    id: '2',
    title: 'IA Inteligente 🤖',
    description:
      'Nossa IA cria roteiros completos baseados em suas preferências, orçamento e estilo de viagem.',
    icon: '🧠',
    color: '#6c5ce7',
  },
  {
    id: '3',
    title: 'Planeje Cada Detalhe 📋',
    description:
      'Organize cada dia da sua viagem com atividades, horários, locais e orçamento estimado.',
    icon: '📍',
    color: '#00b894',
  },
  {
    id: '4',
    title: 'Modo Offline 📴',
    description: 'Acesse seus roteiros mesmo sem internet. Perfeito para quando estiver viajando!',
    icon: '💾',
    color: '#fd79a8',
  },
  {
    id: '5',
    title: 'Compartilhe e Colabore 🤝',
    description: 'Convide amigos para planejar juntos e compartilhe seus roteiros incríveis.',
    icon: '👥',
    color: '#fdcb6e',
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const colors = useColors();

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    // Salvar preferência se usuário marcou "não mostrar novamente"
    if (dontShowAgain) {
      try {
        await AsyncStorage.setItem('@guia_aventureiro:skip_onboarding', 'true');
      } catch (error) {
        console.error('Erro ao salvar onboarding preference:', error);
        // Continua mesmo se falhar ao salvar
      }
    }
    onComplete();
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
        <Text style={styles.icon}>{item.icon}</Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{item.description}</Text>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === currentIndex
              ? styles.dotActive
              : [styles.dotInactive, { backgroundColor: colors.border }],
            index === currentIndex && { backgroundColor: slides[currentIndex].color },
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Skip button */}
      {currentIndex < slides.length - 1 && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          testID="onboarding-skip"
          accessibilityLabel="onboarding-skip"
        >
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>Pular</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(newIndex);
        }}
        scrollEnabled={true}
      />

      {/* Footer */}
      <View style={styles.footer}>
        {/* Toggle para não mostrar novamente */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            gap: 10,
          }}
        >
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>Não mostrar novamente</Text>
          <Switch
            value={dontShowAgain}
            onValueChange={setDontShowAgain}
            trackColor={{ false: colors.border, true: slides[currentIndex].color + '80' }}
            thumbColor={dontShowAgain ? slides[currentIndex].color : colors.card}
            testID="onboarding-toggle"
            accessibilityLabel="onboarding-toggle"
          />
        </View>

        {renderDots()}

        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: slides[currentIndex].color }]}
          onPress={handleNext}
          testID="onboarding-next"
          accessibilityLabel="onboarding-next"
        >
          <Text style={styles.nextButtonText}>
            {currentIndex === slides.length - 1 ? 'Começar' : 'Próximo'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor aplicado dinamicamente
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  skipText: {
    // color aplicado dinamicamente
    fontSize: 16,
    fontWeight: '600',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  icon: {
    fontSize: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    // color aplicado dinamicamente
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    // color aplicado dinamicamente
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  dotActive: {
    width: 30,
  },
  dotInactive: {
    // backgroundColor aplicado dinamicamente
  },
  nextButton: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
