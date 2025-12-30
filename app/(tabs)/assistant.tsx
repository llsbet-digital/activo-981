import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import {
  schedulePreferenceService,
  workoutSuggestionService,
  activityService,
} from '@/lib/database';
import { schedulingService } from '@/lib/scheduling-service';
import { calendarService } from '@/lib/calendar-service';
import { notificationService } from '@/lib/notification-service';
import { WorkoutSuggestion, SchedulePreference, ActivityType } from '@/types/activity';
import { format, parseISO } from 'date-fns';
import { Sparkles, Clock, Calendar as CalendarIcon, Check, X, Settings, RefreshCw } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const getActivityEmoji = (type: ActivityType) => {
  const emojis: Record<string, string> = {
    running: '🏃',
    cycling: '🚴',
    swimming: '🏊',
    gym: '💪',
    yoga: '🧘',
    hiking: '🥾',
    pilates: '🧘‍♀️',
    strength: '🏋️',
    hiit: '⚡',
    other: '🎯',
  };
  return emojis[type] || '🎯';
};

export default function AssistantScreen() {
  const { user } = useAuth();
  const { activities } = useApp();
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [schedulePreference, setSchedulePreference] = useState<SchedulePreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const [prefs, suggs] = await Promise.all([
        schedulePreferenceService.getSchedulePreference(user.id),
        workoutSuggestionService.getWorkoutSuggestions(user.id, 10),
      ]);

      setSchedulePreference(prefs);
      setSuggestions(suggs);
    } catch (error) {
      console.error('Error loading scheduling data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const generateSuggestions = async () => {
    if (!user || !schedulePreference) {
      Alert.alert('Setup Required', 'Please configure your schedule preferences first.');
      return;
    }

    try {
      setIsGenerating(true);

      const calendarEvents = await calendarService.getCalendarEvents(
        schedulePreference.calendarIntegration || { provider: 'manual' },
        7
      );

      const newSuggestions = schedulingService.generateSuggestions(
        activities,
        schedulePreference,
        calendarEvents,
        7
      );

      await workoutSuggestionService.clearWorkoutSuggestions(user.id);
      await workoutSuggestionService.createWorkoutSuggestions(user.id, newSuggestions);

      setSuggestions(newSuggestions);
      Alert.alert('Success', `Generated ${newSuggestions.length} workout suggestions!`);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      Alert.alert('Error', 'Failed to generate suggestions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const acceptSuggestion = async (suggestion: WorkoutSuggestion) => {
    if (!user) return;

    try {
      const newActivity = {
        id: '',
        type: suggestion.activityType,
        title: `${suggestion.activityType.charAt(0).toUpperCase() + suggestion.activityType.slice(1)} Workout`,
        date: `${suggestion.suggestedDate}T${suggestion.suggestedTime}:00`,
        duration: suggestion.duration,
        completed: false,
      };

      const created = await activityService.createActivity(user.id, newActivity);
      await workoutSuggestionService.updateWorkoutSuggestion(user.id, suggestion.id, {
        accepted: true,
      });

      await notificationService.scheduleWorkoutReminder(created);

      setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
      Alert.alert('Added!', 'Workout added to your schedule with a reminder set!');
    } catch (error) {
      console.error('Error accepting suggestion:', error);
      Alert.alert('Error', 'Failed to add workout. Please try again.');
    }
  };

  const declineSuggestion = async (suggestion: WorkoutSuggestion) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!schedulePreference) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.title}>Smart Assistant</Text>
          </View>
          <View style={styles.emptyState}>
            <Sparkles color={colors.primary} size={64} />
            <Text style={styles.emptyTitle}>Get Started</Text>
            <Text style={styles.emptyText}>
              Set up your schedule preferences to receive personalized workout suggestions based on
              your availability and goals.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/schedule-preferences' as any)}
            >
              <Settings color={colors.text} size={20} />
              <Text style={styles.primaryButtonText}>Configure Preferences</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Smart Assistant</Text>
            <Text style={styles.subtitle}>AI-powered workout scheduling</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/schedule-preferences' as any)}
          >
            <Settings color={colors.textSecondary} size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <CalendarIcon color={colors.primary} size={20} />
              <Text style={styles.infoText}>
                {schedulePreference.daysPerWeek} workouts per week
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Clock color={colors.primary} size={20} />
              <Text style={styles.infoText}>
                {schedulePreference.preferredTimeSlots.length} preferred time slots
              </Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
              onPress={generateSuggestions}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <RefreshCw color={colors.text} size={20} />
              )}
              <Text style={styles.generateButtonText}>
                {isGenerating ? 'Generating...' : 'Generate New Suggestions'}
              </Text>
            </TouchableOpacity>
          </View>

          {suggestions.length === 0 ? (
            <View style={styles.emptySuggestions}>
              <Sparkles color={colors.textMuted} size={48} />
              <Text style={styles.emptySuggestionsText}>
                No suggestions yet. Tap &ldquo;Generate New Suggestions&rdquo; to get started!
              </Text>
            </View>
          ) : (
            <View style={styles.suggestionsSection}>
              <Text style={styles.sectionTitle}>Suggested Workouts</Text>
              {suggestions.map((suggestion) => (
                <View key={suggestion.id} style={styles.suggestionCard}>
                  <View style={styles.suggestionHeader}>
                    <View style={styles.suggestionIconContainer}>
                      <Text style={styles.suggestionEmoji}>
                        {getActivityEmoji(suggestion.activityType)}
                      </Text>
                    </View>
                    <View style={styles.suggestionInfo}>
                      <Text style={styles.suggestionTitle}>
                        {suggestion.activityType.charAt(0).toUpperCase() +
                          suggestion.activityType.slice(1)}{' '}
                        Workout
                      </Text>
                      <View style={styles.suggestionDetails}>
                        <CalendarIcon color={colors.textSecondary} size={14} />
                        <Text style={styles.suggestionDetailText}>
                          {format(parseISO(suggestion.suggestedDate), 'MMM d, EEE')}
                        </Text>
                        <Clock color={colors.textSecondary} size={14} />
                        <Text style={styles.suggestionDetailText}>
                          {suggestion.suggestedTime} • {suggestion.duration} min
                        </Text>
                      </View>
                    </View>
                    <View style={styles.scoreContainer}>
                      <Text style={styles.scoreText}>{Math.round(suggestion.score * 100)}%</Text>
                    </View>
                  </View>

                  <Text style={styles.suggestionReasoning}>{suggestion.reasoning}</Text>

                  <View style={styles.suggestionActions}>
                    <TouchableOpacity
                      style={styles.declineButton}
                      onPress={() => declineSuggestion(suggestion)}
                    >
                      <X color={colors.error} size={18} />
                      <Text style={styles.declineButtonText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => acceptSuggestion(suggestion)}
                    >
                      <Check color={colors.text} size={18} />
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
    fontWeight: '500' as const,
  },
  actionRow: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  emptySuggestions: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptySuggestionsText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  suggestionsSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 16,
  },
  suggestionCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionEmoji: {
    fontSize: 24,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 6,
  },
  suggestionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  suggestionDetailText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginRight: 8,
  },
  scoreContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.success,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.text,
  },
  suggestionReasoning: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  suggestionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.error,
    gap: 6,
  },
  declineButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.error,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.success,
    gap: 6,
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
});
