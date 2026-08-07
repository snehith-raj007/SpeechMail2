import React, { useState } from 'react';

export function ManualComposer({ onSendGmail, onSaveDraft }) {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [greeting, setGreeting] = useState('Dear Manager,');
  const [body, setBody] = useState('');
  const [closing, setClosing] = useState('Best Regards,');
  const [signature, setSignature] = useState('Raj');
  const [priority, setPriority] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!recipient.trim() || !subject.trim() || !body.trim()) {
      alert('Please fill in Recipient, Subject, and Email Body!');
      return;
    }

    setIsSubmitting(true);
    const fullBody = `${greeting}\n\n${body}\n\n${closing}\n${signature}`;

    try {
      await onSendGmail({
        to: recipient.trim(),
        subject: subject.trim(),
        body: fullBody,
        greeting,
        closing,
        signature,
        priority: parseInt(priority)
      });
      // Clear form after successful send
      setSubject('');
      setBody('');
    } catch (err) {
      alert('Send Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDraftSave = async () => {
    if (!body.trim() && !subject.trim()) {
      alert('Please type subject or body before saving draft!');
      return;
    }

    const fullDraft = `${subject ? 'Subject: ' + subject + '\n\n' : ''}${greeting}\n\n${body}\n\n${closing}\n${signature}`;

    try {
      await onSaveDraft({
        draft_text: fullDraft,
        status: 'pending',
        confidence: 1.0
      });
      alert('Draft saved successfully to Neon DB!');
    } catch (err) {
      alert('Error saving draft: ' + err.message);
    }
  };

  const handleCopy = () => {
    const fullText = `Subject: ${subject}\n\n${greeting}\n\n${body}\n\n${closing}\n${signature}`;
    navigator.clipboard.writeText(fullText);
    alert('Manual email copied to clipboard!');
  };

  const handleDownloadTxt = () => {
    const fullText = `Subject: ${subject}\n\n${greeting}\n\n${body}\n\n${closing}\n${signature}`;
    const blob = new Blob([fullText], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${subject || 'Manual_Email'}.txt`;
    a.click();
  };

  return (
    <section class="panel composer-panel" id="containerManualCompose" style={{ marginTop: '24px' }}>
      <div class="panel-header">
        <div class="panel-title">
          <i class="fa-solid fa-pen-nib text-cyan"></i>
          <h2>Manual Email Composer</h2>
          <span class="badge-pill badge-cyan">Direct Email & Neon DB Drafts</span>
        </div>
      </div>

      <div class="email-document-card" style={{ display: 'flex', width: '100%', border: '1px solid rgba(6, 182, 212, 0.3)', boxShadow: '0 8px 32px rgba(6, 182, 212, 0.1)' }}>
        <form onSubmit={handleSend} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Row 1: Recipient & Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <div class="email-recipient-bar">
              <span class="recipient-label"><i class="fa-solid fa-at text-muted"></i> To:</span>
              <input
                type="email"
                class="input-recipient-email"
                placeholder="recipient@techcorp.com"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                required
              />
            </div>

            <div class="form-group" style={{ margin: 0 }}>
              <select
                class="styled-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{ width: '100%', height: '100%' }}
              >
                <option value={1}>Priority: Normal (1)</option>
                <option value={2}>Priority: Important (2)</option>
                <option value={3}>Priority: Urgent (3)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Subject */}
          <div class="email-subject-box">
            <span class="subject-label">Subject:</span>
            <input
              type="text"
              class="styled-textarea"
              placeholder="e.g. Project Deliverable Status Update"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{ padding: '8px 14px', fontSize: '1.05rem' }}
              required
            />
          </div>

          <hr class="email-divider" />

          {/* Row 3: Greeting, Body, Closing, Signature */}
          <div class="email-body-box" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              class="styled-textarea"
              placeholder="Salutation (e.g. Dear Team,)"
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              style={{ padding: '6px 12px' }}
            />

            <textarea
              class="styled-textarea"
              rows={7}
              placeholder="Type your formal email text message here manually..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            ></textarea>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input
                type="text"
                class="styled-textarea"
                placeholder="Sign-off (e.g. Best Regards,)"
                value={closing}
                onChange={(e) => setClosing(e.target.value)}
                style={{ padding: '6px 12px' }}
              />

              <input
                type="text"
                class="styled-textarea"
                placeholder="Sender Signature (e.g. Raj)"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                style={{ padding: '6px 12px' }}
              />
            </div>
          </div>

          {/* Action Toolbar */}
          <div class="email-card-actions" style={{ marginTop: '8px' }}>
            <button
              type="submit"
              class="btn btn-send-gmail"
              disabled={isSubmitting}
            >
              <i class="fa-brands fa-google text-white"></i> Send via Gmail & Save to Neon DB
            </button>

            <button
              type="button"
              class="btn btn-pill-sm btn-pill-accent"
              onClick={handleDraftSave}
            >
              <i class="fa-solid fa-floppy-disk"></i> Save Draft to Neon DB
            </button>

            <button
              type="button"
              class="btn btn-pill-sm"
              onClick={handleCopy}
            >
              <i class="fa-regular fa-copy"></i> Copy
            </button>

            <button
              type="button"
              class="btn btn-pill-sm"
              onClick={handleDownloadTxt}
            >
              <i class="fa-solid fa-file-arrow-down"></i> .txt
            </button>
          </div>

        </form>
      </div>
    </section>
  );
}
