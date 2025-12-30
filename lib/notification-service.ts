import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { WorkoutSuggestion, Activity } from '@/types/activity';
import { parseISO, subHours } from 'date-fns';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  async scheduleWorkoutReminder(activity: Activity): Promise<string | null> {
    if (Platform.OS === 'web') {
      console.log('Notifications not supported on web');
      return null;
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Notification permission not granted');
        return null;
      }

      const workoutDate = parseISO(activity.date);
      const reminderDate = subHours(workoutDate, 1);

      const now = new Date();
      if (reminderDate <= now) {
        console.log('Reminder date is in the past, skipping notification');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Workout Reminder 🏋️',
          body: `${activity.title} starts in 1 hour! Get ready to crush it!`,
          data: { activityId: activity.id, type: 'workout_reminder' },
        },
        trigger: { 
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.floor((reminderDate.getTime() - Date.now()) / 1000) 
        },
      });

      console.log('Scheduled notification:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  async scheduleSuggestionReminder(
    suggestion: WorkoutSuggestion,
    hoursBeforeWorkout = 1
  ): Promise<string | null> {
    if (Platform.OS === 'web') {
      console.log('Notifications not supported on web');
      return null;
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Notification permission not granted');
        return null;
      }

      const workoutDateTime = parseISO(`${suggestion.suggestedDate}T${suggestion.suggestedTime}:00`);
      const reminderDate = subHours(workoutDateTime, hoursBeforeWorkout);

      const now = new Date();
      if (reminderDate <= now) {
        console.log('Reminder date is in the past, skipping notification');
        return null;
      }

      const activityTitle = `${suggestion.activityType.charAt(0).toUpperCase() + suggestion.activityType.slice(1)} Workout`;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Scheduled Workout 💪',
          body: `${activityTitle} starts in ${hoursBeforeWorkout} hour${hoursBeforeWorkout > 1 ? 's' : ''}! Time to get moving!`,
          data: { suggestionId: suggestion.id, type: 'suggestion_reminder' },
        },
        trigger: { 
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.floor((reminderDate.getTime() - Date.now()) / 1000) 
        },
      });

      console.log('Scheduled notification:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Cancelled notification:', notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Cancelled all notifications');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    if (Platform.OS === 'web') {
      return [];
    }

    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log(`Found ${notifications.length} scheduled notifications`);
      return notifications;
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  async sendDailyMotivation(): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      return;
    }

    const motivationalMessages = [
      'Ready to crush your fitness goals today? 💪',
      'Your body can do it, your mind just needs to believe! 🔥',
      'Every workout counts. Make today count! 🏃',
      'Strong is the new beautiful. Get moving! 💫',
      'The only bad workout is the one you didn\'t do! ⚡',
    ];

    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Daily Motivation',
          body: randomMessage,
          data: { type: 'daily_motivation' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: 8,
          minute: 0,
          repeats: true,
        },
      });
    } catch (error) {
      console.error('Error scheduling daily motivation:', error);
    }
  }
}

export const notificationService = new NotificationService();
