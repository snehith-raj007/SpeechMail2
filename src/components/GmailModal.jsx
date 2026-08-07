import React, { useState, useEffect } from 'react';

export function GmailModal({ isOpen, onClose, onSave, onDisconnect, currentEmail, currentAppPassword }) {
  const [email, setEmail] = useState('');
  const [appPassword, setAppPassword] = useState('');

  useEffect(() => {
    setEmail(currentEmail || 'rajsrmap2@gmail.com');
    setAppPassword(currentAppPassword || '');
  }, [currentEmail, currentAppPassword, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(email.trim(), appPassword.trim());
    onClose();
  };

  return (
    <div class="modal-backdrop open">
      <div class="modal-box">
        <div class="modal-header">
          <h3><i class="fa-brands fa-google text-red"></i> Connect Gmail Account</h3>
          <button class="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div class="modal-body">
          <p class="modal-description">Connect your Gmail account to compose and send emails directly from SpeechMail AI and retrieve inbox messages for schedule planning.</p>
          
          <form class="gmail-setup-form" onSubmit={handleSubmit}>
            <div class="form-group">
              <label>Gmail Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. yourname@gmail.com"
                required
              />
            </div>
            <div class="form-group">
              <label>App Password / Passcode</label>
              <input
                type="password"
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                placeholder="16-character App Password"
                required
              />
              <small class="form-hint">Generated via Google Account -&gt; Security -&gt; App passwords</small>
            </div>
            <div class="modal-actions">
              {currentEmail && (
                <button
                  type="button"
                  class="btn btn-secondary-sm danger"
                  onClick={() => { onDisconnect(); onClose(); }}
                >
                  Disconnect Account
                </button>
              )}
              <button type="submit" class="btn btn-accent-glow">
                <i class="fa-solid fa-plug"></i> Save & Connect Gmail
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
