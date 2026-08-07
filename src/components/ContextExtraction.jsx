import React from 'react';

export function ContextExtraction({ context }) {
  if (!context) {
    return (
      <section class="panel context-panel" id="containerContext">
        <div class="panel-header">
          <div class="panel-title">
            <i class="fa-solid fa-layer-group text-amber"></i>
            <h2>Context Extraction</h2>
            <span class="badge-pill badge-amber">Extracted Intent JSON</span>
          </div>
        </div>

        <div class="context-empty-state">
          <p><i class="fa-solid fa-info-circle text-amber"></i> Context details will appear here once the AI pipeline runs.</p>
        </div>
      </section>
    );
  }

  return (
    <section class="panel context-panel" id="containerContext">
      <div class="panel-header">
        <div class="panel-title">
          <i class="fa-solid fa-layer-group text-amber"></i>
          <h2>Context Extraction</h2>
          <span class="badge-pill badge-amber">Extracted Intent JSON</span>
        </div>
      </div>

      <div class="context-grid" style={{ display: 'grid' }}>
        <div class="context-card">
          <span class="context-card-label"><i class="fa-solid fa-bullseye text-cyan"></i> Detected Intent</span>
          <p class="context-card-value">{context.intent || 'Leave Request'}</p>
        </div>

        <div class="context-card">
          <span class="context-card-label"><i class="fa-solid fa-user-tag text-purple"></i> Recipient</span>
          <p class="context-card-value">{context.recipient || 'Manager / Sir'}</p>
        </div>

        <div class="context-card">
          <span class="context-card-label"><i class="fa-solid fa-envelope-open text-emerald"></i> Email Type</span>
          <p class="context-card-value">{context.email_type || 'Leave Application'}</p>
        </div>

        <div class="context-card">
          <span class="context-card-label"><i class="fa-solid fa-sliders text-amber"></i> Tone</span>
          <p class="context-card-value">{context.tone || 'Polite & Urgent'}</p>
        </div>

        <div class="context-card full-width">
          <span class="context-card-label"><i class="fa-solid fa-list-check text-cyan"></i> Key Points</span>
          <ul class="context-list">
            {(context.key_points || []).map((pt, i) => (
              <li key={i}>{pt}</li>
            ))}
          </ul>
        </div>

        <div class="context-card">
          <span class="context-card-label"><i class="fa-solid fa-calendar-day text-purple"></i> Important Dates</span>
          <p class="context-card-value">
            {Array.isArray(context.important_dates) ? context.important_dates.join(', ') : (context.important_dates || 'Tomorrow')}
          </p>
        </div>

        <div class="context-card">
          <span class="context-card-label"><i class="fa-solid fa-bolt text-emerald"></i> Requested Action</span>
          <p class="context-card-value">{context.requested_action || 'Approve leave request'}</p>
        </div>
      </div>
    </section>
  );
}
