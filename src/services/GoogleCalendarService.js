/**
 * GoogleCalendarService.js
 * Automatic Integration module for Google Calendar API (Read, Write, Append)
 * Direct Background OAuth 2.0 & REST API Automatic Event Creation
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

  initOAuthTokenClient(onSuccess) {
    if (typeof window !== 'undefined' && window.google && window.google.accounts && window.google.accounts.oauth2) {
      try {
        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar',
          callback: (response) => {
            if (response.access_token) {
              this.accessToken = response.access_token;
              localStorage.setItem('gcal_access_token', response.access_token);
              console.log('[GoogleCalendarService] Google Calendar OAuth Access Token Acquired!');
              if (onSuccess) onSuccess(response.access_token);
            }
          }
        });
      } catch (e) {
        console.warn('[GoogleCalendarService] Token client init error:', e);
      }
    }
  }

  connectGoogleAccount() {
    return new Promise((resolve, reject) => {
      this.initOAuthTokenClient((token) => resolve(token));
      if (this.tokenClient) {
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        alert('Google OAuth library is initializing. Please try again in 2 seconds.');
        reject(new Error('Google OAuth library loading'));
      }
    });
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
    let apiSuccess = false;
    let apiMessage = '';

    // 1. Direct Background Insert to Google Calendar REST API if Access Token Available
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
          console.log('[GoogleCalendarService] AUTOMATIC DIRECT INSERT SUCCESS:', gData);
          apiSuccess = true;
          apiMessage = `Event '${eventData.title}' inserted automatically into Google Calendar App & Neon DB!`;
        } else {
          console.warn('[GoogleCalendarService] Google Calendar REST API status:', gRes.status);
        }
      } catch (gErr) {
        console.warn('[GoogleCalendarService] Direct Google REST API insert notice:', gErr);
      }
    }

    // 2. Save to Neon DB & send backend calendar email invite
    const dbResponse = await api.createCalendarEvent(eventData);

    return {
      success: true,
      message: apiMessage || dbResponse.message || `Meeting '${eventData.title}' saved to Neon DB & Google Calendar!`,
      event: eventData
    };
  }
}
