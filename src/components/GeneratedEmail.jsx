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
            <i class="fa-solid fa-paper-plane text-emerald" style={{ fontSize: '1.3rem' }}></i>
            <h2>Generated Email</h2>
          </div>
          <span class="badge-pill badge-emerald">Ready for Generation</span>
        </div>

        <div class="email-empty-state" style={{ padding: '40px 20px', textAlignment: 'center' }}>
          <div class="empty-icon-wrapper emerald"><i class="fa-solid fa-envelope-open-text"></i></div>
          <h3 style={{ fontSize: '1.2rem', color: '#f3f4f6', marginTop: '16px' }}>No Email Generated Yet</h3>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Record your voice or click "Generate AI Email Pipeline" to produce your formal email.</p>
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
      <div class="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div class="panel-title">
          <i class="fa-solid fa-paper-plane text-emerald" style={{ fontSize: '1.3rem' }}></i>
          <h2>Generated Email</h2>
          <span class="badge-pill badge-emerald"><i class="fa-solid fa-sparkles"></i> AI Formatted</span>
        </div>

        <div class="panel-tools" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!isEditing ? (
            <button class="btn-pill-sm btn-pill-accent" onClick={() => setIsEditing(true)} title="Edit Email">
              <i class="fa-solid fa-pen-to-square"></i> Edit Email
            </button>
          ) : (
            <button class="btn-pill-sm" style={{ background: 'rgba(16, 185, 129, 0.25)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)' }} onClick={handleSave} title="Save Edits">
              <i class="fa-solid fa-check"></i> Save Edits
            </button>
          )}

          <button class="btn-pill-sm" onClick={onCopyEmail} title="Copy Email">
            <i class="fa-regular fa-copy"></i> Copy
          </button>

          <button class="btn-pill-sm" onClick={onDownloadTxt} title="Download Email File">
            <i class="fa-solid fa-download"></i> Download
          </button>
        </div>
      </div>

      <div class="email-document-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', padding: '24px', background: 'rgba(18, 24, 38, 0.85)', backdropFilter: 'blur(16px)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '20px', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)' }}>
        
        {/* Recipient Bar */}
        <div class="email-recipient-bar" style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span class="recipient-label" style={{ fontWeight: 600, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i class="fa-solid fa-at text-emerald"></i> To:
          </span>
          <input
            type="email"
            class="input-recipient-email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="e.g. manager@techcorp.com"
            style={{ width: '100%', background: 'transparent', border: 'none', color: '#f3f4f6', outline: 'none', fontSize: '0.95rem', fontWeight: 500 }}
          />
        </div>

        {/* Subject Box */}
        <div class="email-subject-box" style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '14px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span class="subject-label" style={{ fontWeight: 600, color: '#10b981', minWidth: '70px' }}>Subject:</span>
          {!isEditing ? (
            <h3 class="email-subject-text" style={{ margin: 0, fontSize: '1.1rem', color: '#f3f4f6', fontWeight: 600 }}>{subject}</h3>
          ) : (
            <input
              type="text"
              class="styled-textarea"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{ width: '100%', background: 'transparent', border: 'none', color: '#f3f4f6', outline: 'none', fontSize: '1.05rem', fontWeight: 600 }}
            />
          )}
        </div>

        <hr class="email-divider" style={{ borderColor: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />

        {/* Email Body Content */}
        <div class="email-body-box" style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isEditing ? (
            <>
              <p class="email-greeting-text" style={{ fontSize: '1.05rem', fontWeight: 600, color: '#a855f7', margin: 0 }}>{greeting}</p>
              
              <div class="email-paragraphs-text" style={{ whiteSpace: 'pre-line', fontSize: '1rem', color: '#f3f4f6', lineHeight: 1.7 }}>
                {body}
              </div>

              <div class="email-signoff-block" style={{ marginTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '12px' }}>
                <p class="email-closing-text" style={{ margin: 0, fontWeight: 600, color: '#10b981' }}>{closing}</p>
                <p class="email-signature-text" style={{ margin: '4px 0 0 0', fontWeight: 600, color: '#f59e0b' }}>{signature}</p>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Salutation</label>
                <input
                  type="text"
                  class="styled-textarea"
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  placeholder="Greeting"
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 14px', color: '#a855f7', fontWeight: 600 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Email Body Message</label>
                <textarea
                  class="styled-textarea"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={7}
                  placeholder="Email body text..."
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', padding: '14px', color: '#f3f4f6', fontSize: '1rem', lineHeight: 1.6 }}
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Closing Sign-off</label>
                  <input
                    type="text"
                    class="styled-textarea"
                    value={closing}
                    onChange={(e) => setClosing(e.target.value)}
                    placeholder="Closing"
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 14px', color: '#10b981', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Sender Name</label>
                  <input
                    type="text"
                    class="styled-textarea"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="Signature"
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 14px', color: '#f59e0b', fontWeight: 600 }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Toolbar */}
        <div class="email-card-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '4px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {isEditing && (
              <button class="btn btn-secondary-sm" onClick={handleSave} style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                <i class="fa-solid fa-check text-emerald"></i> Save Edits
              </button>
            )}

            <button class="btn btn-send-gmail" onClick={handleSend} style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: 600 }}>
              <i class="fa-brands fa-google text-white" style={{ marginRight: '6px' }}></i> Send via Gmail
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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

      </div>
    </section>
  );
}
