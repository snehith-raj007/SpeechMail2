/**
 * GoogleCalendarService.js
 * Integration module for Google Calendar API operations (Read, Write, Append)
 */

import { api } from './api.js';

export class GoogleCalendarService {
  constructor(options = {}) {
    this.apiKey = options.apiKey || localStorage.getItem('speechmail_calendar_api_key') || (import.meta && import.meta.env && import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY) || '';

    this.calendarId = options.calendarId || 'primary';
    this.accessToken = null;
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
    localStorage.setItem('speechmail_calendar_api_key', apiKey);
  }

  async readCalendarEvents() {
    try {
      const dbEvents = await api.fetchEvents();
      if (dbEvents && dbEvents.length > 0) {
        return dbEvents;
      }

      if (this.apiKey) {
        const timeMin = new Date().toISOString();
        const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.calendarId)}/events?key=${this.apiKey}&timeMin=${timeMin}&singleEvents=true&orderBy=startTime`;
        
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          return (data.items || []).map(item => ({
            id: item.id,
            title: item.summary || 'Calendar Event',
            date: item.start?.dateTime ? item.start.dateTime.split('T')[0] : (item.start?.date || 'Today'),
            startTime: item.start?.dateTime ? item.start.dateTime.split('T')[1].substring(0, 5) : '09:00',
            endTime: item.end?.dateTime ? item.end.dateTime.split('T')[1].substring(0, 5) : '10:00',
            attendees: (item.attendees || []).map(a => a.email),
            description: item.description || ''
          }));
        }
      }
    } catch (e) {
      console.warn("Google Calendar API fetch error:", e);
    }
    return null;
  }

  async writeCalendarEvent(eventData) {
    try {
      const response = await api.createCalendarEvent(eventData);
      return response;
    } catch (err) {
      console.error("[GoogleCalendarService] Write Event Error:", err);
      throw err;
    }
  }
}
