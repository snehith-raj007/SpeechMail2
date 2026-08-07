import React from 'react';

export function Footer() {
  return (
    <footer class="app-footer" id="containerFooter">
      <div class="footer-grid">
        <div class="footer-col">
          <h3><i class="fa-solid fa-envelope-open-text text-accent"></i> SpeechMail AI</h3>
          <p>An intelligent web application converting spoken language into formatted professional emails using Sarvam AI, Groq LLM, Gmail Integration, Google Calendar API, and Neon DB.</p>
        </div>
        
        <div class="footer-col">
          <h4>Technology Stack</h4>
          <div class="tech-stack-badges">
            <span class="tech-tag"><i class="fa-solid fa-microphone-lines"></i> Sarvam AI STT</span>
            <span class="tech-tag"><i class="fa-solid fa-bolt"></i> Groq LLM</span>
            <span class="tech-tag"><i class="fa-brands fa-google"></i> Gmail API</span>
            <span class="tech-tag"><i class="fa-solid fa-database"></i> Neon DB</span>
          </div>
        </div>

        <div class="footer-col">
          <h4>Links & Repository</h4>
          <ul class="footer-links-list">
            <li><a href="https://github.com" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-github"></i> GitHub Repository</a></li>
            <li><a href="https://sarvam.ai" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-link"></i> Sarvam AI Documentation</a></li>
            <li><a href="https://groq.com" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-link"></i> Groq Cloud Console</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Contact & Info</h4>
          <p class="footer-contact"><i class="fa-regular fa-envelope"></i> contact@speechmail.ai</p>
          <p class="footer-version">SpeechMail AI Engine v5.0 • React + FastAPI + Neon DB</p>
        </div>
      </div>
    </footer>
  );
}
