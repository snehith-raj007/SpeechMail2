import React, { useState } from 'react';
import { api } from '../services/api.js';

export function ManualComposer({ onSendGmail, onSaveDraft }) {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [greeting, setGreeting] = useState('Dear Manager,');
  const [body, setBody] = useState('');
  const [closing, setClosing] = useState('Best Regards,');
  const [signature, setSignature] = useState('Raj');
  const [priority, setPriority] = useState(1);
  const [scheduledAt, setScheduledAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Preset Templates
  const templates = [
    {
      label: '🏥 Leave Request',
      recipient: 'manager@techcorp.com',
      subject: 'Leave Application for Tomorrow',
      greeting: 'Dear Sir,',
      body: 'I am writing to request leave for tomorrow due to a personal emergency at home. I will ensure all pending urgent tasks are completed before my leave and will be available over mobile if required.',
      closing: 'Sincerely,',
      signature: 'Raj',
      priority: 2
    },
    {
      label: '📅 Meeting Sync',
      recipient: 'team@techcorp.com',
      subject: 'Schedule Request: Q3 Product Roadmap Sync',
      greeting: 'Hi Team,',
      body: 'I would like to propose a 30-minute sync session tomorrow at 2:00 PM to review our Q3 sprint milestones and align on upcoming deliverables. Please confirm if this time works for everyone.',
      closing: 'Best Regards,',
      signature: 'Raj',
      priority: 1
    },
    {
      label: '⚡ Urgent Follow-up',
      recipient: 'client@acme.org',
      subject: 'URGENT: Action Required on Project Contract Approval',
      greeting: 'Dear Client,',
      body: 'I am following up regarding the project agreement sent yesterday. Kindly review and provide approval at your earliest convenience so we can initiate the execution phase without delay.',
      closing: 'Warm Regards,',
      signature: 'Raj',
      priority: 3
    }
  ];

  const applyTemplate = (tpl) => {
    setRecipient(tpl.recipient);
    setSubject(tpl.subject);
    setGreeting(tpl.greeting);
    setBody(tpl.body);
    setClosing(tpl.closing);
    setSignature(tpl.signature);
    setPriority(tpl.priority);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!recipient.trim() || !subject.trim() || !body.trim()) {
      alert('Please fill in Recipient Email, Subject, and Email Body!');
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
      setSubject('');
      setBody('');
    } catch (err) {
      alert('Send Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScheduleEmail = async () => {
    if (!recipient.trim()) {
      alert('Please enter a recipient email address (To:) before scheduling!');
      return;
    }
    if (!subject.trim()) {
      alert('Please enter an email subject before scheduling!');
      return;
    }
    if (!body.trim()) {
      alert('Please enter the email body message before scheduling!');
      return;
    }

    let targetTime = scheduledAt;
    if (!targetTime) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 2);
      targetTime = now.toISOString().slice(0, 16);
      setScheduledAt(targetTime);
    }

    setIsSubmitting(true);
    const fullBody = `${greeting}\n\n${body}\n\n${closing}\n${signature}`;

    try {
      const res = await api.scheduleEmail({
        to: recipient.trim(),
        subject: subject.trim(),
        body: fullBody,
        greeting,
        closing,
        signature,
        priority: parseInt(priority),
        scheduled_at: targetTime
      });
      alert(`⏰ ${res.message || 'Email scheduled successfully in Neon DB!'}`);
      setSubject('');
      setBody('');
    } catch (err) {
      alert('Scheduling Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDraftSave = async () => {
    if (!body.trim() && !subject.trim()) {
      alert('Please type subject or message before saving draft!');
      return;
    }

    const fullDraft = `${subject ? 'Subject: ' + subject + '\n\n' : ''}${greeting}\n\n${body}\n\n${closing}\n${signature}`;

    try {
      await onSaveDraft({
        draft_text: fullDraft,
        status: 'pending',
        confidence: 1.0
      });
      alert('Draft saved to Neon DB drafts table!');
    } catch (err) {
      alert('Error saving draft: ' + err.message);
    }
  };

  const handleCopy = () => {
    const fullText = `Subject: ${subject}\n\n${greeting}\n\n${body}\n\n${closing}\n${signature}`;
    navigator.clipboard.writeText(fullText);
    alert('Email text copied to clipboard!');
  };

  const handleDownloadTxt = () => {
    const fullText = `Subject: ${subject}\n\n${greeting}\n\n${body}\n\n${closing}\n${signature}`;
    const blob = new Blob([fullText], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${subject.replace(/[^a-z0-9]/gi, '_') || 'Manual_Email'}.txt`;
    a.click();
  };

  const handleReset = () => {
    setRecipient('');
    setSubject('');
    setGreeting('Dear Manager,');
    setBody('');
    setClosing('Best Regards,');
    setSignature('Raj');
    setPriority(1);
    setScheduledAt('');
  };

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  const charCount = body.length;

  return (
    <section class="panel composer-panel" id="containerManualCompose" style={{ marginTop: '28px' }}>
      <div class="panel-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div class="panel-title">
          <i class="fa-solid fa-pen-fancy text-cyan" style={{ fontSize: '1.4rem' }}></i>
          <div>
            <h2 style={{ fontSize: '1.35rem', margin: 0 }}>Executive Manual & Scheduled Email Composer</h2>
            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Send now, schedule for future delivery, & store directly in Neon DB</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span class="badge-pill badge-cyan">
            <i class="fa-solid fa-clock text-cyan"></i> Auto-Scheduler Active
          </span>
          <span class="badge-pill badge-purple">
            <i class="fa-solid fa-database text-purple"></i> Neon DB Synced
          </span>
        </div>
      </div>

      {/* Quick Template Selector Pills */}
      <div style={{ padding: '12px 18px', background: 'rgba(6, 182, 212, 0.05)', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i class="fa-solid fa-wand-magic-sparkles"></i> Quick Presets:
        </span>
        {templates.map((tpl, idx) => (
          <button
            key={idx}
            type="button"
            class="btn-pill-sm"
            onClick={() => applyTemplate(tpl)}
            style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)', cursor: 'pointer' }}
          >
            {tpl.label}
          </button>
        ))}
      </div>

      {/* Main Composer Card */}
      <div class="email-document-card" style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%', padding: '24px', background: 'rgba(18, 24, 38, 0.85)', backdropFilter: 'blur(16px)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '20px', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)' }}>
        
        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%' }}>
          
          {/* Row 1: Recipient & Priority Pills */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'center' }}>
            <div class="email-recipient-bar" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 14px' }}>
              <span class="recipient-label" style={{ fontWeight: 600, color: '#9ca3af' }}><i class="fa-solid fa-at text-cyan"></i> To:</span>
              <input
                type="email"
                class="input-recipient-email"
                placeholder="recipient@techcorp.com"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                style={{ width: '100%', background: 'transparent', border: 'none', color: '#f3f4f6', outline: 'none', fontSize: '0.95rem' }}
                required
              />
            </div>

            {/* Priority Selector Badges */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(0,0,0,0.25)', padding: '6px 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600, marginRight: '4px' }}>Priority:</span>
              <button
                type="button"
                onClick={() => setPriority(1)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', background: priority === 1 ? 'rgba(16, 185, 129, 0.25)' : 'transparent', color: priority === 1 ? '#10b981' : '#6b7280' }}
              >
                🟢 Normal
              </button>
              <button
                type="button"
                onClick={() => setPriority(2)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', background: priority === 2 ? 'rgba(245, 158, 11, 0.25)' : 'transparent', color: priority === 2 ? '#f59e0b' : '#6b7280' }}
              >
                🟡 Important
              </button>
              <button
                type="button"
                onClick={() => setPriority(3)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', background: priority === 3 ? 'rgba(239, 68, 68, 0.25)' : 'transparent', color: priority === 3 ? '#ef4444' : '#6b7280' }}
              >
                🔴 Urgent
              </button>
            </div>
          </div>

          {/* Row 2: Subject Line */}
          <div class="email-subject-box" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span class="subject-label" style={{ fontWeight: 600, color: '#06b6d4', minWidth: '70px' }}>Subject:</span>
            <input
              type="text"
              class="styled-textarea"
              placeholder="e.g. Leave Application for Tomorrow / Sprint Status Review"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{ width: '100%', background: 'transparent', border: 'none', color: '#f3f4f6', outline: 'none', fontSize: '1.05rem', fontWeight: 600 }}
              required
            />
          </div>

          {/* Row 2b: Scheduled Time Picker */}
          <div style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: 600, color: '#a855f7', minWidth: '180px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i class="fa-solid fa-clock"></i> Schedule Delivery Time:
            </span>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 12px', color: '#f3f4f6', fontSize: '0.95rem' }}
            />
            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Select target date & time (defaults to +2 mins if empty)</span>
          </div>

          <hr class="email-divider" style={{ borderColor: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />

          {/* Row 3: Greeting, Main Body Textarea, Sign-off & Signature */}
          <div class="email-body-box" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Salutation Picker */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="text"
                class="styled-textarea"
                placeholder="Salutation (e.g. Dear Manager,)"
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                style={{ width: '300px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 14px', color: '#a855f7', fontWeight: 600 }}
              />
              <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Quick choices:</span>
              <button type="button" class="btn-pill-sm" onClick={() => setGreeting('Dear Manager,')}>Dear Manager,</button>
              <button type="button" class="btn-pill-sm" onClick={() => setGreeting('Hi Team,')}>Hi Team,</button>
              <button type="button" class="btn-pill-sm" onClick={() => setGreeting('Respected Sir/Madam,')}>Respected Sir/Madam,</button>
            </div>

            {/* Main Email Body Textarea */}
            <div style={{ position: 'relative' }}>
              <textarea
                class="styled-textarea"
                rows={8}
                placeholder="Type your complete email message body here..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                style={{ width: '100%', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '14px', padding: '16px', color: '#f3f4f6', fontSize: '1rem', lineHeight: '1.6', outline: 'none', resize: 'vertical' }}
                required
              ></textarea>

              {/* Counters Pill */}
              <div style={{ position: 'absolute', bottom: '12px', right: '16px', display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem', color: '#9ca3af' }}>
                <span>Words: <strong style={{ color: '#06b6d4' }}>{wordCount}</strong></span>
                <span>Chars: <strong style={{ color: '#a855f7' }}>{charCount}</strong></span>
              </div>
            </div>

            {/* Closing Signoff & Signature */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Closing Sign-off</label>
                <input
                  type="text"
                  class="styled-textarea"
                  placeholder="Sign-off (e.g. Best Regards,)"
                  value={closing}
                  onChange={(e) => setClosing(e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 14px', color: '#10b981', fontWeight: 600 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Sender Name / Signature</label>
                <input
                  type="text"
                  class="styled-textarea"
                  placeholder="Sender Signature (e.g. Raj)"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 14px', color: '#f59e0b', fontWeight: 600 }}
                />
              </div>
            </div>

          </div>

          {/* Action Toolbar */}
          <div class="email-card-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="submit"
                class="btn btn-send-gmail"
                disabled={isSubmitting}
                style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: 600 }}
              >
                <i class="fa-brands fa-google text-white" style={{ marginRight: '6px' }}></i> Send Immediately
              </button>

              <button
                type="button"
                class="btn btn-pill-sm"
                onClick={handleScheduleEmail}
                disabled={isSubmitting}
                style={{ background: 'rgba(168, 85, 247, 0.25)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.5)', padding: '12px 20px', fontSize: '0.95rem', fontWeight: 600 }}
              >
                <i class="fa-solid fa-clock" style={{ marginRight: '6px' }}></i> Schedule Delivery (Neon DB Worker)
              </button>

              <button
                type="button"
                class="btn btn-pill-sm btn-pill-accent"
                onClick={handleDraftSave}
                style={{ padding: '12px 20px', fontSize: '0.95rem' }}
              >
                <i class="fa-solid fa-floppy-disk text-amber" style={{ marginRight: '6px' }}></i> Save Draft
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                class="btn btn-pill-sm"
                onClick={handleCopy}
                title="Copy full email text"
              >
                <i class="fa-regular fa-copy"></i> Copy
              </button>

              <button
                type="button"
                class="btn btn-pill-sm"
                onClick={handleDownloadTxt}
                title="Download as .txt"
              >
                <i class="fa-solid fa-file-arrow-down"></i> .txt
              </button>

              <button
                type="button"
                class="btn btn-pill-sm danger"
                onClick={handleReset}
                title="Reset Form"
              >
                <i class="fa-solid fa-arrow-rotate-left"></i> Reset
              </button>
            </div>
          </div>

        </form>

      </div>
    </section>
  );
}
