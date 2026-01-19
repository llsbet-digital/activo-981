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
import { useApp } from '@/context/AppContext';
import { ActivityType } from '@/types/activity';
import { X, Calendar } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  { type: 'other', label: 'Other', emoji: '✨' },
];

const DISTANCE_ACTIVITIES: ActivityType[] = ['running', 'cycling', 'swimming', 'hiking'];

export default function AddActivityScreen() {
  const { addActivity } = useApp();
  const [selectedType, setSelectedType] = useState<ActivityType>('running');
  const [title, setTitle] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [duration, setDuration] = useState<string>('30');
  const [distance, setDistance] = useState<string>('5');
  const [notes, setNotes] = useState<string>('');
  const [workoutLink, setWorkoutLink] = useState<string>('');

  const showDistanceField = DISTANCE_ACTIVITIES.includes(selectedType);

  const formatDate = (date: Date): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      return;
    }

    await addActivity({
      id: Date.now().toString(),
      type: selectedType,
      title: title.trim(),
      date: selectedDate.toISOString(),
      duration: parseInt(duration) || 0,
      distance: showDistanceField ? (parseFloat(distance) || undefined) : undefined,
      notes: notes.trim() || undefined,
      workoutLink: workoutLink.trim() || undefined,
      completed: false,
    });

    router.back();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <X color={colors.text} size={24} />
            </TouchableOpacity>
            <View style={styles.section}>
              <Text style={styles.label}>Activity Type</Text>
              <View style={styles.activitiesGrid}>
                {ACTIVITY_OPTIONS.map((activity) => (
                  <TouchableOpacity
                    key={activity.type}
                    style={[
                      styles.activityCard,
                      selectedType === activity.type && styles.activityCardSelected,
                    ]}
                    onPress={() => setSelectedType(activity.type)}
                  >
                    <Text style={styles.activityEmoji}>{activity.emoji}</Text>
                    <Text
                      style={[
                        styles.activityText,
                        selectedType === activity.type && styles.activityTextSelected,
                      ]}
                    >
                      {activity.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Morning Run"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Date</Text>
              <View style={styles.dateSelector}>
                <TouchableOpacity onPress={() => handleDateChange(-1)} style={styles.dateButton}>
                  <Text style={styles.dateButtonText}>←</Text>
                </TouchableOpacity>
                <View style={styles.dateDisplay}>
                  <Calendar color={colors.primary} size={18} />
                  <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDateChange(1)} style={styles.dateButton}>
                  <Text style={styles.dateButtonText}>→</Text>
                </TouchableOpacity>
              </View>
            </View>

            {showDistanceField ? (
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Duration (min)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="30"
                    placeholderTextColor={colors.textMuted}
                    value={duration}
                    onChangeText={setDuration}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.halfInput}>
                  <Text style={styles.label}>Distance (km)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="5"
                    placeholderTextColor={colors.textMuted}
                    value={distance}
                    onChangeText={setDistance}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={styles.label}>Duration (min)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="30"
                  placeholderTextColor={colors.textMuted}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                />
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.label}>Workout Link (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. https://youtube.com/watch?v=..."
                placeholderTextColor={colors.textMuted}
                value={workoutLink}
                onChangeText={setWorkoutLink}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add any notes about your workout..."
                placeholderTextColor={colors.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, !title.trim() && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!title.trim()}
            >
              <Text style={styles.saveButtonText}>Save Activity</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  activityCard: {
    width: 80,
    height: 80,
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
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
    fontSize: 28,
    marginBottom: 4,
  },
  activityText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.text,
  },
  activityTextSelected: {
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  halfInput: {
    flex: 1,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateButtonText: {
    fontSize: 20,
    color: colors.text,
  },
  dateDisplay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: colors.background,
  },
  saveButton: {
    borderRadius: 16,
    backgroundColor: colors.primary,
    padding: 18,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
