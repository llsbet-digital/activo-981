import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Activity, UserProfile, WeeklyStats } from '@/types/activity';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { useAuth } from './AuthContext';
import { profileService, activityService } from '@/lib/database';
import { notificationService } from '@/lib/notification-service';
import { testSupabaseConnection } from '@/lib/supabase';

const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: 'onboarding_completed',
};

export const [AppProvider, useApp] = createContextHook(() => {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setConnectionError(null);
      
      const onboardingData = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      if (onboardingData) {
        setOnboardingCompleted(JSON.parse(onboardingData));
      }

      if (isAuthenticated && user) {
        const connectionTest = await testSupabaseConnection();
        if (!connectionTest) {
          setConnectionError(
            'Unable to connect to database. This may be due to:\n\n' +
            '• CORS configuration (web only)\n' +
            '• Paused Supabase project\n' +
            '• Network issues\n\n' +
            'To fix CORS on web: Add your dev server URL to Supabase Dashboard > Authentication > URL Configuration'
          );
          return;
        }

        const [profileData, activitiesData] = await Promise.all([
          profileService.getProfile(user.id),
          activityService.getActivities(user.id),
        ]);

        if (profileData) {
          setProfile(profileData);
          setOnboardingCompleted(true);
          await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, JSON.stringify(true));
        }
        setActivities(activitiesData);
      } else {
        setProfile(null);
        setActivities([]);
      }
    } catch (error: any) {
      console.error('\n❌ ERROR LOADING APP DATA');
      console.error('Error message:', error?.message || String(error));
      console.error('Full error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
      const isConnectionError = 
        error?.message?.includes('fetch') || 
        error?.message?.includes('Cannot connect') ||
        error?.message?.includes('NetworkError');
      
      if (isConnectionError) {
        setConnectionError(
          'Connection failed. Please check:\n\n' +
          '• Your internet connection\n' +
          '• Supabase project is active\n' +
          '• Environment variables are correct\n' +
          '• CORS is configured (web only)'
        );
      } else {
        setConnectionError(error?.message || 'An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateProfile = async (newProfile: UserProfile) => {
    if (!user) {
      console.error('No user authenticated');
      return;
    }

    try {
      if (profile) {
        await profileService.updateProfile(user.id, newProfile);
      } else {
        await profileService.createProfile(user.id, newProfile);
      }
      setProfile(newProfile);
    } catch (error: any) {
      console.error('Error saving profile:', error?.message || String(error));
      console.error('Full error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      throw error;
    }
  };

  const addActivity = async (activity: Activity) => {
    if (!user) {
      console.error('No user authenticated');
      return;
    }

    try {
      const created = await activityService.createActivity(user.id, activity);
      setActivities((prev) => [created, ...prev]);
      
      await notificationService.scheduleWorkoutReminder(created);
    } catch (error: any) {
      console.error('Error adding activity:', error?.message || String(error));
      console.error('Full error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      throw error;
    }
  };

  const updateActivity = async (activityId: string, updates: Partial<Activity>) => {
    if (!user) {
      console.error('No user authenticated');
      return;
    }

    try {
      await activityService.updateActivity(user.id, activityId, updates);
      setActivities((prev) =>
        prev.map((a) => (a.id === activityId ? { ...a, ...updates } : a))
      );
    } catch (error: any) {
      console.error('Error updating activity:', error?.message || String(error));
      console.error('Full error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      throw error;
    }
  };

  const deleteActivity = async (activityId: string) => {
    if (!user) {
      console.error('No user authenticated');
      return;
    }

    try {
      await activityService.deleteActivity(user.id, activityId);
      setActivities((prev) => prev.filter((a) => a.id !== activityId));
    } catch (error: any) {
      console.error('Error deleting activity:', error?.message || String(error));
      console.error('Full error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      throw error;
    }
  };

  const completeOnboarding = async () => {
    try {
      setOnboardingCompleted(true);
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, JSON.stringify(true));
    } catch (error: any) {
      console.error('Error completing onboarding:', error?.message || String(error));
      console.error('Full error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    }
  };

  const weeklyStats = useMemo<WeeklyStats>(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const weekActivities = activities.filter((activity) => {
      const activityDate = parseISO(activity.date);
      return isWithinInterval(activityDate, { start: weekStart, end: weekEnd }) && activity.completed;
    });

    const totalDuration = weekActivities.reduce((sum, a) => sum + a.duration, 0);
    const totalDistance = weekActivities.reduce((sum, a) => sum + (a.distance || 0), 0);
    const totalCalories = weekActivities.reduce((sum, a) => sum + (a.calories || 0), 0);
    const weekProgress = profile ? (weekActivities.length / profile.weeklyTarget) * 100 : 0;

    return {
      activitiesCompleted: weekActivities.length,
      totalDuration,
      totalDistance,
      totalCalories,
      weekProgress: Math.min(weekProgress, 100),
    };
  }, [activities, profile]);

  return {
    profile,
    activities,
    onboardingCompleted,
    isLoading,
    connectionError,
    weeklyStats,
    updateProfile,
    addActivity,
    updateActivity,
    deleteActivity,
    completeOnboarding,
    retryConnection: loadData,
  };
});
