// mobile/src/screens/MapScreen.tsx
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useColors } from '../hooks/useColors';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import mapService, { ItineraryMapData, DayMapData, MapPoint } from '../services/mapService';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const CATEGORY_COLORS: { [key: string]: string } = {
  hospedagem: '#FF6B6B',
  alimentacao: '#4ECDC4',
  transporte: '#FFE66D',
  passeios: '#95E1D3',
  atracao: '#95E1D3',
  compras: '#F38181',
  outros: '#AA96DA',
  outro: '#AA96DA',
};

const CATEGORY_ICONS: { [key: string]: string } = {
  hospedagem: '🏨',
  alimentacao: '🍽️',
  transporte: '🚗',
  passeios: '🎫',
  atracao: '🎭',
  compras: '🛍️',
  outros: '💰',
  outro: '📍',
};

export const MapScreen = ({ route, navigation }: any) => {
  const { itineraryId, title, dayNumber } = route.params;
  const colors = useColors();
  const { toast, hideToast, error: showError } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState<ItineraryMapData | DayMapData | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [showFullMap, setShowFullMap] = useState(!dayNumber);
  
  const mapRef = useRef<MapView>(null);

  const loadMapData = useCallback(async () => {
    try {
      setLoading(true);
      let data;
      
      if (showFullMap) {
        data = await mapService.getItineraryMap(itineraryId);
      } else if (dayNumber) {
        data = await mapService.getDayMap(itineraryId, dayNumber);
      }
      
      setMapData(data);
      
      // Centralizar mapa
      if (data && data.center && mapRef.current) {
        setTimeout(() => {
          mapRef.current?.animateToRegion({
            latitude: data.center.lat,
            longitude: data.center.lng,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          }, 1000);
        }, 500);
      }
    } catch (error: any) {
      showError(error.message || 'Erro ao carregar mapa');
    } finally {
      setLoading(false);
    }
  }, [itineraryId, dayNumber, showFullMap]);

  useFocusEffect(
    useCallback(() => {
      loadMapData();
    }, [loadMapData])
  );

  const renderMarkers = () => {
    if (!mapData || !mapData.points) return null;

    return mapData.points.map((point, index) => {
      const icon = CATEGORY_ICONS[point.category || 'outro'];
      const color = CATEGORY_COLORS[point.category || 'outro'];

      return (
        <Marker
          key={point.id}
          coordinate={{
            latitude: point.coordinates.lat,
            longitude: point.coordinates.lng,
          }}
          title={`${index + 1}. ${point.title}`}
          description={point.location}
          pinColor={color}
          onPress={() => setSelectedPoint(point)}
        >
          <View style={[styles.markerContainer, { backgroundColor: color }]}>
            <Text style={styles.markerNumber}>{index + 1}</Text>
          </View>
        </Marker>
      );
    });
  };

  const renderRoutes = () => {
    if (!mapData) return null;

    let routes: any[] = [];
    
    if ('dayRoutes' in mapData && showFullMap) {
      // Mapa completo: todas as rotas de todos os dias
      routes = mapData.dayRoutes.flatMap(day => day.routes);
    } else if ('routes' in mapData) {
      // Mapa de um dia específico
      routes = mapData.routes;
    }

    return routes.map((route, index) => {
      const coordinates = [
        { latitude: route.from.coordinates.lat, longitude: route.from.coordinates.lng },
        { latitude: route.to.coordinates.lat, longitude: route.to.coordinates.lng },
      ];

      return (
        <Polyline
          key={`route-${index}`}
          coordinates={coordinates}
          strokeColor={colors.primary}
          strokeWidth={3}
          lineDashPattern={[5, 5]}
        />
      );
    });
  };

  const fitAllMarkers = () => {
    if (!mapData || !mapData.points || mapData.points.length === 0 || !mapRef.current) return;

    const coordinates = mapData.points.map(p => ({
      latitude: p.coordinates.lat,
      longitude: p.coordinates.lng,
    }));

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
      animated: true,
    });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!mapData || !mapData.center) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Mapa</Text>
          <View style={{ width: 30 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 64 }}>🗺️</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Nenhum ponto no mapa
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Adicione atividades com localização ao seu roteiro
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const stats = mapData.statistics;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={{ fontSize: 24 }}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Mapa</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <TouchableOpacity onPress={fitAllMarkers} style={styles.centerButton}>
          <Text style={{ fontSize: 20 }}>🎯</Text>
        </TouchableOpacity>
      </View>

      {/* Toggle View Button */}
      {dayNumber && (
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              { backgroundColor: showFullMap ? colors.primary : colors.backgroundLight },
            ]}
            onPress={() => setShowFullMap(!showFullMap)}
          >
            <Text style={[styles.toggleText, { color: showFullMap ? '#FFF' : colors.text }]}>
              {showFullMap ? 'Ver Todos os Dias' : `Ver Dia ${dayNumber}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: mapData.center.lat,
          longitude: mapData.center.lng,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        showsScale
      >
        {renderMarkers()}
        {renderRoutes()}
      </MapView>

      {/* Statistics Panel */}
      <View style={[styles.statsPanel, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <Text style={{ fontSize: 20 }}>📍</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalPoints}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pontos</Text>
        </View>
        {'totalDays' in stats && (
          <View style={styles.statItem}>
            <Text style={{ fontSize: 20 }}>📅</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalDays}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Dias</Text>
          </View>
        )}
        <View style={styles.statItem}>
          <Text style={{ fontSize: 20 }}>🚗</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.totalDistance.toFixed(1)} km
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Distância</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={{ fontSize: 20 }}>⏱️</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {Math.round(stats.totalTravelTime)} min
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tempo</Text>
        </View>
      </View>

      {/* Selected Point Details */}
      {selectedPoint && (
        <View style={[styles.detailsPanel, { backgroundColor: colors.card }]}>
          <View style={styles.detailsHeader}>
            <View style={styles.detailsLeft}>
              <Text style={{ fontSize: 28 }}>
                {CATEGORY_ICONS[selectedPoint.category || 'outro']}
              </Text>
              <View style={styles.detailsInfo}>
                <Text style={[styles.detailsTitle, { color: colors.text }]} numberOfLines={1}>
                  {selectedPoint.title}
                </Text>
                <Text style={[styles.detailsLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                  {selectedPoint.location}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setSelectedPoint(null)}>
              <Text style={[styles.closeButton, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>
          {selectedPoint.address && (
            <Text style={[styles.detailsAddress, { color: colors.textSecondary }]}>
              📍 {selectedPoint.address}
            </Text>
          )}
          <View style={styles.detailsExtras}>
            {selectedPoint.time && (
              <Text style={[styles.detailsExtra, { color: colors.textSecondary }]}>
                ⏰ {selectedPoint.time}
              </Text>
            )}
            {selectedPoint.duration && (
              <Text style={[styles.detailsExtra, { color: colors.textSecondary }]}>
                ⏱️ {selectedPoint.duration}h
              </Text>
            )}
          </View>
        </View>
      )}

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  centerButton: {
    padding: 8,
  },
  toggleContainer: {
    padding: 12,
    alignItems: 'center',
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  markerNumber: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  statsPanel: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  detailsPanel: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  detailsInfo: {
    flex: 1,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailsLocation: {
    fontSize: 14,
  },
  closeButton: {
    fontSize: 24,
    fontWeight: '300',
    marginLeft: 8,
  },
  detailsAddress: {
    fontSize: 13,
    marginBottom: 8,
  },
  detailsExtras: {
    flexDirection: 'row',
    gap: 16,
  },
  detailsExtra: {
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
