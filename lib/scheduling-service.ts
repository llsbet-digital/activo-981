import {
  AvailabilitySlot,
  CalendarEvent,
  WorkoutSuggestion,
  SchedulePreference,
  Activity,
  ActivityType,
} from '@/types/activity';
import {
  parseISO,
  addDays,
  format,
  startOfDay,
  setHours,
  setMinutes,
  isAfter,
  isBefore,
  addMinutes,
  getDay,
  differenceInMinutes,
} from 'date-fns';

export interface ActivityPattern {
  preferredTimes: string[];
  completionRate: number;
  averageDuration: number;
  activityType: ActivityType;
}

export class SchedulingService {
  private analyzeUserPatterns(activities: Activity[]): Map<ActivityType, ActivityPattern> {
    const patterns = new Map<ActivityType, ActivityPattern>();
    const completedActivities = activities.filter((a) => a.completed);

    const activityGroups = completedActivities.reduce((acc, activity) => {
      if (!acc[activity.type]) {
        acc[activity.type] = [];
      }
      acc[activity.type].push(activity);
      return acc;
    }, {} as Record<ActivityType, Activity[]>);

    Object.entries(activityGroups).forEach(([type, acts]) => {
      const times = acts.map((a) => {
        const date = parseISO(a.date);
        return format(date, 'HH:mm');
      });

      const totalActivities = activities.filter((a) => a.type === type).length;
      const completionRate = totalActivities > 0 ? acts.length / totalActivities : 0;
      const averageDuration =
        acts.reduce((sum, a) => sum + a.duration, 0) / acts.length || 45;

      patterns.set(type as ActivityType, {
        preferredTimes: times,
        completionRate,
        averageDuration,
        activityType: type as ActivityType,
      });
    });

    return patterns;
  }

  private findAvailableSlots(
    date: Date,
    events: CalendarEvent[],
    preferences: SchedulePreference,
    workingHoursStart = 6,
    workingHoursEnd = 22
  ): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = [];
    const dayOfWeek = getDay(date);

    const preferredSlotsForDay = preferences.preferredTimeSlots.filter(
      (slot) => slot.dayOfWeek === dayOfWeek
    );

    if (preferredSlotsForDay.length === 0) {
      return this.findGenericAvailableSlots(date, events, workingHoursStart, workingHoursEnd);
    }

    preferredSlotsForDay.forEach((preferredSlot) => {
      const [startHour, startMin] = preferredSlot.startTime.split(':').map(Number);
      const [endHour, endMin] = preferredSlot.endTime.split(':').map(Number);

      let currentTime = setMinutes(setHours(date, startHour), startMin);
      const slotEnd = setMinutes(setHours(date, endHour), endMin);

      while (isBefore(currentTime, slotEnd)) {
        const checkEnd = addMinutes(currentTime, 30);

        if (isAfter(checkEnd, slotEnd)) break;

        const hasConflict = events.some((event) => {
          const eventStart = parseISO(event.startTime);
          const eventEnd = parseISO(event.endTime);
          return (
            (isAfter(currentTime, eventStart) && isBefore(currentTime, eventEnd)) ||
            (isAfter(checkEnd, eventStart) && isBefore(checkEnd, eventEnd)) ||
            (isBefore(currentTime, eventStart) && isAfter(checkEnd, eventEnd))
          );
        });

        if (!hasConflict) {
          const durationMinutes = differenceInMinutes(slotEnd, currentTime);
          slots.push({
            date: format(date, 'yyyy-MM-dd'),
            startTime: format(currentTime, 'HH:mm'),
            endTime: format(checkEnd, 'HH:mm'),
            durationMinutes: Math.min(durationMinutes, 120),
            score: 1.0,
          });
        }

        currentTime = addMinutes(currentTime, 30);
      }
    });

