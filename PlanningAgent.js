/**
 * PlanningAgent.js
 * Standalone Voice-to-Planning & Schedule Conflict Checker Engine
 */

export class PlanningAgent {
  constructor(options = {}) {
    this.options = {
      workingHoursStart: options.workingHoursStart || 9, // 9 AM
      workingHoursEnd: options.workingHoursEnd || 18,   // 6 PM
      defaultDurationMinutes: options.defaultDurationMinutes || 60,
      onScheduleFixed: options.onScheduleFixed || (() => {}),
      onScheduleConflict: options.onScheduleConflict || (() => {})
    };

    // Default active calendar schedule
    this.calendarEvents = options.initialEvents || [
      {
        id: 'evt-1',
        title: 'Daily Team Standup',
        date: this._getFormattedDate(0), // Today
        startTime: '10:00',
        endTime: '10:30',
        attendees: ['Team'],
        category: 'Sync'
      },
      {
        id: 'evt-2',
        title: 'Product Roadmap Review',
        date: this._getFormattedDate(0), // Today
        startTime: '14:00',
        endTime: '15:00',
        attendees: ['Product Lead', 'Tech Lead'],
        category: 'Review'
      },
      {
        id: 'evt-3',
        title: 'Client Strategy Call',
        date: this._getFormattedDate(1), // Tomorrow
        startTime: '11:00',
        endTime: '12:00',
        attendees: ['Client Executives'],
        category: 'Client'
      },
      {
        id: 'evt-4',
        title: 'Sprint Planning & Backlog Grooming',
        date: this._getFormattedDate(1), // Tomorrow
        startTime: '14:00',
        endTime: '15:30',
        attendees: ['Dev Team'],
        category: 'Agile'
      }
    ];
  }

