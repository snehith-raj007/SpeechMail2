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
  const [attendees, setAttendees] = useState('rajsrmap2@gmail.com');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addOneHour = (timeStr) => {
    if (!timeStr) return '15:00';
    const [h, m] = timeStr.split(':').map(Number);
    const newH = (h + 1) % 24;
    return `${newH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const getGoogleCalendarUrl = (ev) => {
    const title = encodeURIComponent(ev.title || 'Meeting');
    const details = encodeURIComponent(ev.description || 'Scheduled via SpeechMail AI Voice Planner');
    const dateStr = ev.date ? ev.date.replace(/-/g, '') : new Date().toISOString().split('T')[0].replace(/-/g, '');
    const startStr = ev.startTime ? ev.startTime.replace(':', '') + '00' : '140000';
    const endStr = ev.endTime ? ev.endTime.replace(':', '') + '00' : '150000';

    const startISO = `${dateStr}T${startStr}`;
    const endISO = `${dateStr}T${endStr}`;
    const datesParam = `${startISO}/${endISO}`;

    let url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${datesParam}&details=${details}`;
    if (ev.attendees && ev.attendees.length > 0) {
      const attList = Array.isArray(ev.attendees) ? ev.attendees.join(',') : ev.attendees;
      url += `&add=${encodeURIComponent(attList)}`;
    }
    return url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter an event title!');
      return;
    }

    setIsSubmitting(true);

    const newEvt = {
      title: title.trim(),
      date,
      startTime,
      endTime: addOneHour(startTime),
      attendees: attendees.split(',').map(a => a.trim()).filter(Boolean),
      description: 'Scheduled via SpeechMail AI Voice Planner'
    };

    try {
      // Direct one-click event save to Neon DB & Google Calendar Backend
      await onAddEvent(newEvt);
      setTitle('');
      setAttendees('rajsrmap2@gmail.com');
    } catch (err) {
      alert('Error saving event: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section class="panel calendar-panel" id="containerCalendar" style={{ marginTop: '28px' }}>
      <div class="panel-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div class="panel-title">
          <i class="fa-solid fa-calendar-days text-amber" style={{ fontSize: '1.3rem' }}></i>
          <div>
            <h2 style={{ fontSize: '1.35rem', margin: 0 }}>AI Schedule & Google Calendar Integration</h2>
            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Syncs directly with Google Calendar & Neon DB</span>
          </div>
        </div>

        <div class="calendar-tools" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button class="btn-pill-sm" onClick={onOpenCalendarApiModal}>
            <i class="fa-solid fa-key text-amber"></i> OAuth Credentials
          </button>
          <button class="btn-pill-sm btn-pill-accent" onClick={onReadGoogleCalendar}>
            <i class="fa-solid fa-sync"></i> Read Calendar API
          </button>
          <a
            href="https://calendar.google.com/calendar/u/0/r/month"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-pill-sm"
            style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.4)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <i class="fa-brands fa-google"></i> Open Google Calendar App
          </a>
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
          <div class="status-banner-content banner-success" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '14px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <i class="fa-solid fa-calendar-check banner-icon text-emerald" style={{ fontSize: '1.4rem' }}></i>
            <div>
              <h4 style={{ color: '#10b981', margin: 0 }}>Schedule Synced to Google Calendar & Neon DB</h4>
              <p style={{ margin: '4px 0 0 0', color: '#9ca3af', fontSize: '0.85rem' }}>No calendar conflicts detected for your active schedule.</p>
            </div>
          </div>
        )}
      </div>

      <div class="calendar-workspace-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        
        {/* Active Events List */}
        <div class="calendar-timeline-card" style={{ background: 'rgba(18, 24, 38, 0.85)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '18px', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
          <h3 style={{ fontSize: '1.15rem', color: '#f3f4f6', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i class="fa-solid fa-list-ul text-amber"></i> Active Scheduled Events ({events.length})
          </h3>
          
          <div class="events-list">
            {events.length === 0 ? (
              <p class="text-muted" style={{ padding: '16px', textAlign: 'center' }}>No active calendar events found.</p>
            ) : (
              events.map((ev) => (
                <div class="event-card" key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '14px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div>
                    <h4 style={{ margin: 0, color: '#f3f4f6', fontSize: '1.05rem' }}>{ev.title}</h4>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.88rem', color: '#06b6d4', fontWeight: 500 }}>
                      <i class="fa-regular fa-clock"></i> {ev.date} @ {ev.startTime} - {ev.endTime}
                    </p>
                    {ev.attendees && (Array.isArray(ev.attendees) ? ev.attendees.length > 0 : ev.attendees) && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#9ca3af' }}>
                        <i class="fa-solid fa-user-group text-purple"></i> {Array.isArray(ev.attendees) ? ev.attendees.join(', ') : ev.attendees}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <a
                      href={getGoogleCalendarUrl(ev)}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="btn-pill-sm"
                      style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '6px 10px' }}
                      title="Open in Google Calendar web app"
                    >
                      <i class="fa-brands fa-google"></i> + Add to Google Calendar
                    </a>

                    <button class="btn-icon danger" onClick={() => onRemoveEvent(ev.id)} title="Delete Event">
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Schedule Form */}
        <div class="calendar-form-card" style={{ background: 'rgba(18, 24, 38, 0.85)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '18px', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
          <h3 style={{ fontSize: '1.15rem', color: '#f3f4f6', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i class="fa-solid fa-circle-plus text-emerald"></i> Schedule New Google Calendar Event
          </h3>
          
          <form class="event-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div class="form-group">
              <label style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Event Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sprint Review Meeting / Q3 Roadmap Sync"
                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', color: '#f3f4f6' }}
                required
              />
            </div>

            <div class="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div class="form-group">
                <label style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', color: '#f3f4f6' }}
                  required
                />
              </div>

              <div class="form-group">
                <label style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', color: '#f3f4f6' }}
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Attendees Email</label>
              <input
                type="text"
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                placeholder="e.g. rajsrmap2@gmail.com, team@techcorp.com"
                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', color: '#f3f4f6' }}
              />
            </div>

            <button
              type="submit"
              class="btn btn-accent-glow"
              disabled={isSubmitting}
              style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 600, marginTop: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            >
              <i class="fa-brands fa-google"></i> Save Event to Google Calendar & Neon DB
            </button>
          </form>
        </div>

      </div>
    </section>
  );
}
