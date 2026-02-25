// mobile/src/screens/AchievementsScreen.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../hooks/useColors';
import { BadgeItem } from '../components/BadgeItem';
import { Toast } from '../components/Toast';
import achievementService, { Achievement } from '../services/achievementService';
import { showAlert } from '../components/CustomAlert';
import { useToast } from '../hooks/useToast';

export const AchievementsScreen = ({ navigation }: any) => {
  const colors = useColors();
  const { toast, hideToast, success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const loadAchievements = useCallback(async (showLoadingIndicator = false) => {
    try {
      if (showLoadingIndicator) {
        setLoading(true);
      }
      const data = await achievementService.getMyAchievements();
      setAchievements(data.achievements);
      setTotalPoints(data.totalPoints);
      setUnlockedCount(data.unlockedCount);
      setTotalCount(data.totalCount);
    } catch (error: any) {
      console.error('Erro ao carregar conquistas:', error);
      // Não mostrar erro no catch para evitar loops
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Carregar conquistas na primeira vez que a tela é montada
  useEffect(() => {
    loadAchievements(true);
  }, [loadAchievements]);

  // NÃO recarregar automaticamente no focus - apenas quando usuário pedir
  // useFocusEffect foi removido para evitar loops

  const handleRefresh = () => {
    setRefreshing(true);
    loadAchievements(false);
  };

  const handleCheckAchievements = async () => {
    try {
      const result = await achievementService.checkAchievements();
      if (result.newAchievements.length > 0) {
        showAlert('Conquistas', `${result.newAchievements.length} nova(s) conquista(s) desbloqueada(s)!`);
        loadAchievements(false);
      } else {
        showAlert('Conquistas', 'Nenhuma nova conquista desbloqueada');
      }
    } catch (error: any) {
      showAlert('Erro', 'Erro ao verificar conquistas');
    }
  };

  const filteredAchievements = useMemo(() => {
    return achievements.filter(a => {
      if (filter === 'unlocked') return a.unlocked;
      if (filter === 'locked') return !a.unlocked;
      return true;
    });
  }, [achievements, filter]);

  const progressPercentage = useMemo(() => {
    return totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;
  }, [totalCount, unlockedCount]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colors.primary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Conquistas</Text>
        <TouchableOpacity onPress={handleCheckAchievements} style={styles.checkButton}>
          <Text style={styles.checkButtonIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        {/* Resumo */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={[styles.pointsText, { color: colors.primary }]}>{totalPoints}</Text>
              <Text style={[styles.pointsLabel, { color: colors.textSecondary }]}>Pontos totais</Text>
            </View>
            <View style={styles.achievementCounts}>
              <Text style={[styles.countText, { color: colors.text }]}>
                {unlockedCount}/{totalCount}
              </Text>
              <Text style={[styles.countLabel, { color: colors.textSecondary }]}>Desbloqueadas</Text>
            </View>
          </View>

          {/* Barra de progresso */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.background }]}>
              <View
                style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progressPercentage}%` }]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>{progressPercentage.toFixed(0)}%</Text>
          </View>
        </View>

        {/* Filtros */}
        <View style={styles.filters}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor: filter === 'all' ? colors.primary : colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, { color: filter === 'all' ? '#FFFFFF' : colors.text }]}>Todas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor: filter === 'unlocked' ? colors.primary : colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setFilter('unlocked')}
          >
            <Text style={[styles.filterText, { color: filter === 'unlocked' ? '#FFFFFF' : colors.text }]}>
              Desbloqueadas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor: filter === 'locked' ? colors.primary : colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setFilter('locked')}
          >
            <Text style={[styles.filterText, { color: filter === 'locked' ? '#FFFFFF' : colors.text }]}>Bloqueadas</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de conquistas */}
        <View style={styles.achievementsList}>
          {filteredAchievements.map(achievement => (
            <BadgeItem
              key={achievement.type}
              icon={achievement.icon}
              title={achievement.title}
              description={achievement.description}
              points={achievement.points}
              unlocked={achievement.unlocked}
              unlockedAt={achievement.unlockedAt}
            />
          ))}
        </View>

        {filteredAchievements.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏆</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {filter === 'unlocked'
                ? 'Você ainda não desbloqueou conquistas'
                : filter === 'locked'
                  ? 'Parabéns! Todas as conquistas desbloqueadas!'
                  : 'Nenhuma conquista encontrada'}
            </Text>
          </View>
        )}
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 32,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  checkButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkButtonIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pointsText: {
    fontSize: 48,
    fontWeight: '700',
  },
  pointsLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  achievementCounts: {
    alignItems: 'flex-end',
  },
  countText: {
    fontSize: 32,
    fontWeight: '700',
  },
  countLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 45,
    textAlign: 'right',
  },
  filters: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  achievementsList: {
    marginBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
