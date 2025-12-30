import { supabase } from './supabase';
import { Activity, UserProfile, TrainingPlan, ProgressMetric, SchedulePreference, WorkoutSuggestion } from '@/types/activity';

export interface DbUserProfile extends Omit<UserProfile, 'preferredActivities'> {
  id: string;
  user_id: string;
  preferred_activities: string;
  created_at: string;
  updated_at: string;
}

export interface DbActivity extends Omit<Activity, 'type'> {
  user_id: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export const profileService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      if (!data) return null;

      return {
        name: data.name,
        goal: data.goal,
        weeklyTarget: data.weekly_target,
        preferredActivities: JSON.parse(data.preferred_activities),
        level: data.level,
      };
    } catch (error: any) {
      console.error('Error fetching profile:', error?.message || error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  },

  async createProfile(userId: string, profile: UserProfile): Promise<void> {
    try {
      const { error } = await supabase.from('profiles').insert({
        user_id: userId,
        name: profile.name,
        goal: profile.goal,
        weekly_target: profile.weeklyTarget,
        preferred_activities: JSON.stringify(profile.preferredActivities),
        level: profile.level,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error creating profile:', error?.message || error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  },

  async updateProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
    try {
      const updateData: any = {};
      if (profile.name) updateData.name = profile.name;
      if (profile.goal) updateData.goal = profile.goal;
      if (profile.weeklyTarget) updateData.weekly_target = profile.weeklyTarget;
      if (profile.preferredActivities) {
        updateData.preferred_activities = JSON.stringify(profile.preferredActivities);
      }
      if (profile.level) updateData.level = profile.level;
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating profile:', error?.message || error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  },
};

export const activityService = {
  async getActivities(userId: string): Promise<Activity[]> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;

      return (data || []).map((item) => ({
        id: item.id,
        type: item.type as any,
        title: item.title,
        date: item.date,
        duration: item.duration,
        distance: item.distance,
        calories: item.calories,
        notes: item.notes,
        workoutLink: item.workout_link,
        completed: item.completed,
      }));
    } catch (error: any) {
      console.error('Error fetching activities:', error?.message || error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  },

  async createActivity(userId: string, activity: Omit<Activity, 'id'>): Promise<Activity> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert({
          user_id: userId,
          type: activity.type,
          title: activity.title,
          date: activity.date,
          duration: activity.duration,
          distance: activity.distance,
          calories: activity.calories,
          notes: activity.notes,
          workout_link: activity.workoutLink,
          completed: activity.completed,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        type: data.type as any,
        title: data.title,
        date: data.date,
        duration: data.duration,
        distance: data.distance,
        calories: data.calories,
        notes: data.notes,
        workoutLink: data.workout_link,
        completed: data.completed,
      };
    } catch (error: any) {
      console.error('Error creating activity:', error?.message || error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  },

  async updateActivity(
    userId: string,
    activityId: string,
    updates: Partial<Activity>
  ): Promise<void> {
    try {
      const updateData: any = {};
      if (updates.type) updateData.type = updates.type;
      if (updates.title) updateData.title = updates.title;
      if (updates.date) updateData.date = updates.date;
      if (updates.duration !== undefined) updateData.duration = updates.duration;
      if (updates.distance !== undefined) updateData.distance = updates.distance;
      if (updates.calories !== undefined) updateData.calories = updates.calories;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.workoutLink !== undefined) updateData.workout_link = updates.workoutLink;
      if (updates.completed !== undefined) updateData.completed = updates.completed;
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('activities')
        .update(updateData)
        .eq('id', activityId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating activity:', error?.message || error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  },

  async deleteActivity(userId: string, activityId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error deleting activity:', error?.message || error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  },
};

export const trainingPlanService = {
  async getTrainingPlans(userId: string): Promise<TrainingPlan[]> {
    try {
      const { data, error } = await supabase
        .from('training_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item) => ({
        id: item.id,
        userId: item.user_id,
        name: item.name,
        description: item.description,
        goal: item.goal,
        durationWeeks: item.duration_weeks,
        difficulty: item.difficulty as 'beginner' | 'intermediate' | 'advanced',
        activitiesPerWeek: item.activities_per_week,
        isActive: item.is_active,
        startDate: item.start_date,
        endDate: item.end_date,
      }));
    } catch (error) {
      console.error('Error fetching training plans:', error);
      throw error;
    }
  },

  async getActiveTrainingPlan(userId: string): Promise<TrainingPlan | null> {
    try {
      const { data, error } = await supabase
        .from('training_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      if (!data) return null;

      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        description: data.description,
        goal: data.goal,
        durationWeeks: data.duration_weeks,
        difficulty: data.difficulty as 'beginner' | 'intermediate' | 'advanced',
        activitiesPerWeek: data.activities_per_week,
        isActive: data.is_active,
        startDate: data.start_date,
        endDate: data.end_date,
      };
    } catch (error) {
      console.error('Error fetching active training plan:', error);
      throw error;
    }
  },

  async createTrainingPlan(
    userId: string,
    plan: Omit<TrainingPlan, 'id' | 'userId'>
  ): Promise<TrainingPlan> {
    try {
      if (plan.isActive) {
        await supabase
          .from('training_plans')
          .update({ is_active: false })
          .eq('user_id', userId)
          .eq('is_active', true);
      }

      const { data, error } = await supabase
        .from('training_plans')
        .insert({
          user_id: userId,
          name: plan.name,
          description: plan.description,
          goal: plan.goal,
          duration_weeks: plan.durationWeeks,
          difficulty: plan.difficulty,
          activities_per_week: plan.activitiesPerWeek,
          is_active: plan.isActive,
          start_date: plan.startDate,
          end_date: plan.endDate,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        description: data.description,
        goal: data.goal,
        durationWeeks: data.duration_weeks,
        difficulty: data.difficulty as 'beginner' | 'intermediate' | 'advanced',
        activitiesPerWeek: data.activities_per_week,
        isActive: data.is_active,
        startDate: data.start_date,
        endDate: data.end_date,
      };
    } catch (error) {
      console.error('Error creating training plan:', error);
      throw error;
    }
  },

  async updateTrainingPlan(
    userId: string,
    planId: string,
    updates: Partial<Omit<TrainingPlan, 'id' | 'userId'>>
  ): Promise<void> {
    try {
      if (updates.isActive) {
        await supabase
          .from('training_plans')
          .update({ is_active: false })
          .eq('user_id', userId)
          .eq('is_active', true)
          .neq('id', planId);
      }

      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.goal) updateData.goal = updates.goal;
      if (updates.durationWeeks) updateData.duration_weeks = updates.durationWeeks;
      if (updates.difficulty) updateData.difficulty = updates.difficulty;
      if (updates.activitiesPerWeek) updateData.activities_per_week = updates.activitiesPerWeek;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.startDate !== undefined) updateData.start_date = updates.startDate;
      if (updates.endDate !== undefined) updateData.end_date = updates.endDate;
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('training_plans')
        .update(updateData)
        .eq('id', planId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating training plan:', error);
      throw error;
    }
  },

  async deleteTrainingPlan(userId: string, planId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('training_plans')
        .delete()
        .eq('id', planId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting training plan:', error);
      throw error;
    }
  },
};

export const progressMetricService = {
  async getProgressMetrics(
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ProgressMetric[]> {
    try {
      let query = supabase
        .from('progress_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((item) => ({
        id: item.id,
        userId: item.user_id,
        date: item.date,
        totalActivities: item.total_activities,
        totalDuration: item.total_duration,
        totalDistance: item.total_distance,
        totalCalories: item.total_calories,
        activitiesCompleted: item.activities_completed,
        streakDays: item.streak_days,
      }));
    } catch (error) {
      console.error('Error fetching progress metrics:', error);
      throw error;
    }
  },

  async upsertProgressMetric(
    userId: string,
    metric: Omit<ProgressMetric, 'id' | 'userId'>
  ): Promise<void> {
    try {
      const { error } = await supabase.from('progress_metrics').upsert(
        {
          user_id: userId,
          date: metric.date,
          total_activities: metric.totalActivities,
          total_duration: metric.totalDuration,
          total_distance: metric.totalDistance,
          total_calories: metric.totalCalories,
          activities_completed: metric.activitiesCompleted,
          streak_days: metric.streakDays,
        },
        {
          onConflict: 'user_id,date',
        }
      );

      if (error) throw error;
    } catch (error) {
      console.error('Error upserting progress metric:', error);
      throw error;
    }
  },
};

export const schedulePreferenceService = {
  async getSchedulePreference(userId: string): Promise<SchedulePreference | null> {
    try {
      const { data, error } = await supabase
        .from('schedule_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      if (!data) return null;

      return {
        id: data.id,
        userId: data.user_id,
        preferredTimeSlots: data.preferred_time_slots,
        workoutDurations: data.workout_durations,
        priority: data.priority,
        daysPerWeek: data.days_per_week,
        calendarIntegration: data.calendar_integration,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error fetching schedule preference:', error);
      throw error;
    }
  },

  async upsertSchedulePreference(
    userId: string,
    preference: Omit<SchedulePreference, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    try {
      const { error } = await supabase.from('schedule_preferences').upsert(
        {
          user_id: userId,
          preferred_time_slots: preference.preferredTimeSlots,
          workout_durations: preference.workoutDurations,
          priority: preference.priority,
          days_per_week: preference.daysPerWeek,
          calendar_integration: preference.calendarIntegration,
        },
        {
          onConflict: 'user_id',
        }
      );

      if (error) throw error;
    } catch (error: any) {
      console.error('Error upserting schedule preference:', error?.message || error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  },
};

export const workoutSuggestionService = {
  async getWorkoutSuggestions(userId: string, limit = 10): Promise<WorkoutSuggestion[]> {
    try {
      const { data, error } = await supabase
        .from('workout_suggestions')
        .select('*')
        .eq('user_id', userId)
        .order('score', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((item) => ({
        id: item.id,
        userId: item.user_id,
        suggestedDate: item.suggested_date,
        suggestedTime: item.suggested_time,
        duration: item.duration,
        activityType: item.activity_type,
        score: item.score,
        reasoning: item.reasoning,
        accepted: item.accepted,
        createdAt: item.created_at,
      }));
    } catch (error) {
      console.error('Error fetching workout suggestions:', error);
      throw error;
    }
  },

  async createWorkoutSuggestions(
    userId: string,
    suggestions: Omit<WorkoutSuggestion, 'id' | 'userId' | 'createdAt'>[]
  ): Promise<void> {
    try {
      const { error } = await supabase.from('workout_suggestions').insert(
        suggestions.map((s) => ({
          user_id: userId,
          suggested_date: s.suggestedDate,
          suggested_time: s.suggestedTime,
          duration: s.duration,
          activity_type: s.activityType,
          score: s.score,
          reasoning: s.reasoning,
          accepted: s.accepted,
        }))
      );

      if (error) throw error;
    } catch (error) {
      console.error('Error creating workout suggestions:', error);
      throw error;
    }
  },

  async updateWorkoutSuggestion(
    userId: string,
    suggestionId: string,
    updates: { accepted: boolean }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('workout_suggestions')
        .update({ accepted: updates.accepted })
        .eq('id', suggestionId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating workout suggestion:', error);
      throw error;
    }
  },

  async clearWorkoutSuggestions(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('workout_suggestions')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error clearing workout suggestions:', error);
      throw error;
    }
  },
};
