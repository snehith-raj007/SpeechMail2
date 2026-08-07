/**
 * GoogleCalendarService.js
 * Integration module for Google Calendar API operations (Read, Write, Append)
 * Direct OAuth 2.0 & REST API Automatic Event Creation
 */

import { api } from './api.js';

export class GoogleCalendarService {
  constructor(options = {}) {
    this.clientId = options.clientId || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_CLIENT_ID) || '129948569076-v14468lnfo1mtbioodg9auvgkivd6lbm.apps.googleusercontent.com';
    this.apiKey = options.apiKey || localStorage.getItem('speechmail_calendar_api_key') || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY) || '';
    this.calendarId = options.calendarId || 'primary';
    this.accessToken = localStorage.getItem('gcal_access_token') || null;
    this.tokenClient = null;

    this.initOAuthTokenClient();
  }

  initOAuthTokenClient() {
    if (typeof window !== 'undefined' && window.google && window.google.accounts && window.google.accounts.oauth2) {
      try {
        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar',
          callback: (response) => {
            if (response.access_token) {
              this.accessToken = response.access_token;
              localStorage.setItem('gcal_access_token', response.access_token);
              console.log('[GoogleCalendarService] OAuth Access Token acquired successfully!');
            }
          }
        });
      } catch (e) {
        console.warn('[GoogleCalendarService] Token client init error:', e);
      }
    }
  }

  async requestCalendarPermission() {
    if (!this.tokenClient) {
      this.initOAuthTokenClient();
    }
    if (this.tokenClient) {
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    }
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
      // 1. Save to Neon DB & send backend calendar invite
      const response = await api.createCalendarEvent(eventData);

      // 2. Automatically insert directly into Google Calendar via REST API if token available
      const token = this.accessToken || localStorage.getItem('gcal_access_token');
      if (token) {
        try {
          const startISO = `${eventData.date}T${eventData.startTime || '14:00'}:00+05:30`;
          const endISO = `${eventData.date}T${eventData.endTime || '15:00'}:00+05:30`;
          const attendeesList = Array.isArray(eventData.attendees) 
            ? eventData.attendees.map(a => ({ email: typeof a === 'string' ? a : a.email }))
            : [{ email: eventData.attendees || 'rajsrmap2@gmail.com' }];

          const gcalBody = {
            summary: eventData.title,
            description: eventData.description || 'Scheduled automatically via SpeechMail AI Voice Planner',
            start: { dateTime: startISO, timeZone: 'Asia/Kolkata' },
            end: { dateTime: endISO, timeZone: 'Asia/Kolkata' },
            attendees: attendeesList
          };

          const gRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(gcalBody)
          });

          if (gRes.ok) {
            const gData = await gRes.json();
            console.log('[GoogleCalendarService] Event inserted directly into Google Calendar:', gData);
          }
        } catch (gErr) {
          console.warn('[GoogleCalendarService] Direct Google REST API insert notice:', gErr);
        }
      }

      return response;
    } catch (err) {
      console.error("[GoogleCalendarService] Write Event Error:", err);
      throw err;
    }
  }
}
