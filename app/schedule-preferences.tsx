import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { schedulePreferenceService } from '@/lib/database';
import { TimeSlot, ActivityType } from '@/types/activity';
import { ChevronLeft, Plus, Trash2, Save } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ACTIVITY_TYPES: ActivityType[] = [
  'running',
  'cycling',
  'swimming',
  'gym',
  'yoga',
  'hiking',
  'pilates',
  'strength',
  'hiit',
];

export default function SchedulePreferencesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [priority, setPriority] = useState<'must-do' | 'flexible'>('flexible');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [workoutDurations, setWorkoutDurations] = useState<Record<ActivityType, number>>({
    running: 45,
    cycling: 60,
    swimming: 45,
    gym: 60,
    yoga: 45,
    hiking: 90,
    pilates: 45,
    strength: 45,
    hiit: 30,
    other: 45,
  });

  const loadPreferences = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const prefs = await schedulePreferenceService.getSchedulePreference(user.id);

      if (prefs) {
        setDaysPerWeek(prefs.daysPerWeek);
        setPriority(prefs.priority);
        setTimeSlots(prefs.preferredTimeSlots);
        setWorkoutDurations(prefs.workoutDurations);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const addTimeSlot = () => {
    setTimeSlots([
      ...timeSlots,
      {
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '10:00',
      },
    ]);
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const updateTimeSlot = (index: number, updates: Partial<TimeSlot>) => {
    setTimeSlots(
      timeSlots.map((slot, i) => (i === index ? { ...slot, ...updates } : slot))
    );
  };

  const updateWorkoutDuration = (activityType: ActivityType, duration: number) => {
    setWorkoutDurations({
      ...workoutDurations,
      [activityType]: duration,
    });
  };

  const savePreferences = async () => {
    if (!user) return;

    if (timeSlots.length === 0) {
      Alert.alert('Missing Information', 'Please add at least one preferred time slot.');
      return;
    }

    try {
      setIsSaving(true);

      await schedulePreferenceService.upsertSchedulePreference(user.id, {
        preferredTimeSlots: timeSlots,
        workoutDurations,
        priority,
        daysPerWeek,
        calendarIntegration: { provider: 'manual' },
      });

      Alert.alert('Success', 'Schedule preferences saved successfully!');
      router.back();
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Schedule Preferences</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workout Frequency</Text>
            <View style={styles.daysSelector}>
              {[3, 4, 5, 6, 7].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.dayOption,
                    daysPerWeek === num && styles.dayOptionSelected,
                  ]}
                  onPress={() => setDaysPerWeek(num)}
                >
                  <Text
                    style={[
                      styles.dayOptionText,
                      daysPerWeek === num && styles.dayOptionTextSelected,
                    ]}
                  >
                    {num}
                  </Text>
                  <Text
                    style={[
                      styles.dayOptionLabel,
                      daysPerWeek === num && styles.dayOptionLabelSelected,
                    ]}
                  >
                    days/week
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Priority</Text>
            <View style={styles.prioritySelector}>
              <TouchableOpacity
                style={[
                  styles.priorityOption,
                  priority === 'flexible' && styles.priorityOptionSelected,
                ]}
                onPress={() => setPriority('flexible')}
              >
                <Text
                  style={[
                    styles.priorityOptionText,
                    priority === 'flexible' && styles.priorityOptionTextSelected,
                  ]}
                >
                  Flexible
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.priorityOption,
                  priority === 'must-do' && styles.priorityOptionSelected,
                ]}
                onPress={() => setPriority('must-do')}
              >
                <Text
                  style={[
                    styles.priorityOptionText,
                    priority === 'must-do' && styles.priorityOptionTextSelected,
                  ]}
                >
                  Must-Do
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Preferred Time Slots</Text>
              <TouchableOpacity style={styles.addButton} onPress={addTimeSlot}>
                <Plus color={colors.primary} size={20} />
                <Text style={styles.addButtonText}>Add Slot</Text>
              </TouchableOpacity>
            </View>

            {timeSlots.map((slot, index) => (
              <View key={index} style={styles.timeSlotCard}>
                <View style={styles.timeSlotHeader}>
                  <Text style={styles.timeSlotLabel}>Day</Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => removeTimeSlot(index)}
                  >
                    <Trash2 color={colors.error} size={18} />
                  </TouchableOpacity>
                </View>
                <View style={styles.dayPicker}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {DAYS.map((day, dayIndex) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dayChip,
                          slot.dayOfWeek === dayIndex && styles.dayChipSelected,
                        ]}
                        onPress={() => updateTimeSlot(index, { dayOfWeek: dayIndex })}
                      >
                        <Text
                          style={[
                            styles.dayChipText,
                            slot.dayOfWeek === dayIndex && styles.dayChipTextSelected,
                          ]}
                        >
                          {day.substring(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.timeRow}>
                  <View style={styles.timeInputGroup}>
                    <Text style={styles.timeLabel}>Start Time</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={slot.startTime}
                      onChangeText={(text) => updateTimeSlot(index, { startTime: text })}
                      placeholder="08:00"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={styles.timeInputGroup}>
                    <Text style={styles.timeLabel}>End Time</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={slot.endTime}
                      onChangeText={(text) => updateTimeSlot(index, { endTime: text })}
                      placeholder="10:00"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workout Durations (minutes)</Text>
            {ACTIVITY_TYPES.map((activityType) => (
              <View key={activityType} style={styles.durationRow}>
                <Text style={styles.durationLabel}>
                  {activityType.charAt(0).toUpperCase() + activityType.slice(1)}
                </Text>
                <TextInput
                  style={styles.durationInput}
                  value={String(workoutDurations[activityType])}
                  onChangeText={(text) =>
                    updateWorkoutDuration(activityType, parseInt(text) || 0)
                  }
                  keyboardType="numeric"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={savePreferences}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <>
                <Save color={colors.text} size={20} />
                <Text style={styles.saveButtonText}>Save Preferences</Text>
              </>
            )}
          </TouchableOpacity>
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
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  placeholder: {
    width: 44,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 16,
  },
  daysSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  dayOption: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayOptionText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
  },
  dayOptionTextSelected: {
    color: colors.text,
  },
  dayOptionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  dayOptionLabelSelected: {
    color: colors.text,
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityOption: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  priorityOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  priorityOptionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  priorityOptionTextSelected: {
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  timeSlotCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeSlotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeSlotLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayPicker: {
    marginBottom: 12,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    marginRight: 8,
  },
  dayChipSelected: {
    backgroundColor: colors.primary,
  },
  dayChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  dayChipTextSelected: {
    color: colors.text,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInputGroup: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  timeInput: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  durationLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500' as const,
  },
  durationInput: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    width: 80,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
});
