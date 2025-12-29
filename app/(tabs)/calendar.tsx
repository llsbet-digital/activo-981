import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useApp } from '@/context/AppContext';
import { colors } from '@/constants/colors';
import { Calendar as CalendarComponent, DateData } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import { Clock, MapPin, Check } from 'lucide-react-native';
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
    };
  }

  const selectedActivities = activities.filter(
    (activity) => activity.date.split('T')[0] === selectedDate
  );

  const handleToggleComplete = async (activity: Activity) => {
    await updateActivity(activity.id, { completed: !activity.completed });
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
                selectedDayTextColor: colors.text,
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.textMuted,
                dotColor: colors.success,
                selectedDotColor: colors.text,
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
                  onPress={() => handleToggleComplete(activity)}
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
        </ScrollView>
      </SafeAreaView>
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
    borderWidth: 1,
    borderColor: colors.border,
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
    borderWidth: 1,
    borderColor: colors.border,
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
});
