import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Activity, UserProfile, WeeklyStats } from '@/types/activity';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { useAuth } from './AuthContext';
import { profileService, activityService } from '@/lib/database';
import { notificationService } from '@/lib/notification-service';

const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: 'onboarding_completed',
};

export const [AppProvider, useApp] = createContextHook(() => {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const onboardingData = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      if (onboardingData) {
        setOnboardingCompleted(JSON.parse(onboardingData));
      }

      if (isAuthenticated && user) {
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
      console.error('Error loading data:', error?.message || String(error));
      console.error('Full error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
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
    weeklyStats,
    updateProfile,
    addActivity,
    updateActivity,
    deleteActivity,
    completeOnboarding,
  };
});
