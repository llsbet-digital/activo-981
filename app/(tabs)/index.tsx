import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { Target } from 'lucide-react-native';
import { format, parseISO, isToday, startOfWeek, addDays, isSameDay } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { profile, activities, weeklyStats, onboardingCompleted, isLoading } = useApp();
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    } else if (!isLoading && !onboardingCompleted && isAuthenticated) {
      router.replace('/onboarding');
    }
  }, [isAuthenticated, authLoading, isLoading, onboardingCompleted]);

  if (authLoading || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const todayActivities = activities.filter((a) => isToday(parseISO(a.date)));
  const selectedDayActivities = activities.filter(
    (a) => !a.completed && isSameDay(parseISO(a.date), selectedDay)
  );

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
              <Target color={colors.primary} size={20} />
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekScroll}>
              {Array.from({ length: 7 }).map((_, index) => {
                const day = addDays(startOfWeek(new Date(), { weekStartsOn: 0 }), index);
                const isSelected = isSameDay(day, selectedDay);
                const hasActivity = activities.some(a => isSameDay(parseISO(a.date), day) && a.completed);
                
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.dayCard, isSelected && styles.dayCardSelected]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                      {format(day, 'EEE')}
                    </Text>
                    <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
                      {format(day, 'dd')}
                    </Text>
                    {hasActivity && (
                      <View style={styles.activityDot} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {todayActivities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Today&apos;s Activities</Text>
              {todayActivities.map((activity) => (
                <View key={activity.id} style={styles.activityCard}>
                  <View style={styles.activityIcon}>
                    <Text style={styles.activityEmoji}>🏃</Text>
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityTime}>
                      {activity.duration} min • {activity.distance || 0} km
                    </Text>
                  </View>
                  {activity.completed && (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedText}>✓</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {selectedDayActivities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upcoming Workouts</Text>
              {selectedDayActivities.map((activity) => (
                <TouchableOpacity 
                  key={activity.id} 
                  style={styles.activityCard}
                  onPress={() => {
                    console.log('Activity clicked:', activity.id);
                  }}
                >
                  <View style={styles.activityIcon}>
                    <Text style={styles.activityEmoji}>📅</Text>
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityTime}>
                      {activity.duration} min • {activity.distance || 0} km
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedDayActivities.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎯</Text>
              <Text style={styles.emptyTitle}>No workouts scheduled</Text>
              <Text style={styles.emptyText}>Add your first workout for this day!</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push('/add-activity' as any)}
              >
                <Text style={styles.addButtonText}>Add Workout</Text>
              </TouchableOpacity>
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
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
  weekOverviewContainer: {
    marginBottom: 32,
  },
  weekOverviewTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  weekScroll: {
    flexGrow: 0,
  },
  dayCard: {
    width: 60,
    height: 70,
    borderRadius: 16,
    backgroundColor: colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
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
    fontSize: 12,
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
    fontSize: 18,
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
  activityCard: {
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
  activityIcon: {
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
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  completedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedText: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
    fontSize: 16,
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

});