    return slots;
  }

  private findGenericAvailableSlots(
    date: Date,
    events: CalendarEvent[],
    workingHoursStart: number,
    workingHoursEnd: number
  ): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = [];
    let currentTime = setMinutes(setHours(date, workingHoursStart), 0);
    const endTime = setMinutes(setHours(date, workingHoursEnd), 0);

    while (isBefore(currentTime, endTime)) {
      const checkEnd = addMinutes(currentTime, 60);

      if (isAfter(checkEnd, endTime)) break;

      const hasConflict = events.some((event) => {
        const eventStart = parseISO(event.startTime);
        const eventEnd = parseISO(event.endTime);
        return (
          (isAfter(currentTime, eventStart) && isBefore(currentTime, eventEnd)) ||
          (isAfter(checkEnd, eventStart) && isBefore(checkEnd, eventEnd)) ||
          (isBefore(currentTime, eventStart) && isAfter(checkEnd, eventEnd))
        );
      });

      if (!hasConflict) {
        const durationMinutes = differenceInMinutes(endTime, currentTime);
        slots.push({
          date: format(date, 'yyyy-MM-dd'),
          startTime: format(currentTime, 'HH:mm'),
          endTime: format(checkEnd, 'HH:mm'),
          durationMinutes: Math.min(durationMinutes, 120),
          score: 0.5,
        });
      }

      currentTime = addMinutes(currentTime, 30);
    }

    return slots;
  }

  private scoreSlot(
    slot: AvailabilitySlot,
    patterns: Map<ActivityType, ActivityPattern>,
    activityType: ActivityType,
    existingWorkouts: Activity[]
  ): number {
    let score = slot.score;

    const pattern = patterns.get(activityType);
    if (pattern && pattern.preferredTimes.length > 0) {
      const slotTime = slot.startTime;
      const timeMatch = pattern.preferredTimes.some((prefTime) => {
        const [prefHour] = prefTime.split(':').map(Number);
        const [slotHour] = slotTime.split(':').map(Number);
        return Math.abs(prefHour - slotHour) <= 1;
      });

      if (timeMatch) {
        score += 0.3;
      }

      score += pattern.completionRate * 0.2;
    }

    const sameDayWorkouts = existingWorkouts.filter(
      (w) => w.date.split('T')[0] === slot.date
    );
    if (sameDayWorkouts.length === 0) {
      score += 0.2;
    } else if (sameDayWorkouts.length >= 2) {
      score -= 0.3;
    }

    const hour = parseInt(slot.startTime.split(':')[0]);
    if (hour >= 6 && hour <= 9) {
      score += 0.15;
    } else if (hour >= 17 && hour <= 19) {
      score += 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  public generateSuggestions(
    activities: Activity[],
    preferences: SchedulePreference,
    calendarEvents: CalendarEvent[],
    daysAhead = 7
  ): WorkoutSuggestion[] {
    const patterns = this.analyzeUserPatterns(activities);
    const suggestions: WorkoutSuggestion[] = [];
    const today = startOfDay(new Date());

    const activityTypes = preferences.preferredTimeSlots.length > 0
      ? Object.keys(preferences.workoutDurations) as ActivityType[]
      : (['running', 'gym', 'yoga'] as ActivityType[]);

    for (let i = 0; i < daysAhead; i++) {
      const date = addDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');

      const dayEvents = calendarEvents.filter((event) => {
        const eventDate = parseISO(event.startTime);
        return format(eventDate, 'yyyy-MM-dd') === dateStr;
      });

      const availableSlots = this.findAvailableSlots(date, dayEvents, preferences);

      const existingWorkouts = activities.filter(
        (a) => a.date.split('T')[0] === dateStr
      );

      if (existingWorkouts.length >= preferences.daysPerWeek) {
        continue;
      }

      for (const activityType of activityTypes) {
        const duration = preferences.workoutDurations[activityType] || 45;

        const suitableSlots = availableSlots.filter(
          (slot) => slot.durationMinutes >= duration
        );

        for (const slot of suitableSlots) {
          const score = this.scoreSlot(slot, patterns, activityType, existingWorkouts);

          if (score >= 0.4) {
            const reasoning = this.generateReasoning(
              slot,
              activityType,
              patterns.get(activityType),
              existingWorkouts.length
            );

            suggestions.push({
              id: `${dateStr}-${slot.startTime}-${activityType}`,
              userId: '',
              suggestedDate: dateStr,
              suggestedTime: slot.startTime,
              duration,
              activityType,
              score,
              reasoning,
              accepted: false,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, preferences.daysPerWeek * 2);
  }

  private generateReasoning(
    slot: AvailabilitySlot,
    activityType: ActivityType,
    pattern?: ActivityPattern,
    workoutsToday?: number
  ): string {
    const reasons: string[] = [];

    const hour = parseInt(slot.startTime.split(':')[0]);
    if (hour >= 6 && hour <= 9) {
      reasons.push('Morning workout to start your day energized');
    } else if (hour >= 12 && hour <= 14) {
      reasons.push('Midday session to break up your day');
    } else if (hour >= 17 && hour <= 19) {
      reasons.push('Evening workout after work hours');
    }

    if (pattern && pattern.completionRate > 0.7) {
      reasons.push(`You have a ${Math.round(pattern.completionRate * 100)}% completion rate for ${activityType}`);
    }

    if (workoutsToday === 0) {
      reasons.push('First workout of the day');
    }

    if (slot.durationMinutes >= 90) {
      reasons.push('Extended time slot available for a longer session');
    }

    return reasons.join('. ') || 'Good time slot based on your schedule';
  }

  public optimizeWeeklySchedule(
    activities: Activity[],
    preferences: SchedulePreference,
    calendarEvents: CalendarEvent[]
  ): WorkoutSuggestion[] {
    const suggestions = this.generateSuggestions(
      activities,
      preferences,
      calendarEvents,
      7
    );

    const weekSchedule: WorkoutSuggestion[] = [];
    const usedDates = new Set<string>();

    for (const suggestion of suggestions) {
      if (weekSchedule.length >= preferences.daysPerWeek) break;

      if (!usedDates.has(suggestion.suggestedDate)) {
        weekSchedule.push(suggestion);
        usedDates.add(suggestion.suggestedDate);
      }
    }

    return weekSchedule;
  }
}

export const schedulingService = new SchedulingService();
