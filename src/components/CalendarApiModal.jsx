import React, { useState, useEffect } from 'react';

export function CalendarApiModal({ isOpen, onClose, onSave, currentApiKey, currentCalendarId }) {
  const [apiKey, setApiKey] = useState('');
  const [calendarId, setCalendarId] = useState('primary');

  useEffect(() => {
    setApiKey(currentApiKey || '');
    setCalendarId(currentCalendarId || 'primary');
  }, [currentApiKey, currentCalendarId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(apiKey.trim(), calendarId.trim());
    onClose();
  };

  return (
    <div class="modal-backdrop open">
      <div class="modal-box">
        <div class="modal-header">
          <h3><i class="fa-solid fa-key text-amber"></i> Google Calendar API Configuration</h3>
          <button class="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div class="modal-body">
          <p class="modal-description">Enter your Google Calendar API Key to perform live Read, Write, and Append operations directly on Google Calendar API v3.</p>
          
          <form class="gmail-setup-form" onSubmit={handleSubmit}>
            <div class="form-group">
              <label>Google Calendar API Key</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="e.g. AIzaSyD..."
                required
              />
              <small class="form-hint">Obtained from Google Cloud Console -&gt; Credentials -&gt; API Keys</small>
            </div>
            <div class="form-group">
              <label>Calendar ID (Optional)</label>
              <input
                type="text"
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}
                placeholder="primary"
              />
            </div>
            <div class="modal-actions">
              <button type="submit" class="btn btn-accent-glow">
                <i class="fa-solid fa-floppy-disk"></i> Save Calendar Key
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
