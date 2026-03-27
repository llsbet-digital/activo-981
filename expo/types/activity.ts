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


