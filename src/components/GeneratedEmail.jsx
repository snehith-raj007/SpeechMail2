import React, { useState, useEffect } from 'react';

export function GeneratedEmail({
  email,
  onSendGmail,
  onCopyEmail,
  onDownloadTxt,
  onDownloadMd
}) {
  const [recipient, setRecipient] = useState('manager@techcorp.com');
  const [isEditing, setIsEditing] = useState(false);

  const [subject, setSubject] = useState('');
  const [greeting, setGreeting] = useState('');
  const [body, setBody] = useState('');
  const [closing, setClosing] = useState('');
  const [signature, setSignature] = useState('');

  useEffect(() => {
    if (email) {
      setSubject(email.subject || '');
      setGreeting(email.greeting || '');
      setBody(email.body || '');
      setClosing(email.closing || '');
      setSignature(email.signature || '');
    }
  }, [email]);

  if (!email) {
    return (
      <section class="panel email-panel" id="containerEmail">
        <div class="panel-header">
          <div class="panel-title">
            <i class="fa-solid fa-paper-plane text-emerald"></i>
            <h2>Generated Email</h2>
          </div>
        </div>

        <div class="email-empty-state">
          <div class="empty-icon-wrapper emerald"><i class="fa-solid fa-envelope-open-text"></i></div>
          <h3>No Email Generated Yet</h3>
          <p>Record your voice or click "Generate AI Email Pipeline" to produce your formal email.</p>
        </div>
      </section>
    );
  }

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleSend = () => {
    const fullBody = `${greeting}\n\n${body}\n\n${closing}\n${signature}`;
    onSendGmail({
      to: recipient,
      subject,
      body: fullBody,
      greeting,
      closing,
      signature
    });
  };

  return (
    <section class="panel email-panel" id="containerEmail">
      <div class="panel-header">
        <div class="panel-title">
          <i class="fa-solid fa-paper-plane text-emerald"></i>
          <h2>Generated Email</h2>
        </div>
        <div class="panel-tools">
          {!isEditing ? (
            <button class="btn-icon" onClick={() => setIsEditing(true)} title="Edit Email">
              <i class="fa-solid fa-pen-to-square"></i> Edit
            </button>
          ) : (
            <button class="btn-icon text-emerald" onClick={handleSave} title="Save Edits">
              <i class="fa-solid fa-check"></i> Save
            </button>
          )}
          <button class="btn-icon" onClick={onCopyEmail} title="Copy Email">
            <i class="fa-regular fa-copy"></i> Copy
          </button>
          <button class="btn-icon text-cyan" onClick={onDownloadTxt} title="Download Email File">
            <i class="fa-solid fa-download"></i> Download
          </button>
        </div>
      </div>

      <div class="email-document-card" style={{ display: 'flex' }}>
        <div class="email-recipient-bar">
          <span class="recipient-label"><i class="fa-solid fa-at text-muted"></i> To:</span>
          <input
            type="email"
            class="input-recipient-email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="e.g. manager@techcorp.com"
          />
        </div>

        <div class="email-subject-box">
          <span class="subject-label">Subject:</span>
          {!isEditing ? (
            <h3 class="email-subject-text">{subject}</h3>
          ) : (
            <input
              type="text"
              class="styled-textarea"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{ width: '100%', padding: '6px 12px', fontSize: '1.1rem' }}
            />
          )}
        </div>

        <hr class="email-divider" />

        <div class="email-body-box">
          {!isEditing ? (
            <>
              <p class="email-greeting-text">{greeting}</p>
              <div class="email-paragraphs-text" style={{ whiteSpace: 'pre-line' }}>{body}</div>
              <div class="email-signoff-block">
                <p class="email-closing-text">{closing}</p>
                <p class="email-signature-text">{signature}</p>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                class="styled-textarea"
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                placeholder="Greeting"
              />
              <textarea
                class="styled-textarea"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                placeholder="Email body text..."
              ></textarea>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  class="styled-textarea"
                  value={closing}
                  onChange={(e) => setClosing(e.target.value)}
                  placeholder="Closing"
                />
                <input
                  type="text"
                  class="styled-textarea"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Signature"
                />
              </div>
            </div>
          )}
        </div>

        <div class="email-card-actions">
          {isEditing && (
            <button class="btn btn-secondary-sm" onClick={handleSave}>
              <i class="fa-solid fa-check text-emerald"></i> Save Edits
            </button>
          )}

          <button class="btn btn-send-gmail" onClick={handleSend}>
            <i class="fa-brands fa-google text-white"></i> Send via Gmail
          </button>

          <button class="btn btn-pill-sm btn-pill-accent" onClick={onCopyEmail}>
            <i class="fa-regular fa-copy"></i> Copy Email
          </button>
          <button class="btn btn-pill-sm" onClick={onDownloadTxt}>
            <i class="fa-solid fa-file-arrow-down"></i> .txt
          </button>
          <button class="btn btn-pill-sm" onClick={onDownloadMd}>
            <i class="fa-brands fa-markdown"></i> .md
          </button>
        </div>
      </div>
    </section>
  );
}
