import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useApp } from '@/context/AppContext';
import { colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, Award, Flame } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function ProgressScreen() {
  const { weeklyStats, activities, profile } = useApp();

  const completedActivities = activities.filter((a) => a.completed);
  const totalActivities = activities.length;
  const completionRate = totalActivities > 0 ? (completedActivities.length / totalActivities) * 100 : 0;

  const activityTypes = completedActivities.reduce((acc, activity) => {
    acc[activity.type] = (acc[activity.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostPopularActivity = Object.entries(activityTypes).sort((a, b) => b[1] - a[1])[0];

  const achievements = [
    {
      id: '1',
      title: 'First Steps',
      description: 'Complete your first workout',
      icon: '🎯',
      achieved: completedActivities.length >= 1,
    },
    {
      id: '2',
      title: 'On Fire',
      description: 'Complete 5 workouts',
      icon: '🔥',
      achieved: completedActivities.length >= 5,
    },
    {
      id: '3',
      title: 'Consistency King',
      description: 'Complete weekly goal',
      icon: '👑',
      achieved: weeklyStats.weekProgress >= 100,
    },
    {
      id: '4',
      title: 'Distance Master',
      description: 'Cover 50km total',
      icon: '🏆',
      achieved: weeklyStats.totalDistance >= 50,
    },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.subtitle}>Track your fitness journey</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.statsGrid}>
            <View style={styles.statCardLarge}>
              <LinearGradient
                colors={[colors.primary, colors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statGradient}
              >
                <TrendingUp color={colors.text} size={32} />
                <Text style={styles.statValueLarge}>{completedActivities.length}</Text>
                <Text style={styles.statLabelLarge}>Total Workouts</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCardLarge}>
              <LinearGradient
                colors={[colors.success, colors.successLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statGradient}
              >
                <Flame color={colors.text} size={32} />
                <Text style={styles.statValueLarge}>{Math.round(completionRate)}%</Text>
                <Text style={styles.statLabelLarge}>Completion Rate</Text>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This Week</Text>
            <View style={styles.weekStatsCard}>
              <View style={styles.weekStatRow}>
                <Text style={styles.weekStatLabel}>Activities Completed</Text>
                <Text style={styles.weekStatValue}>
                  {weeklyStats.activitiesCompleted} / {profile?.weeklyTarget || 0}
                </Text>
              </View>
              <View style={styles.weekStatRow}>
                <Text style={styles.weekStatLabel}>Total Time</Text>
                <Text style={styles.weekStatValue}>
                  {Math.floor(weeklyStats.totalDuration / 60)}h {weeklyStats.totalDuration % 60}m
                </Text>
              </View>
              <View style={styles.weekStatRow}>
                <Text style={styles.weekStatLabel}>Distance</Text>
                <Text style={styles.weekStatValue}>{weeklyStats.totalDistance.toFixed(1)} km</Text>
              </View>
              <View style={styles.weekStatRow}>
                <Text style={styles.weekStatLabel}>Calories Burned</Text>
                <Text style={styles.weekStatValue}>{weeklyStats.totalCalories}</Text>
              </View>
            </View>
          </View>

          {mostPopularActivity && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Activity Breakdown</Text>
              <View style={styles.breakdownCard}>
                <Text style={styles.breakdownTitle}>Most Popular Activity</Text>
                <Text style={styles.breakdownValue}>
                  {mostPopularActivity[0].charAt(0).toUpperCase() + mostPopularActivity[0].slice(1)}
                </Text>
                <Text style={styles.breakdownSubtitle}>
                  {mostPopularActivity[1]} sessions completed
                </Text>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <View style={styles.achievementsGrid}>
              {achievements.map((achievement) => (
                <View
                  key={achievement.id}
                  style={[
                    styles.achievementCard,
                    !achievement.achieved && styles.achievementCardLocked,
                  ]}
                >
                  <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  <Text style={styles.achievementDescription}>{achievement.description}</Text>
                  {achievement.achieved && (
                    <View style={styles.achievementBadge}>
                      <Award color={colors.text} size={16} />
                    </View>
                  )}
                </View>
              ))}
            </View>
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
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCardLarge: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
  },
  statValueLarge: {
    fontSize: 40,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  statLabelLarge: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 16,
  },
  weekStatsCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  weekStatLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  weekStatValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  breakdownCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  breakdownTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  breakdownValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  breakdownSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    width: (width - 52) / 2,
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  achievementCardLocked: {
    opacity: 0.5,
  },
  achievementEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  achievementDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  achievementBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
