import React, { useState } from 'react';

export function GmailInbox({ inboxMessages, onSyncInbox }) {
  const [search, setSearch] = useState('');

  const filtered = (inboxMessages || []).filter(msg =>
    msg.subject.toLowerCase().includes(search.toLowerCase()) ||
    msg.sender.toLowerCase().includes(search.toLowerCase()) ||
    msg.snippet.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section class="panel inbox-panel" id="containerInbox">
      <div class="panel-header">
        <div class="panel-title">
          <i class="fa-solid fa-inbox text-red"></i>
          <h2>Gmail Inbox Intelligence</h2>
          <span class="badge-pill badge-purple">Inbox Sync & Schedule Extractor</span>
        </div>

        <div class="inbox-controls">
          <div class="search-box">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              placeholder="Search inbox mails..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button class="btn btn-pill-sm btn-pill-accent" onClick={onSyncInbox}>
            <i class="fa-solid fa-arrows-rotate"></i> Sync Inbox
          </button>
        </div>
      </div>

      <div class="inbox-list">
        {filtered.length === 0 ? (
          <div class="empty-history-state">
            <p><i class="fa-regular fa-folder-open text-muted"></i> No inbox messages match your search.</p>
          </div>
        ) : (
          filtered.map(msg => (
            <div class="inbox-card" key={msg.id}>
              <div class="inbox-card-header">
                <span class="inbox-sender">
                  <i class="fa-solid fa-user-circle text-cyan"></i> {msg.sender}
                </span>
                <span class="inbox-time">{msg.timeAgo}</span>
              </div>
              <h4 class="inbox-subject">{msg.subject}</h4>
              <p class="inbox-snippet">{msg.snippet}</p>
              <div class="inbox-footer">
                <span class="tech-tag">{msg.category}</span>
                <button class="btn-pill-sm" onClick={() => alert(`Email Body:\n\n${msg.body || msg.snippet}`)}>
                  <i class="fa-solid fa-eye"></i> Read Email
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
