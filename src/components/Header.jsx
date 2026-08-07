import React from 'react';

export function Header({
  activeLanguage,
  setActiveLanguage,
  onOpenGmailModal,
  userEmail
}) {
  return (
    <header class="app-header" id="containerHeader">
      <div class="header-brand">
        <div class="brand-logo">
          <i class="fa-solid fa-envelope-open-text logo-icon"></i>
        </div>
        <div class="brand-info">
          <h1>SpeechMail <span class="badge-tag">ANTIGRAVITY AI</span></h1>
          <p>AI Speech-to-Email Generator & Schedule Planner</p>
        </div>
      </div>

      <nav class="header-nav" aria-label="Main Navigation">
        <a href="#containerHero" class="nav-link active"><i class="fa-solid fa-house"></i> Home</a>
        <a href="#containerRecorder" class="nav-link"><i class="fa-solid fa-microphone"></i> Recorder</a>
        <a href="#containerManualCompose" class="nav-link"><i class="fa-solid fa-pen-nib text-cyan"></i> Manual Compose</a>
        <a href="#containerPipeline" class="nav-link"><i class="fa-solid fa-gears"></i> AI Pipeline</a>
        <a href="#containerEmail" class="nav-link"><i class="fa-solid fa-paper-plane"></i> Email View</a>
        <a href="#containerInbox" class="nav-link"><i class="fa-solid fa-inbox"></i> Inbox Mails</a>
        <a href="#containerCalendar" class="nav-link"><i class="fa-solid fa-calendar-days"></i> Schedule & Meetings</a>
        <a href="#containerHistory" class="nav-link"><i class="fa-solid fa-clock-rotate-left"></i> History</a>

      </nav>

      <div class="header-actions">
        <div class="lang-selector-wrapper">
          <i class="fa-solid fa-globe lang-icon"></i>
          <select
            class="styled-select"
            value={activeLanguage}
            onChange={(e) => setActiveLanguage(e.target.value)}
            aria-label="Speech Recognition Language"
          >
            <option value="en-IN">English (Global / India)</option>
            <option value="hi-IN">Hindi (हिंदी)</option>
            <option value="bn-IN">Bengali (বাংলা)</option>
            <option value="ta-IN">Tamil (தமிழ்)</option>
            <option value="te-IN">Telugu (తెలుగు)</option>
            <option value="mr-IN">Marathi (मराठी)</option>
            <option value="es-ES">Spanish (Español)</option>
            <option value="fr-FR">French (Français)</option>
            <option value="de-DE">German (Deutsch)</option>
          </select>
        </div>

        <div
          class="user-profile-badge"
          title="Gmail & Google Calendar Backend API Active"
          onClick={onOpenGmailModal}
          style={{ cursor: 'pointer' }}
        >
          <div class="avatar"><i class="fa-brands fa-google text-red"></i></div>
          <span class="user-name">{userEmail || 'rajsrmap2@gmail.com'}</span>
        </div>
      </div>
    </header>
  );
}
