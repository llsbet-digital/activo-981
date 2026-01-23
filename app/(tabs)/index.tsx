import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Animated, Dimensions, Easing, ActivityIndicator, Image } from 'react-native';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { X, Clock, MapPin, Flame, Calendar, Link as LinkIcon, Dumbbell, AlertCircle, RefreshCw } from 'lucide-react-native';
import { format, parseISO, isToday, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Activity } from '@/types/activity';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { profile, activities, weeklyStats, onboardingCompleted, isLoading, updateActivity, connectionError, retryConnection } = useApp();
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login' as any);
    } else if (!isLoading && !onboardingCompleted && isAuthenticated) {
      router.replace('/onboarding' as any);
    }
  }, [isAuthenticated, authLoading, isLoading, onboardingCompleted]);

  if (authLoading || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const selectedDayActivities = activities.filter((a) => isSameDay(parseISO(a.date), selectedDay));

  const openWorkoutModal = (activity: Activity) => {
    setSelectedActivity(activity);
    setModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const closeWorkoutModal = () => {
    Animated.timing(slideAnim, {
      toValue: Dimensions.get('window').height,
      duration: 500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setSelectedActivity(null);
    });
  };

  const toggleWorkoutCompletion = async () => {
    if (!selectedActivity) return;

    try {
      await updateActivity(selectedActivity.id, { completed: !selectedActivity.completed });
      setSelectedActivity({ ...selectedActivity, completed: !selectedActivity.completed });
    } catch (error) {
      console.error('Error toggling workout completion:', error);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    await retryConnection();
    setIsRetrying(false);
  };

  if (connectionError) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <AlertCircle color={colors.error} size={64} />
            <Text style={styles.errorTitle}>Connection Error</Text>
            <Text style={styles.errorMessage}>{connectionError}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={handleRetry}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <RefreshCw color="#fff" size={20} />
                  <Text style={styles.retryButtonText}>Retry Connection</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Hey, {profile?.name || 'Athlete'}! 👋</Text>
              <Text style={styles.subtitle}>Ready to crush your goals?</Text>
            </View>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Weekly Progress</Text>
              <Image 
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/5drdnkupxdvfhreh342ip' }} 
                style={styles.progressIcon}
              />
            </View>
            <Text style={styles.progressPercentage}>{Math.round(weeklyStats.weekProgress)}%</Text>
            <View style={styles.progressBarBg}>
              <View
                style={[styles.progressBarFill, { width: `${weeklyStats.weekProgress}%` }]}
              />
            </View>
            <Text style={styles.progressSubtitle}>
              {weeklyStats.activitiesCompleted} of {profile?.weeklyTarget || 0} workouts completed 🎯
            </Text>
          </View>

          <View style={styles.weekOverviewContainer}>
            <View style={styles.weekScroll}>
              {Array.from({ length: 7 }).map((_, index) => {
                const day = addDays(startOfWeek(new Date(), { weekStartsOn: 0 }), index);
                const isSelected = isSameDay(day, selectedDay);
                const isTodayDay = isToday(day);
                const hasActivity = activities.some(a => isSameDay(parseISO(a.date), day) && a.completed);
                
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={[
                      styles.dayCard,
                      isTodayDay && styles.dayCardActive,
                      isSelected && !isTodayDay && styles.dayCardSelected
                    ]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text style={[
                      styles.dayName,
                      isTodayDay && styles.dayNameActive,
                      isSelected && !isTodayDay && styles.dayNameSelected
                    ]}>
                      {format(day, 'EEE')}
                    </Text>
                    <Text style={[
                      styles.dayNumber,
                      isTodayDay && styles.dayNumberActive,
                      isSelected && !isTodayDay && styles.dayNumberSelected
                    ]}>
                      {format(day, 'dd')}
                    </Text>
                    {hasActivity && (
                      <View style={styles.activityDot} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {selectedDayActivities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {isToday(selectedDay) ? "Today's Activities" : format(selectedDay, 'EEEE, MMM d')}
              </Text>
              <View style={styles.activitiesContainer}>
              {selectedDayActivities.map((activity, index) => (
                <TouchableOpacity 
                  key={activity.id} 
                  style={[styles.activityCard, index > 0 && styles.activityCardBorder]}
                  onPress={() => openWorkoutModal(activity)}
                >
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityType}>{activity.type}</Text>
                  </View>
                  <View style={styles.activityRight}>
                    <View style={styles.durationContainer}>
                      <Clock color="#9CA3AF" size={16} />
                      <Text style={styles.durationText}>{activity.duration} min</Text>
                    </View>
                    {activity.completed && (
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedText}>✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeWorkoutModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1}
            onPress={closeWorkoutModal}
          />
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Workout Details</Text>
              <TouchableOpacity onPress={closeWorkoutModal} style={styles.closeButton}>
                <X color={colors.text} size={24} />
              </TouchableOpacity>
            </View>

            {selectedActivity && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.modalInfoCard}>
                  <View style={styles.modalIconContainer}>
                    <Dumbbell color={colors.primary} size={24} />
                  </View>
                  <View style={styles.modalInfoContent}>
                    <Text style={styles.modalInfoLabel}>Workout</Text>
                    <Text style={styles.modalInfoValue}>{selectedActivity.title}</Text>
                    <Text style={styles.modalInfoSubtitle}>{selectedActivity.type}</Text>
                  </View>
                </View>

                <View style={styles.modalInfoCard}>
                  <View style={styles.modalIconContainer}>
                    <Calendar color={colors.warning} size={24} />
                  </View>
                  <View style={styles.modalInfoContent}>
                    <Text style={styles.modalInfoLabel}>Date</Text>
                    <Text style={styles.modalInfoValue}>
                      {format(parseISO(selectedActivity.date), 'EEEE, MMM d, yyyy')}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalMetricsRow}>
                  <View style={styles.modalMetricCard}>
                    <View style={styles.modalMetricIcon}>
                      <Clock color={colors.primary} size={20} />
                    </View>
                    <Text style={styles.modalMetricLabel}>Duration</Text>
                    <Text style={styles.modalMetricValue}>{selectedActivity.duration}</Text>
                    <Text style={styles.modalMetricUnit}>minutes</Text>
                  </View>

                  {selectedActivity.distance !== undefined && selectedActivity.distance > 0 && (
                    <View style={styles.modalMetricCard}>
                      <View style={styles.modalMetricIcon}>
                        <MapPin color={colors.success} size={20} />
                      </View>
                      <Text style={styles.modalMetricLabel}>Distance</Text>
                      <Text style={styles.modalMetricValue}>{selectedActivity.distance}</Text>
                      <Text style={styles.modalMetricUnit}>km</Text>
                    </View>
                  )}

                  {selectedActivity.calories !== undefined && selectedActivity.calories > 0 && (
                    <View style={styles.modalMetricCard}>
                      <View style={styles.modalMetricIcon}>
                        <Flame color={colors.warning} size={20} />
                      </View>
                      <Text style={styles.modalMetricLabel}>Calories</Text>
                      <Text style={styles.modalMetricValue}>{selectedActivity.calories}</Text>
                      <Text style={styles.modalMetricUnit}>kcal</Text>
                    </View>
                  )}
                </View>

                {selectedActivity.workoutLink && (
                  <View style={styles.modalInfoCard}>
                    <View style={styles.modalIconContainer}>
                      <LinkIcon color={colors.primary} size={24} />
                    </View>
                    <View style={styles.modalInfoContent}>
                      <Text style={styles.modalInfoLabel}>Workout Link</Text>
                      <Text style={[styles.modalInfoValue, styles.linkText]} numberOfLines={2}>
                        {selectedActivity.workoutLink}
                      </Text>
                    </View>
                  </View>
                )}

                {selectedActivity.notes && (
                  <View style={styles.modalNotesCard}>
                    <Text style={styles.modalNotesLabel}>Notes</Text>
                    <Text style={styles.modalNotesValue}>{selectedActivity.notes}</Text>
                  </View>
                )}

                <View style={[
                  styles.modalStatusCard,
                  selectedActivity.completed ? styles.modalStatusCardCompleted : styles.modalStatusCardPending
                ]}>
                  <Text style={styles.modalStatusText}>
                    {selectedActivity.completed ? '✓ Completed' : '⏳ Scheduled'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.markDoneButton,
                    selectedActivity.completed && styles.markDoneButtonCompleted
                  ]}
                  onPress={toggleWorkoutCompletion}
                >
                  <Text style={styles.markDoneButtonText}>
                    {selectedActivity.completed ? 'Mark as Incomplete' : 'Mark as Done'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    color: colors.text,
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  progressCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 20,
    padding: 24,
    marginTop: 24,
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  progressPercentage: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: colors.primary,
    marginBottom: 16,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.warning,
    borderRadius: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressIcon: {
    width: 56,
    height: 56,
  },
  weekOverviewContainer: {
    marginBottom: 24,
  },
  weekOverviewTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  weekScroll: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCard: {
    width: 48,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  dayCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayCardSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#90CAF9',
  },
  dayName: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500' as const,
  },
  dayNameActive: {
    color: '#FFFFFF',
  },
  dayNameSelected: {
    color: '#1976D2',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
  },
  dayNumberActive: {
    color: '#FFFFFF',
  },
  dayNumberSelected: {
    color: '#1976D2',
  },
  activityDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.success,
    marginTop: 4,
    position: 'absolute',
    bottom: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 16,
  },
  activitiesContainer: {
    gap: 12,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  activityCardBorder: {
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  activityType: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  activityRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  durationText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  completedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  modalInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalInfoContent: {
    flex: 1,
  },
  modalInfoLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInfoValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  modalInfoSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalMetricsRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  modalMetricCard: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalMetricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalMetricLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalMetricValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
  },
  modalMetricUnit: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalNotesCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalNotesLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalNotesValue: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  modalStatusCard: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalStatusCardCompleted: {
    backgroundColor: colors.paleGreen,
  },
  modalStatusCardPending: {
    backgroundColor: colors.paleBlue,
  },
  modalStatusText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  linkText: {
    color: colors.primary,
  },
  markDoneButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  markDoneButtonCompleted: {
    backgroundColor: colors.textSecondary,
  },
  markDoneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
