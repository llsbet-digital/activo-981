import { CalendarEvent, CalendarIntegration } from '@/types/activity';
import { format, addDays, startOfDay } from 'date-fns';
import { Platform } from 'react-native';

export class CalendarService {
  async getCalendarEvents(
    integration: CalendarIntegration,
    daysAhead = 7
  ): Promise<CalendarEvent[]> {
    if (integration.provider === 'manual') {
      return [];
    }

    if (Platform.OS === 'web') {
      return this.getMockCalendarEvents(daysAhead);
    }

    if (integration.provider === 'google' && integration.accessToken) {
      try {
        return await this.fetchGoogleCalendarEvents(integration.accessToken, daysAhead);
      } catch (error) {
        console.error('Error fetching Google calendar events:', error);
        return [];
      }
    }

    return [];
  }

  private async fetchGoogleCalendarEvents(
    accessToken: string,
    daysAhead: number
  ): Promise<CalendarEvent[]> {
    const startDate = startOfDay(new Date());
    const endDate = addDays(startDate, daysAhead);

    const timeMin = startDate.toISOString();
    const timeMax = endDate.toISOString();

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
          `timeMin=${encodeURIComponent(timeMin)}&` +
          `timeMax=${encodeURIComponent(timeMax)}&` +
          `singleEvents=true&orderBy=startTime`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.status}`);
      }

      const data = await response.json();

      return data.items.map((event: any) => ({
        id: event.id,
        title: event.summary || 'Untitled Event',
        startTime: event.start.dateTime || event.start.date,
        endTime: event.end.dateTime || event.end.date,
        allDay: !event.start.dateTime,
      }));
    } catch (error) {
      console.error('Failed to fetch Google calendar events:', error);
      throw error;
    }
  }

  private getMockCalendarEvents(daysAhead: number): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const today = startOfDay(new Date());

    for (let i = 0; i < daysAhead; i++) {
      const date = addDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');

      if (i % 2 === 0) {
        events.push({
          id: `work-${i}`,
          title: 'Work Meeting',
          startTime: `${dateStr}T09:00:00`,
          endTime: `${dateStr}T10:00:00`,
          allDay: false,
        });
      }

      if (i % 3 === 0) {
        events.push({
          id: `lunch-${i}`,
          title: 'Lunch',
          startTime: `${dateStr}T12:00:00`,
          endTime: `${dateStr}T13:00:00`,
          allDay: false,
        });
      }
    }

    return events;
  }

  async authorizeGoogleCalendar(): Promise<CalendarIntegration | null> {
    if (Platform.OS === 'web') {
      console.log('Google Calendar authorization not available on web');
      return null;
    }

    console.log('Google Calendar integration would require OAuth setup');
    return null;
  }
}

export const calendarService = new CalendarService();