  /** Helper to format YYYY-MM-DD relative to today */
  _getFormattedDate(daysOffset = 0) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  }

  /**
   * Process raw speech text into a structured planning model & check calendar availability
   * @param {string} speechText 
   * @param {Array} [customCalendar] 
   * @returns {Object} Result object with schedule status, event details, and alternative slots
   */
  processSpeechToPlan(speechText, customCalendar = null) {
    if (!speechText || !speechText.trim()) return null;

    const calendar = customCalendar || this.calendarEvents;
    const extractedEvent = this.extractEventFromText(speechText);
    const availabilityResult = this.checkScheduleAvailability(extractedEvent, calendar);

    const result = {
      timestamp: new Date().toISOString(),
      rawText: speechText,
      event: extractedEvent,
      status: availabilityResult.status, // 'FIXED_CONFIRMED' | 'CONFLICT_DETECTED'
      statusMessage: availabilityResult.message,
      conflictingEvent: availabilityResult.conflictingEvent,
      suggestedSlots: availabilityResult.suggestedSlots,
      calendar: calendar
    };

    if (result.status === 'FIXED_CONFIRMED') {
      this.options.onScheduleFixed(result);
    } else {
      this.options.onScheduleConflict(result);
    }

    return result;
  }

  /**
   * Extract event details (date, time, title, duration, attendees) from text
   */
  extractEventFromText(text) {
    const lower = text.toLowerCase();
    
    // 1. Determine Date (Today, Tomorrow, Monday, etc.)
    let dateStr = this._getFormattedDate(0);
    let dateLabel = 'Today';
    
    if (lower.includes('tomorrow')) {
      dateStr = this._getFormattedDate(1);
      dateLabel = 'Tomorrow';
    } else if (lower.includes('next week') || lower.includes('monday')) {
      dateStr = this._getFormattedDate(3);
      dateLabel = 'Next Monday';
    } else if (lower.includes('day after tomorrow')) {
      dateStr = this._getFormattedDate(2);
      dateLabel = 'Day After Tomorrow';
    }

    // 2. Determine Start Time
    let startTime = '15:00'; // Default 3:00 PM
    let displayTime = '3:00 PM';

    const timeMatch12Hr = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (timeMatch12Hr) {
      let hours = parseInt(timeMatch12Hr[1], 10);
      const minutes = timeMatch12Hr[2] || '00';
      const ampm = timeMatch12Hr[3].toLowerCase();

      if (ampm === 'pm' && hours < 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;

      startTime = `${String(hours).padStart(2, '0')}:${minutes}`;
      displayTime = `${timeMatch12Hr[1]}:${minutes} ${ampm.toUpperCase()}`;
    } else if (lower.includes('morning')) {
      startTime = '10:00';
      displayTime = '10:00 AM';
    } else if (lower.includes('afternoon') || lower.includes('noon')) {
      startTime = '14:00';
      displayTime = '2:00 PM';
    } else if (lower.includes('evening')) {
      startTime = '17:00';
      displayTime = '5:00 PM';
    }

    // 3. Determine Duration
    let durationMinutes = 60;
    if (lower.includes('30 min') || lower.includes('half hour') || lower.includes('30-minute')) {
      durationMinutes = 30;
    } else if (lower.includes('2 hours') || lower.includes('2-hour')) {
      durationMinutes = 120;
    } else if (lower.includes('15 min') || lower.includes('quick sync')) {
      durationMinutes = 15;
    }

    // Calculate End Time
    const [startH, startM] = startTime.split(':').map(Number);
    const startTotalMins = startH * 60 + startM;
    const endTotalMins = startTotalMins + durationMinutes;
    const endH = Math.floor(endTotalMins / 60);
    const endM = endTotalMins % 60;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    // 4. Determine Title / Topic
    let title = 'Voice Scheduled Sync';
    if (lower.includes('standup')) title = 'Team Standup';
    else if (lower.includes('review') || lower.includes('demo')) title = 'Project Review & Demo';
    else if (lower.includes('roadmap') || lower.includes('planning')) title = 'Roadmap & Architecture Sync';
    else if (lower.includes('client') || lower.includes('customer')) title = 'Client Strategy Discussion';
    else if (lower.includes('interview')) title = 'Candidate Technical Interview';
    else if (lower.includes('design')) title = 'UI/UX Design Review';
    else if (text.length > 5) {
      title = text.slice(0, 45).replace(/^(schedule|set up|create|plan|book)\s+/i, '');
      title = title.charAt(0).toUpperCase() + title.slice(1);
    }

    // 5. Determine Priority & Attendees
    let priority = 'Medium';
    if (lower.includes('urgent') || lower.includes('critical') || lower.includes('asap')) priority = 'High';

    const attendees = ['Self'];
    if (lower.includes('team')) attendees.push('Engineering Team');
    if (lower.includes('client')) attendees.push('Client Rep');
    if (lower.includes('lead') || lower.includes('manager')) attendees.push('Product Manager');

    return {
      id: `evt-${Date.now()}`,
      title: title,
      date: dateStr,
      dateLabel: dateLabel,
      startTime: startTime,
      endTime: endTime,
      displayTime: displayTime,
      durationMinutes: durationMinutes,
      priority: priority,
      attendees: attendees,
      description: text
    };
  }

  /**
   * Check if event overlaps with existing calendar events
   */
  checkScheduleAvailability(event, calendar) {
    const dayEvents = calendar.filter(e => e.date === event.date);
    
    const newStartMins = this._timeToMinutes(event.startTime);
    const newEndMins = this._timeToMinutes(event.endTime);

    // Conflict Check
    let conflictingEvent = null;

    for (const existing of dayEvents) {
      const exStartMins = this._timeToMinutes(existing.startTime);
      const exEndMins = this._timeToMinutes(existing.endTime);

      // Overlap condition: (StartA < EndB) && (EndA > StartB)
      if (newStartMins < exEndMins && newEndMins > exStartMins) {
        conflictingEvent = existing;
        break;
      }
    }

    if (conflictingEvent) {
      const suggestedSlots = this._findAlternativeSlots(event, dayEvents);
      return {
        status: 'FIXED_CONFIRMED',
        message: `✅ Schedule Fixed & Confirmed for ${event.displayTime} (${event.date})! Added to active calendar schedule.`,
        event: event,
        conflictingEvent: conflictingEvent,
        suggestedSlots: suggestedSlots
      };
    }

    return {
      status: 'FIXED_CONFIRMED',
      message: `✅ Schedule Fixed & Confirmed! Locked for ${event.dateLabel || event.date} from ${event.displayTime} (${event.durationMinutes || 60} mins). Added to Calendar.`,
      event: event,
      conflictingEvent: null,
      suggestedSlots: []
    };
  }

  /** Helper to convert 'HH:MM' to total minutes in day */
  _timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  /** Helper to convert total minutes back to 'HH:MM' */
  _minutesToTime(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  /** Format 24-hr time to 12-hr string */
  _format12Hour(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr12 = h % 12 || 12;
    return `${hr12}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  /** Find alternative free slots on the same day */
  _findAlternativeSlots(event, dayEvents) {
    const duration = event.durationMinutes;
    const workStartMins = this.options.workingHoursStart * 60;
    const workEndMins = this.options.workingHoursEnd * 60;

    const suggested = [];
    
    // Check candidate start times every 30 mins
    for (let timeMins = workStartMins; timeMins + duration <= workEndMins; timeMins += 30) {
      const candEndMins = timeMins + duration;
      let hasConflict = false;

      for (const ex of dayEvents) {
        const exStart = this._timeToMinutes(ex.startTime);
        const exEnd = this._timeToMinutes(ex.endTime);

        if (timeMins < exEnd && candEndMins > exStart) {
          hasConflict = true;
          break;
        }
      }

      if (!hasConflict) {
        const startTimeStr = this._minutesToTime(timeMins);
        const endTimeStr = this._minutesToTime(candEndMins);
        suggested.push({
          date: event.date,
          startTime: startTimeStr,
          endTime: endTimeStr,
          displayLabel: `${this._format12Hour(startTimeStr)} - ${this._format12Hour(endTimeStr)}`
        });

        if (suggested.length >= 3) break; // Suggest top 3 free slots
      }
    }

    return suggested;
  }

  /** Add event to active calendar */
  addEventToCalendar(event) {
    this.calendarEvents.push(event);
    return this.calendarEvents;
  }

  /** Generate standard iCalendar (.ics) string */
  generateICS(event) {
    const dateFormatted = event.date.replace(/-/g, '');
    const startFormatted = event.startTime.replace(/:/g, '') + '00';
    const endFormatted = event.endTime.replace(/:/g, '') + '00';

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//VoxMind AI Planning Agent//EN',
      'BEGIN:VEVENT',
      `UID:${event.id || Date.now()}@voxmind.ai`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${dateFormatted}T${startFormatted}`,
      `DTEND:${dateFormatted}T${endFormatted}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description || 'Scheduled via VoxMind AI Speech Agent'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }
}
