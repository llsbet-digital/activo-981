import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Animated, Dimensions, Easing } from 'react-native';
import { useApp } from '@/context/AppContext';
import { colors } from '@/constants/colors';
import { Calendar as CalendarComponent, DateData } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, parseISO, isAfter, startOfDay } from 'date-fns';
import { Clock, MapPin, Check, X, Flame, Calendar, Link as LinkIcon, Dumbbell } from 'lucide-react-native';
import { Activity } from '@/types/activity';

const getActivityEmoji = (type: string) => {
  const emojis: Record<string, string> = {
    running: '🏃',
    cycling: '🚴',
    swimming: '🏊',
    gym: '💪',
    yoga: '🧘',
    hiking: '🥾',
    other: '⚡',
  };
  return emojis[type] || '⚡';
};

export default function CalendarScreen() {
  const { activities, updateActivity } = useApp();
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  const markedDates = activities.reduce((acc, activity) => {
    const date = activity.date.split('T')[0];
    if (!acc[date]) {
      acc[date] = { marked: true, dots: [], selectedDayBackgroundColor: colors.primary };
    }
    return acc;
  }, {} as Record<string, any>);

  if (selectedDate) {
    markedDates[selectedDate] = {
      ...markedDates[selectedDate],
      selected: true,
      selectedColor: colors.primary,
      selectedTextColor: '#FFFFFF',
    };
  }

  const selectedActivities = activities.filter(
    (activity) => activity.date.split('T')[0] === selectedDate
  );

  const upcomingActivities = activities.filter(
    (activity) => !activity.completed && isAfter(parseISO(activity.date), startOfDay(new Date()))
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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

  const handleDateSelect = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Calendar</Text>
          <Text style={styles.subtitle}>Plan your training schedule</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.calendarContainer}>
            <CalendarComponent
              current={selectedDate}
              onDayPress={handleDateSelect}
              markedDates={markedDates}
              theme={{
                calendarBackground: colors.backgroundCard,
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: '#FFFFFF',
                todayTextColor: '#FFFFFF',
                todayBackgroundColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.textMuted,
                dotColor: colors.success,
                selectedDotColor: '#FFFFFF',
                arrowColor: colors.primary,
                monthTextColor: colors.text,
                indicatorColor: colors.primary,
                textDayFontWeight: '400' as const,
                textMonthFontWeight: '700' as const,
                textDayHeaderFontWeight: '600' as const,
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
              style={styles.calendar}
            />
          </View>

          <View style={styles.activitiesSection}>
            <Text style={styles.sectionTitle}>
              {format(parseISO(selectedDate), 'MMMM d, yyyy')}
            </Text>

            {selectedActivities.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📅</Text>
                <Text style={styles.emptyText}>No activities scheduled for this day</Text>
              </View>
            ) : (
              selectedActivities.map((activity) => (
                <TouchableOpacity
                  key={activity.id}
                  style={[
                    styles.activityCard,
                    activity.completed && styles.activityCardCompleted,
                  ]}
                  onPress={() => openWorkoutModal(activity)}
                >
                  <View style={styles.activityHeader}>
                    <View style={styles.activityIconContainer}>
                      <Text style={styles.activityEmoji}>{getActivityEmoji(activity.type)}</Text>
                    </View>
                    <View style={styles.activityInfo}>
                      <Text
                        style={[
                          styles.activityTitle,
                          activity.completed && styles.activityTitleCompleted,
                        ]}
                      >
                        {activity.title}
                      </Text>
                      <View style={styles.activityDetails}>
                        <Clock color={colors.textSecondary} size={14} />
                        <Text style={styles.activityDetailText}>{activity.duration} min</Text>
                        {activity.distance && (
                          <>
                            <MapPin color={colors.textSecondary} size={14} />
                            <Text style={styles.activityDetailText}>{activity.distance} km</Text>
                          </>
                        )}
                      </View>
                    </View>
                    {activity.completed && (
                      <View style={styles.completedBadge}>
                        <Check color={colors.text} size={18} />
                      </View>
                    )}
                  </View>
                  {activity.notes && (
                    <Text style={styles.activityNotes}>{activity.notes}</Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>

          {upcomingActivities.length > 0 && (
            <View style={styles.upcomingSection}>
              <Text style={styles.sectionTitle}>Upcoming Workouts</Text>
              {upcomingActivities.map((activity) => (
                <TouchableOpacity
                  key={activity.id}
                  style={styles.activityCard}
                  onPress={() => openWorkoutModal(activity)}
                >
                  <View style={styles.activityHeader}>
                    <View style={styles.activityIconContainer}>
                      <Text style={styles.activityEmoji}>{getActivityEmoji(activity.type)}</Text>
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      <Text style={styles.activityDate}>
                        {format(parseISO(activity.date), 'EEE, MMM d')}
                      </Text>
                      <View style={styles.activityDetails}>
                        <Clock color={colors.textSecondary} size={14} />
                        <Text style={styles.activityDetailText}>{activity.duration} min</Text>
                        {activity.distance && (
                          <>
                            <MapPin color={colors.textSecondary} size={14} />
                            <Text style={styles.activityDetailText}>{activity.distance} km</Text>
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
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
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  calendarContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  calendar: {
    borderRadius: 16,
  },
  activitiesSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 16,
  },
  activityCard: {
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
  activityCardCompleted: {
    opacity: 0.7,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 24,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 6,
  },
  activityTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  activityDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityDetailText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 8,
  },
  activityNotes: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
    lineHeight: 20,
  },
  completedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  upcomingSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  activityDate: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600' as const,
    marginBottom: 4,
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
    backgroundColor: colors.background,
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
});
