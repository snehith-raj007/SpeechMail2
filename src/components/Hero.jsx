import React from 'react';

export function Hero({ onStartRecording, onTrySampleDictation }) {
  return (
    <section class="hero-section" id="containerHero">
      <div class="hero-content">
        <span class="hero-badge">
          <i class="fa-solid fa-sparkles"></i> Sarvam AI STT + Groq LLM + Google Calendar API + Neon DB Integration
        </span>
        <h2 class="hero-title">
          Compose, Send Emails & <span class="gradient-text">Manage Google Calendar with AI</span>
        </h2>
        <p class="hero-description">
          Speak naturally to generate professional emails, connect your Gmail account to send messages instantly, and perform Read, Write, and Append operations directly on Google Calendar & Neon DB.
        </p>

        <div class="hero-cta-group">
          <button class="btn btn-hero-cta" onClick={onStartRecording}>
            <i class="fa-solid fa-microphone mic-pulse-icon"></i> Start Recording Speech
          </button>
          <button class="btn btn-secondary-hero" onClick={onTrySampleDictation}>
            <i class="fa-solid fa-wand-magic-sparkles"></i> Try Sample Dictation
          </button>
        </div>

        <div class="feature-highlights-grid">
          <div class="feature-card">
            <div class="feature-icon text-cyan"><i class="fa-solid fa-microphone-lines"></i></div>
            <h3>Sarvam AI Speech STT</h3>
            <p>High-precision multi-lingual voice transcription via Saarika v2.5 model.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon text-red"><i class="fa-brands fa-google"></i></div>
            <h3>Gmail Account Integration</h3>
            <p>Connect your account to send emails directly and parse inbox messages.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon text-amber"><i class="fa-solid fa-calendar-check"></i></div>
            <h3>Google Calendar API</h3>
            <p>Read events, write new meetings, and append attendees with Neon DB persistence.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon text-emerald"><i class="fa-solid fa-database"></i></div>
            <h3>Neon DB Persistence</h3>
            <p>One-click clipboard copy, .txt / .md downloads, and persistent Neon DB history.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
