// mobile/src/components/ItineraryCard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Itinerary } from '../types';
import { useColors } from '../hooks/useColors';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StatusBadge } from './StatusBadge';

interface ItineraryCardProps {
  itinerary: Itinerary;
  onPress: () => void;
}

export const ItineraryCard: React.FC<ItineraryCardProps> = ({ itinerary, onPress }) => {
  const colors = useColors();
  const startDate = format(new Date(itinerary.startDate), 'dd MMM', { locale: ptBR });
  const endDate = format(new Date(itinerary.endDate), 'dd MMM yyyy', { locale: ptBR });
  const fallbackImage = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=200&fit=crop';

  const resolvedImageUri = useMemo(() => {
    const dynamicItinerary = itinerary as any;
    const candidates = [
      itinerary.destination?.coverImage,
      dynamicItinerary?.coverImage,
      dynamicItinerary?.photos?.[0],
      itinerary.rating?.photos?.[0],
    ];

    const firstValid = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);

    if (!firstValid) return fallbackImage;

    // Some legacy data can have http links that fail on mobile security rules.
    const normalized = firstValid.startsWith('http://') ? firstValid.replace('http://', 'https://') : firstValid;

    // Ignore broken Google photo links without a valid key.
    if (normalized.includes('maps.googleapis.com') && normalized.includes('key=undefined')) {
      return fallbackImage;
    }

    return normalized;
  }, [itinerary]);

  const [imageUri, setImageUri] = useState(resolvedImageUri);

  useEffect(() => {
    setImageUri(resolvedImageUri);
  }, [resolvedImageUri]);

  const statusLabels = {
    rascunho: 'Rascunho',
    planejando: 'Planejando',
    confirmado: 'Confirmado',
    em_andamento: 'Em andamento',
    concluido: 'Concluído',
  };

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={onPress} activeOpacity={0.7}>
      <Image
        source={{ uri: imageUri }}
        style={styles.image}
        onError={() => {
          if (imageUri !== fallbackImage) {
            setImageUri(fallbackImage);
          }
        }}
      />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {itinerary.title}
        </Text>
        <Text style={[styles.destination, { color: colors.textSecondary }]}>
          {itinerary.destination ? `${itinerary.destination.city || 'N/A'}, ${itinerary.destination.country || 'N/A'}` : 'Destino não informado'}
        </Text>
        <Text style={[styles.dates, { color: colors.textSecondary }]}>
          {startDate} - {endDate} • {itinerary.duration} dias
        </Text>
        <View style={styles.footer}>
          <StatusBadge status={itinerary.status} size="small" />
          {itinerary.generatedByAI && (
            <View style={[styles.aiBadge, { backgroundColor: colors.accent || colors.primary }]}>
              <Text style={[styles.aiText, { color: colors.text }]}>✨ IA</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 150,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  destination: {
    fontSize: 14,
    marginBottom: 8,
  },
  dates: {
    fontSize: 14,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  aiBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiText: {
    fontSize: 12,
    fontWeight: '600',
  },
});