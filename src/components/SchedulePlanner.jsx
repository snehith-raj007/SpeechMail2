import React, { useState } from 'react';

export function SchedulePlanner({
  events,
  onAddEvent,
  onRemoveEvent,
  onReadGoogleCalendar,
  onOpenCalendarApiModal,
  conflictBanner
}) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('14:00');
  const [attendees, setAttendees] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddEvent({
      title: title.trim(),
      date,
      startTime,
      endTime: addOneHour(startTime),
      attendees: attendees.split(',').map(a => a.trim()).filter(Boolean),
      description: 'Scheduled via SpeechMail AI Voice Planner'
    });

    setTitle('');
    setAttendees('');
  };

  const addOneHour = (timeStr) => {
    if (!timeStr) return '15:00';
    const [h, m] = timeStr.split(':').map(Number);
    const newH = (h + 1) % 24;
    return `${newH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <section class="panel calendar-panel" id="containerCalendar">
      <div class="panel-header">
        <div class="panel-title">
          <i class="fa-solid fa-calendar-days text-amber"></i>
          <h2>AI Schedule & Google Calendar API Planner</h2>
          <span class="badge-pill badge-amber">Read • Write • Append Operations</span>
        </div>

        <div class="calendar-tools" style={{ display: 'flex', gap: '8px' }}>
          <button class="btn-pill-sm" onClick={onOpenCalendarApiModal}>
            <i class="fa-solid fa-key text-amber"></i> Config Key
          </button>
          <button class="btn-pill-sm btn-pill-accent" onClick={onReadGoogleCalendar}>
            <i class="fa-solid fa-sync"></i> Read Calendar API
          </button>
        </div>
      </div>

      <div class="schedule-status-banner">
        {conflictBanner ? (
          <div class="status-banner-content banner-warning" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
            <i class="fa-solid fa-triangle-exclamation banner-icon text-red"></i>
            <div>
              <h4 style={{ color: '#ef4444' }}>Calendar Conflict Warning</h4>
              <p>{conflictBanner}</p>
            </div>
          </div>
        ) : (
          <div class="status-banner-content banner-success">
            <i class="fa-solid fa-calendar-check banner-icon"></i>
            <div>
              <h4>Schedule Confirmed & Synced to Neon DB</h4>
              <p>No calendar conflicts detected for your active schedule.</p>
            </div>
          </div>
        )}
      </div>

      <div class="calendar-workspace-grid">
        <div class="calendar-timeline-card">
          <h3><i class="fa-solid fa-list-ul text-cyan"></i> Active Calendar Events ({events.length})</h3>
          <div class="events-list">
            {events.length === 0 ? (
              <p class="text-muted" style={{ padding: '16px' }}>No active calendar events found.</p>
            ) : (
              events.map((ev) => (
                <div class="event-card" key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <h4 style={{ margin: 0, color: '#f3f4f6' }}>{ev.title}</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#9ca3af' }}>
                      <i class="fa-regular fa-clock text-cyan"></i> {ev.date} @ {ev.startTime} - {ev.endTime}
                    </p>
                    {ev.attendees && ev.attendees.length > 0 && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                        <i class="fa-solid fa-user-group"></i> {ev.attendees.join(', ')}
                      </p>
                    )}
                  </div>
                  <button class="btn-icon danger" onClick={() => onRemoveEvent(ev.id)} title="Delete Event">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div class="calendar-form-card">
          <h3><i class="fa-solid fa-circle-plus text-emerald"></i> Schedule & Write to Google Calendar / Neon DB</h3>
          <form class="event-form" onSubmit={handleSubmit}>
            <div class="form-group">
              <label>Event Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sprint Review Meeting"
                required
              />
            </div>
            <div class="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div class="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div class="form-group">
                <label>Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
            </div>
            <div class="form-group">
              <label>Attendees (Comma Separated)</label>
              <input
                type="text"
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                placeholder="e.g. sarah@techcorp.com, lead@techcorp.com"
              />
            </div>
            <button type="submit" class="btn btn-accent-glow">
              <i class="fa-solid fa-cloud-arrow-up"></i> Write Event to Google Calendar & Neon DB
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
