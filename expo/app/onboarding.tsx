import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/context/AppContext';
import { ActivityType } from '@/types/activity';
import { ChevronRight, Target, Zap } from 'lucide-react-native';

const ACTIVITY_OPTIONS: { type: ActivityType; label: string; emoji: string }[] = [
  { type: 'running', label: 'Running', emoji: '🏃' },
  { type: 'cycling', label: 'Cycling', emoji: '🚴' },
  { type: 'swimming', label: 'Swimming', emoji: '🏊' },
  { type: 'gym', label: 'Gym', emoji: '💪' },
  { type: 'yoga', label: 'Yoga', emoji: '🧘' },
  { type: 'hiking', label: 'Hiking', emoji: '🥾' },
  { type: 'pilates', label: 'Pilates', emoji: '🤸' },
  { type: 'strength', label: 'Strength', emoji: '🏋️' },
  { type: 'hiit', label: 'HIIT', emoji: '⚡' },
];

const GOALS = [
  'Lose Weight',
  'Build Muscle',
  'Stay Active',
  'Improve Endurance',
  'General Fitness',
];

const LEVELS: ('beginner' | 'intermediate' | 'advanced')[] = [
  'beginner',
  'intermediate',
  'advanced',
];

export default function OnboardingScreen() {
  const { updateProfile, completeOnboarding } = useApp();
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState<string>('');
  const [goal, setGoal] = useState<string>('');
  const [weeklyTarget, setWeeklyTarget] = useState<number>(3);
  const [preferredActivities, setPreferredActivities] = useState<ActivityType[]>([]);
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

  const toggleActivity = (activity: ActivityType) => {
    if (preferredActivities.includes(activity)) {
      setPreferredActivities(preferredActivities.filter((a) => a !== activity));
    } else {
      setPreferredActivities([...preferredActivities, activity]);
    }
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleFinish = async () => {
    await updateProfile({
      name: name || 'Athlete',
      goal: goal || 'General Fitness',
      weeklyTarget,
      preferredActivities,
      level,
    });
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const canProceed = () => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return goal.length > 0;
    if (step === 3) return preferredActivities.length > 0;
    if (step === 4) return true;
    return false;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient colors={[colors.background, colors.backgroundLight]} style={styles.gradient}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <Text style={styles.stepText}>
              Step {step} of 4
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
            </View>
          </View>

          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.emoji}>👋</Text>
              <Text style={styles.title}>Welcome to Activo!</Text>
              <Text style={styles.description}>
                Let&apos;s start by getting to know you
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContainer}>
              <Target color={colors.primary} size={48} />
              <Text style={styles.title}>What&apos;s your main goal?</Text>
              <Text style={styles.description}>Choose what you want to achieve</Text>
              <View style={styles.optionsContainer}>
                {GOALS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.optionCard, goal === g && styles.optionCardSelected]}
                    onPress={() => setGoal(g)}
                  >
                    <Text style={[styles.optionText, goal === g && styles.optionTextSelected]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.emoji}>🎯</Text>
              <Text style={styles.title}>Pick your activities</Text>
              <Text style={styles.description}>Select all that interest you</Text>
              <View style={styles.activitiesGrid}>
                {ACTIVITY_OPTIONS.map((activity) => (
                  <TouchableOpacity
                    key={activity.type}
                    style={[
                      styles.activityCard,
                      preferredActivities.includes(activity.type) &&
                        styles.activityCardSelected,
                    ]}
                    onPress={() => toggleActivity(activity.type)}
                  >
                    <Text style={styles.activityEmoji}>{activity.emoji}</Text>
                    <Text
                      style={[
                        styles.activityText,
                        preferredActivities.includes(activity.type) &&
                          styles.activityTextSelected,
                      ]}
                    >
                      {activity.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 4 && (
            <View style={styles.stepContainer}>
              <Zap color={colors.success} size={48} />
              <Text style={styles.title}>Set your targets</Text>
              <Text style={styles.description}>How often do you want to train?</Text>

              <View style={styles.targetContainer}>
                <Text style={styles.targetLabel}>Weekly Workouts</Text>
                <View style={styles.targetButtons}>
                  {[2, 3, 4, 5, 6, 7].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.targetButton,
                        weeklyTarget === num && styles.targetButtonSelected,
                      ]}
                      onPress={() => setWeeklyTarget(num)}
                    >
                      <Text
                        style={[
                          styles.targetButtonText,
                          weeklyTarget === num && styles.targetButtonTextSelected,
                        ]}
                      >
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.levelContainer}>
                <Text style={styles.targetLabel}>Fitness Level</Text>
                <View style={styles.levelButtons}>
                  {LEVELS.map((l) => (
                    <TouchableOpacity
                      key={l}
                      style={[styles.levelButton, level === l && styles.levelButtonSelected]}
                      onPress={() => setLevel(l)}
                    >
                      <Text
                        style={[
                          styles.levelButtonText,
                          level === l && styles.levelButtonTextSelected,
                        ]}
                      >
                        {l.charAt(0).toUpperCase() + l.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step < 4 ? (
            <TouchableOpacity
              style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
              onPress={handleNext}
              disabled={!canProceed()}
            >
              <LinearGradient
                colors={canProceed() ? [colors.primary, colors.primaryLight] : [colors.border, colors.border]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.nextButtonGradient}
              >
                <Text style={styles.nextButtonText}>Next</Text>
                <ChevronRight color={colors.text} size={20} />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
              <LinearGradient
                colors={[colors.success, colors.successLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.finishButtonGradient}
              >
                <Text style={styles.finishButtonText}>Start Training!</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 40,
  },
  stepText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  stepContainer: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionsContainer: {
    width: '100%',
    gap: 12,
  },
  optionCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundLight,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: colors.primary,
  },
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  activityCard: {
    width: 100,
    height: 100,
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  activityCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundLight,
  },
  activityEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  activityText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.text,
  },
  activityTextSelected: {
    color: colors.primary,
  },
  targetContainer: {
    width: '100%',
    marginBottom: 24,
  },
  targetLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
  },
  targetButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  targetButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  targetButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  targetButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  targetButtonTextSelected: {
    color: colors.text,
  },
  levelContainer: {
    width: '100%',
  },
  levelButtons: {
    gap: 8,
  },
  levelButton: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  levelButtonSelected: {
    borderColor: colors.success,
    backgroundColor: colors.backgroundLight,
  },
  levelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    textAlign: 'center',
  },
  levelButtonTextSelected: {
    color: colors.success,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  nextButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
  },
  finishButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  finishButtonGradient: {
    padding: 18,
    alignItems: 'center',
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
  },
});
