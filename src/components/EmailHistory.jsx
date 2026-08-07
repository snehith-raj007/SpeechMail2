import React, { useState } from 'react';

export function EmailHistory({ history, onDeleteItem, onClearAll, onLoadItem }) {
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('all');

  const filtered = (history || []).filter(item => {
    const matchesSearch =
      (item.subject || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.to || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.intent || '').toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <section class="panel history-panel" id="containerHistory">
      <div class="panel-header">
        <div class="panel-title">
          <i class="fa-solid fa-clock-rotate-left text-cyan"></i>
          <h2>Generated Email History (Neon DB)</h2>
        </div>

        <div class="history-controls">
          <div class="search-box">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              placeholder="Search by subject, recipient, or intent..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            class="styled-select-sm"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
          </select>

          <button class="btn-icon danger" onClick={onClearAll} title="Clear All History from Neon DB">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>

      <div class="history-list">
        {filtered.length === 0 ? (
          <div class="empty-history-state">
            <p><i class="fa-regular fa-folder-open text-muted"></i> No saved email history found in Neon DB.</p>
          </div>
        ) : (
          filtered.map(item => (
            <div class="history-card" key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                  <span class="tech-tag" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>{item.intent || 'Email'}</span>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Recently'}</span>
                </div>
                <h4 style={{ margin: 0, color: '#f3f4f6' }}>{item.subject}</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#9ca3af' }}>To: {item.to || 'Manager'}</p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button class="btn-pill-sm btn-pill-accent" onClick={() => onLoadItem(item)}>
                  <i class="fa-solid fa-folder-open"></i> Load
                </button>
                <button class="btn-icon danger" onClick={() => onDeleteItem(item.id)}>
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
