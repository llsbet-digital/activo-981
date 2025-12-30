export type ActivityType = 'running' | 'cycling' | 'swimming' | 'gym' | 'yoga' | 'hiking' | 'pilates' | 'strength' | 'hiit' | 'other';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  date: string;
  duration: number;
  distance?: number;
  calories?: number;
  notes?: string;
  workoutLink?: string;
  completed: boolean;
}

export interface UserProfile {
  name: string;
  goal: string;
  weeklyTarget: number;
  preferredActivities: ActivityType[];
  level: 'beginner' | 'intermediate' | 'advanced';
}

export interface WeeklyStats {
  activitiesCompleted: number;
  totalDuration: number;
  totalDistance: number;
  totalCalories: number;
  weekProgress: number;
}

export interface TrainingPlan {
  id: string;
  userId: string;
  name: string;
  description?: string;
  goal: string;
  durationWeeks: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  activitiesPerWeek: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export interface ProgressMetric {
  id: string;
  userId: string;
  date: string;
  totalActivities: number;
  totalDuration: number;
  totalDistance: number;
  totalCalories: number;
  activitiesCompleted: number;
  streakDays: number;
}

export interface SchedulePreference {
  id: string;
  userId: string;
  preferredTimeSlots: TimeSlot[];
  workoutDurations: Record<ActivityType, number>;
  priority: 'must-do' | 'flexible';
  daysPerWeek: number;
  calendarIntegration?: CalendarIntegration;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface CalendarIntegration {
  provider: 'google' | 'manual';
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
}

export interface WorkoutSuggestion {
  id: string;
  userId: string;
  suggestedDate: string;
  suggestedTime: string;
  duration: number;
  activityType: ActivityType;
  score: number;
  reasoning: string;
  accepted: boolean;
  createdAt: string;
}

export interface AvailabilitySlot {
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  score: number;
}
