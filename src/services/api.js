/**
 * API Client connecting React Frontend to Python FastAPI Backend & Neon DB
 */

const API_BASE = '/api';

export const api = {
  // 1. Send Email via Gmail SMTP and save to Neon DB
  sendEmail: async (emailData) => {
    const res = await fetch(`${API_BASE}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to send email' }));
      throw new Error(err.detail || 'Email delivery failed');
    }
    return await res.json();
  },

  // 2. Create Google Calendar Event and save to Neon DB
  createCalendarEvent: async (eventData) => {
    const res = await fetch(`${API_BASE}/create-calendar-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create calendar event' }));
      throw new Error(err.detail || 'Calendar event creation failed');
    }
    return await res.json();
  },

  // 3. Email History (Neon DB)
  fetchHistory: async () => {
    try {
      const res = await fetch(`${API_BASE}/history`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  saveHistoryItem: async (item) => {
    try {
      const res = await fetch(`${API_BASE}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      return await res.json();
    } catch (e) {
      console.warn("History save error:", e);
      return null;
    }
  },

  deleteHistoryItem: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/history/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch (e) {
      console.warn("History delete error:", e);
      return null;
    }
  },

  // 3b. Save Draft to Neon DB
  saveDraft: async (draftData) => {
    const res = await fetch(`${API_BASE}/db/drafts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draftData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to save draft' }));
      throw new Error(err.detail || 'Failed to save draft');
    }
    return await res.json();
  },


  clearAllHistory: async () => {
    try {
      const res = await fetch(`${API_BASE}/history`, { method: 'DELETE' });
      return await res.json();
    } catch (e) {
      console.warn("Clear history error:", e);
      return null;
    }
  },

  // 4. Calendar Events (Neon DB)
  fetchEvents: async () => {
    try {
      const res = await fetch(`${API_BASE}/events`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  saveEvent: async (ev) => {
    try {
      const res = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ev)
      });
      return await res.json();
    } catch (e) {
      console.warn("Save event error:", e);
      return null;
    }
  },

  deleteEvent: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch (e) {
      console.warn("Delete event error:", e);
      return null;
    }
  },

  // 6. Scheduled Email Delivery (Neon DB + Async Worker)
  scheduleEmail: async (data) => {
    const res = await fetch(`${API_BASE}/scheduled-emails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to schedule email' }));
      throw new Error(err.detail || 'Scheduling failed');
    }
    return await res.json();
  },

  fetchScheduledEmails: async () => {
    try {
      const res = await fetch(`${API_BASE}/scheduled-emails`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  deleteScheduledEmail: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/scheduled-emails/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch {
      return null;
    }
  },

  // 7. AI Email Summarizer
  summarizeEmail: async (emailData) => {
    const res = await fetch(`${API_BASE}/summarize-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to summarize email' }));
      throw new Error(err.detail || 'Summarization failed');
    }
    return await res.json();
  },

  // 8. Summarize All Inbox & Persist in Neon DB Memory
  summarizeAllInbox: async () => {
    const res = await fetch(`${API_BASE}/summarize-all-inbox`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to process all inbox emails' }));
      throw new Error(err.detail || 'Summarize all inbox failed');
    }
    return await res.json();
  },

  fetchEmailSummaries: async () => {
    try {
      const res = await fetch(`${API_BASE}/email-summaries`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },



  // 5. Inbox Messages (Neon DB)
  fetchInbox: async () => {
    try {
      const res = await fetch(`${API_BASE}/inbox`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }
};
