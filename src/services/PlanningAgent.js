/**
 * PlanningAgent.js
 * Schedule Planning & Calendar Conflict Resolution Agent
 */

import { api } from './api.js';

export class PlanningAgent {
  constructor() {
    this.calendarEvents = [
      {
        id: 'evt-1',
        title: 'Product Strategy Sync',
        date: '2026-08-07',
        startTime: '10:00',
        endTime: '11:00',
        attendees: ['alex@techcorp.com', 'sarah@techcorp.com'],
        description: 'Weekly product roadmap discussion'
      },
      {
        id: 'evt-2',
        title: 'Client Onboarding Review',
        date: '2026-08-07',
        startTime: '15:30',
        endTime: '16:30',
        attendees: ['client@acme.org'],
        description: 'Onboarding walkthrough with client team'
      }
    ];
  }

  async loadEventsFromDB() {
    const events = await api.fetchEvents();
    if (events && events.length > 0) {
      this.calendarEvents = events;
    }
    return this.calendarEvents;
  }

  checkConflicts(newEvent) {
    const conflicts = [];
    const newStart = this.timeToMinutes(newEvent.startTime);
    const newEnd = this.timeToMinutes(newEvent.endTime);

    for (const ev of this.calendarEvents) {
      if (ev.date === newEvent.date) {
        const evStart = this.timeToMinutes(ev.startTime);
        const evEnd = this.timeToMinutes(ev.endTime);

        if ((newStart >= evStart && newStart < evEnd) || (newEnd > evStart && newEnd <= evEnd) || (newStart <= evStart && newEnd >= evEnd)) {
          conflicts.push(ev);
        }
      }
    }
    return conflicts;
  }

  async addEvent(eventData) {
    const event = {
      id: eventData.id || `evt-${Date.now()}`,
      title: eventData.title || 'Scheduled Meeting',
      date: eventData.date || new Date().toISOString().split('T')[0],
      startTime: eventData.startTime || '14:00',
      endTime: eventData.endTime || '15:00',
      attendees: eventData.attendees || [],
      description: eventData.description || 'Created via SpeechMail AI'
    };

    const conflicts = this.checkConflicts(event);
    if (conflicts.length > 0) {
      return { success: false, conflict: true, conflictingEvent: conflicts[0], message: `Conflict detected with '${conflicts[0].title}' at ${conflicts[0].startTime}` };
    }

    this.calendarEvents.push(event);
    await api.saveEvent(event);

    return { success: true, event };
  }

  async removeEvent(eventId) {
    this.calendarEvents = this.calendarEvents.filter(e => e.id !== eventId);
    await api.deleteEvent(eventId);
    return true;
  }

  timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }
}
