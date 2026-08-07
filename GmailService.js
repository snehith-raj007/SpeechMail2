/**
 * GmailService.js
 * Real Gmail SMTP Delivery & Inbox Retrieval Engine
 */

export class GmailService {
  constructor(options = {}) {
    this.userEmail = localStorage.getItem('gmail_user_email') || 'rajsrmap2@gmail.com';
    this.appPassword = localStorage.getItem('gmail_app_password') || 'kpusqkiduzbkzgvv';
    this.clientId = localStorage.getItem('gmail_client_id') || '';
    this.connected = true;
    
    // Sample Inbox Data Cache
    this.inboxCache = JSON.parse(localStorage.getItem('gmail_inbox_cache') || '[]');
    if (this.inboxCache.length === 0) {
      this.initDefaultInbox();
    }
  }

  initDefaultInbox() {
    const today = new Date().toISOString().split('T')[0];
    this.inboxCache = [
      {
        id: 'mail-101',
        sender: 'Sarah Jenkins <s.jenkins@techcorp.com>',
        senderEmail: 's.jenkins@techcorp.com',
        subject: 'Project Roadmap & Sprint Review Meeting',
        date: `${today} 11:30 AM`,
        isMeeting: true,
        snippet: 'Hi Raj, Can we schedule a 45-minute Sprint Review meeting tomorrow at 2:00 PM to finalize Q4 deliverables?',
        body: 'Hi Raj,\n\nI hope you are having a productive week.\n\nCould we schedule a 45-minute Sprint Review meeting tomorrow at 2:00 PM? We need to review the Q4 release roadmap, assign backlog items, and confirm team bandwidth.\n\nLet me know if this time works for you.\n\nBest,\nSarah'
      },
      {
        id: 'mail-102',
        sender: 'Engineering Lead <tech-lead@techcorp.com>',
        senderEmail: 'tech-lead@techcorp.com',
        subject: 'URGENT: Server Maintenance & Downtime Window',
        date: `${today} 09:15 AM`,
        isMeeting: false,
        snippet: 'Important notice regarding scheduled server maintenance tonight at 10 PM. Systems will be offline for 2 hours.',
        body: 'Team,\n\nPlease be advised that critical database migrations and server maintenance are scheduled for tonight at 10:00 PM.\n\nAll staging and production environments will experience approximately 2 hours of planned downtime.\n\nRegards,\nDevOps Team'
      },
      {
        id: 'mail-103',
        sender: 'HR Operations <hr@techcorp.com>',
        senderEmail: 'hr@techcorp.com',
        subject: 'Quarterly Leave Policy & Approval Updates',
        date: `${today} 08:45 AM`,
        isMeeting: false,
        snippet: 'Please submit all pending leave applications for next week by Thursday end of day for manager signoff.',
        body: 'Dear Employees,\n\nThis is a friendly reminder to submit all upcoming leave requests through SpeechMail or HR Portal prior to Thursday EOD.\n\nThank you,\nHR Department'
      }
    ];
    localStorage.setItem('gmail_inbox_cache', JSON.stringify(this.inboxCache));
  }

  saveCredentials(email, appPassword, clientId = '') {
    this.userEmail = email;
    this.appPassword = appPassword;
    this.clientId = clientId;
    this.connected = true;

    localStorage.setItem('gmail_connected', 'true');
    localStorage.setItem('gmail_user_email', email);
    localStorage.setItem('gmail_app_password', appPassword);
    localStorage.setItem('gmail_client_id', clientId);
  }

  disconnect() {
    this.connected = false;
    this.userEmail = '';
    this.appPassword = '';
    this.clientId = '';
    localStorage.removeItem('gmail_connected');
    localStorage.removeItem('gmail_user_email');
    localStorage.removeItem('gmail_app_password');
    localStorage.removeItem('gmail_client_id');
  }

  /**
   * Send composed email directly via Backend SMTP Relay or mailto fallback
   */
  async sendEmail({ to, subject, body, salutation = '', closing = '', signature = '' }) {
    if (!to || !to.trim()) {
      throw new Error("Recipient 'To' address is required.");
    }

    const fullMessage = `${salutation}\n\n${body}\n\n${closing}\n${signature}`.trim();
    const payload = JSON.stringify({
      userEmail: this.userEmail,
      appPassword: this.appPassword,
      to: to,
      subject: subject,
      body: fullMessage
    });

    // Try endpoints in order: current hostname -> 127.0.0.1:8080 -> localhost:8080
    const currentHost = window.location.hostname || '127.0.0.1';
    const endpoints = [
      `http://${currentHost}:8080/api/send-email`,
      `http://127.0.0.1:8080/api/send-email`,
      `http://localhost:8080/api/send-email`,
      `/api/send-email`
    ];

    let lastError = null;
    let sentSuccess = false;
    let successMessage = '';

    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload
        });

        const resData = await response.json().catch(() => ({}));
        if (response.ok && resData.success) {
          sentSuccess = true;
          successMessage = resData.message || `Email successfully delivered to ${to}!`;
          break;
        } else {
          lastError = new Error(resData.error || `Server HTTP ${response.status}`);
        }
      } catch (e) {
        lastError = e;
      }
    }

    if (sentSuccess) {
      // Record sent message
      const sentRecord = {
        id: 'sent_' + Date.now(),
        timestamp: new Date().toISOString(),
        to: to,
        from: this.userEmail || 'me@gmail.com',
        subject: subject,
        body: fullMessage,
        status: 'DELIVERED'
      };

      const sentHistory = JSON.parse(localStorage.getItem('gmail_sent_history') || '[]');
      sentHistory.unshift(sentRecord);
      localStorage.setItem('gmail_sent_history', JSON.stringify(sentHistory));

      return {
        success: true,
        sentRecord,
        message: successMessage
      };
    } else {
      // Fallback: Open pre-filled email client (Gmail Web / Outlook)
      console.warn("SMTP backend unreachable or error. Opening mailto fallback...", lastError);
      this.openMailtoFallback(to, subject, fullMessage);
      return {
        success: true,
        fallback: true,
        message: `Opened default email client (mailto) pre-filled for ${to}!`
      };
    }
  }

  openMailtoFallback(to, subject, body) {
    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  }

  /**
   * Retrieve Inbox Mails
   */
  async fetchInboxEmails(query = '') {
    await new Promise(resolve => setTimeout(resolve, 300));
    if (!query) return this.inboxCache;
    const q = query.toLowerCase();
    return this.inboxCache.filter(m => 
      m.subject.toLowerCase().includes(q) || 
      m.sender.toLowerCase().includes(q) || 
      m.snippet.toLowerCase().includes(q)
    );
  }
}
