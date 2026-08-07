/**
 * GmailService.js
 * Gmail Integration Engine for SpeechMail AI
 */

import { api } from './api.js';

export class GmailService {
  constructor(options = {}) {
    this.userEmail = options.userEmail || localStorage.getItem('speechmail_gmail_email') || 'rajsrmap2@gmail.com';
    this.appPassword = options.appPassword || localStorage.getItem('speechmail_gmail_app_password') || 'kpusqkiduzbkzgvv';
    this.isConnected = true;

    this.inbox = [
      {
        id: 'msg-101',
        sender: 'Sarah Jenkins (VP Engineering)',
        senderEmail: 'sarah@techcorp.com',
        subject: 'Q3 Product Roadmap Review & Sprint Planning',
        snippet: 'Hi team, Please confirm your availability for tomorrow\'s sprint review at 2:00 PM...',
        timeAgo: '10 mins ago',
        category: 'Urgent',
        body: 'Hi team,\n\nPlease confirm your availability for tomorrow\'s sprint review at 2:00 PM. We need to align on the upcoming release milestones.'
      },
      {
        id: 'msg-102',
        sender: 'David Miller (Design Lead)',
        senderEmail: 'david@designhub.io',
        subject: 'Updated UI/UX Mockups for SpeechMail AI App',
        snippet: 'Hey! Attached are the updated design specs for dark mode and glassmorphism elements...',
        timeAgo: '1 hour ago',
        category: 'Design',
        body: 'Hey!\n\nAttached are the updated design specs for dark mode and glassmorphism elements. Let me know what you think.'
      },
      {
        id: 'msg-103',
        sender: 'HR Operations Team',
        senderEmail: 'hr@techcorp.com',
        subject: 'Reminder: Leave Application Guidelines & Policy',
        snippet: 'Dear Employees, Kindly submit your planned leaves at least 24 hours in advance...',
        timeAgo: '3 hours ago',
        category: 'HR Policy',
        body: 'Dear Employees,\n\nKindly submit your planned leaves at least 24 hours in advance through our AI speech portal or direct manager approval.'
      }
    ];
  }

  setCredentials(userEmail, appPassword) {
    this.userEmail = userEmail;
    this.appPassword = appPassword;
    this.isConnected = true;
    localStorage.setItem('speechmail_gmail_email', userEmail);
    localStorage.setItem('speechmail_gmail_app_password', appPassword);
  }

  disconnect() {
    this.userEmail = '';
    this.appPassword = '';
    this.isConnected = false;
    localStorage.removeItem('speechmail_gmail_email');
    localStorage.removeItem('speechmail_gmail_app_password');
  }

  async sendEmailDirect(to, subject, body, emailData = null) {
    try {
      const response = await api.sendEmail({
        userEmail: this.userEmail,
        appPassword: this.appPassword,
        to,
        subject,
        body,
        emailData
      });
      return response;
    } catch (err) {
      console.error("[GmailService] Send Email Error:", err);
      throw err;
    }
  }

  async getInboxMessages() {
    const dbInbox = await api.fetchInbox();
    if (dbInbox && dbInbox.length > 0) {
      return dbInbox;
    }
    return this.inbox;
  }
}
