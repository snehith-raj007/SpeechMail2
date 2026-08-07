import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';

export function InboxSummarizer({ onSelectReply }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summaries, setSummaries] = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const [filterCategory, setFilterCategory] = useState('All');
  const [isBulkSummarizing, setIsBulkSummarizing] = useState(false);
  const [storedCount, setStoredCount] = useState(0);

  const loadData = async () => {
    setLoading(true);
    const msgs = await api.fetchInbox();
    setMessages(msgs || []);

    // Load stored email summaries from Neon DB
    const dbSums = await api.fetchEmailSummaries();
    if (dbSums && dbSums.length > 0) {
      setStoredCount(dbSums.length);
      const sumMap = {};
      dbSums.forEach(s => {
        if (s.inboxMessageId) {
          sumMap[s.inboxMessageId] = {
            summary: s.summary,
            priority: s.priority,
            intent: s.intent || s.category,
            key_points: s.key_points || [],
            action_items: s.action_items || [],
            suggested_reply: s.suggested_reply
          };
        }
      });
      setSummaries(prev => ({ ...sumMap, ...prev }));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSummarize = async (msg) => {
    setLoadingMap(prev => ({ ...prev, [msg.id]: true }));
    try {
      const res = await api.summarizeEmail({
        id: msg.id,
        sender: `${msg.sender} <${msg.senderEmail}>`,
        subject: msg.subject,
        body: msg.body || msg.snippet
      });
      if (res && res.summary_data) {
        setSummaries(prev => ({ ...prev, [msg.id]: res.summary_data }));
        setStoredCount(prev => prev + 1);
      }
    } catch (err) {
      alert('Summarization error: ' + err.message);
    } finally {
      setLoadingMap(prev => ({ ...prev, [msg.id]: false }));
    }
  };

  const handleSummarizeAllAndStore = async () => {
    setIsBulkSummarizing(true);
    try {
      const res = await api.summarizeAllInbox();
      alert(`💾 ${res.message || 'All received emails summarized, classified, & stored in Neon DB!'}`);
      loadData();
    } catch (err) {
      alert('Bulk processing error: ' + err.message);
    } finally {
      setIsBulkSummarizing(false);
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (filterCategory === 'All') return true;
    if (filterCategory === 'Urgent') return summaries[msg.id]?.priority === 'Urgent';
    if (filterCategory === 'Important') return summaries[msg.id]?.priority === 'Important';
    return true;
  });

  return (
    <section class="panel inbox-panel" id="containerInboxSummarizer" style={{ marginTop: '28px' }}>
      <div class="panel-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div class="panel-title">
          <i class="fa-solid fa-wand-magic-sparkles text-cyan" style={{ fontSize: '1.35rem' }}></i>
          <div>
            <h2 style={{ fontSize: '1.35rem', margin: 0 }}>AI Received Email Reader, Summarizer, & Neon DB Memory</h2>
            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Reads received mails, generates LLM summaries, classifies priority, & stores permanently in Neon DB</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span class="badge-pill badge-purple" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
            <i class="fa-solid fa-database text-purple"></i> {storedCount} Summaries Stored in Neon DB
          </span>

          <button
            class="btn-pill-sm btn-pill-accent"
            onClick={handleSummarizeAllAndStore}
            disabled={isBulkSummarizing}
            style={{ padding: '8px 16px', fontSize: '0.88rem' }}
          >
            <i class={`fa-solid fa-brain ${isBulkSummarizing ? 'fa-spin' : ''}`}></i> 🤖 Read, Summarize, Classify & Store All in Neon DB
          </button>

          <button class="btn-pill-sm" onClick={loadData}>
            <i class={`fa-solid fa-rotate ${loading ? 'fa-spin' : ''}`}></i> Refresh
          </button>
        </div>
      </div>

      {/* Filter Category Pills */}
      <div style={{ padding: '10px 16px', background: 'rgba(6, 182, 212, 0.05)', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(6, 182, 212, 0.15)', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#06b6d4', marginRight: '6px' }}>Filter Messages:</span>
        <button class="btn-pill-sm" onClick={() => setFilterCategory('All')} style={{ background: filterCategory === 'All' ? 'rgba(6, 182, 212, 0.25)' : 'transparent', color: filterCategory === 'All' ? '#06b6d4' : '#9ca3af' }}>All Received</button>
        <button class="btn-pill-sm" onClick={() => setFilterCategory('Urgent')} style={{ background: filterCategory === 'Urgent' ? 'rgba(239, 68, 68, 0.25)' : 'transparent', color: filterCategory === 'Urgent' ? '#ef4444' : '#9ca3af' }}>🔴 Urgent Only</button>
        <button class="btn-pill-sm" onClick={() => setFilterCategory('Important')} style={{ background: filterCategory === 'Important' ? 'rgba(245, 158, 11, 0.25)' : 'transparent', color: filterCategory === 'Important' ? '#f59e0b' : '#9ca3af' }}>🟡 Important Only</button>
      </div>

      {/* Inbox List */}
      <div className="inbox-messages-grid" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {filteredMessages.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', background: 'rgba(18, 24, 38, 0.6)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <i class="fa-solid fa-inbox text-muted" style={{ fontSize: '2rem', marginBottom: '10px', display: 'block' }}></i>
            <p style={{ color: '#9ca3af', margin: 0 }}>No received email messages found matching criteria.</p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const summary = summaries[msg.id];
            const isSummarizing = loadingMap[msg.id];

            return (
              <div
                key={msg.id}
                style={{
                  background: 'rgba(18, 24, 38, 0.85)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  borderRadius: '18px',
                  padding: '20px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', color: '#f3f4f6', fontSize: '1.15rem' }}>{msg.subject}</h3>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#9ca3af' }}>
                      <strong style={{ color: '#06b6d4' }}>{msg.sender}</strong> &lt;{msg.senderEmail}&gt; • <span style={{ color: '#6b7280' }}>{msg.timeAgo}</span>
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {summary?.priority && (
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          padding: '4px 12px',
                          borderRadius: '8px',
                          background: summary.priority === 'Urgent' ? 'rgba(239, 68, 68, 0.25)' : summary.priority === 'Important' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)',
                          color: summary.priority === 'Urgent' ? '#ef4444' : summary.priority === 'Important' ? '#f59e0b' : '#10b981'
                        }}
                      >
                        {summary.priority === 'Urgent' ? '🔴 Urgent' : summary.priority === 'Important' ? '🟡 Important' : '🟢 Routine'}
                      </span>
                    )}

                    <button
                      class="btn-pill-sm btn-pill-accent"
                      onClick={() => handleSummarize(msg)}
                      disabled={isSummarizing}
                      style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                    >
                      <i class={`fa-solid fa-sparkles ${isSummarizing ? 'fa-spin' : ''}`}></i> {summary ? 'Re-Summarize & Save to Neon DB' : '✨ Summarize & Store in Neon DB'}
                    </button>
                  </div>
                </div>

                {/* Email Body Snippet */}
                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px', fontSize: '0.92rem', color: '#d1d5db', lineHeight: 1.6 }}>
                  {msg.body || msg.snippet}
                </div>

                {/* AI Perception & Summary Card */}
                {summary && (
                  <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    {/* Intent Tag & TL;DR */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a855f7', background: 'rgba(168, 85, 247, 0.2)', padding: '2px 8px', borderRadius: '6px' }}>
                          📌 Category / Intent: {summary.intent}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                          <i class="fa-solid fa-database"></i> Stored in Neon DB
                        </span>
                      </div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: '#06b6d4' }}><i class="fa-solid fa-align-left"></i> Executive TL;DR Summary:</h4>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#f3f4f6', lineHeight: 1.6 }}>{summary.summary}</p>
                    </div>

                    {/* Key Facts & Action Items */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      {summary.key_points && summary.key_points.length > 0 && (
                        <div>
                          <h5 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#f59e0b' }}><i class="fa-solid fa-list-check"></i> Key Facts & Points:</h5>
                          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.85rem', color: '#9ca3af' }}>
                            {summary.key_points.map((pt, i) => <li key={i}>{pt}</li>)}
                          </ul>
                        </div>
                      )}

                      {summary.action_items && summary.action_items.length > 0 && (
                        <div>
                          <h5 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#ef4444' }}><i class="fa-solid fa-circle-exclamation"></i> Action Items Required:</h5>
                          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.85rem', color: '#9ca3af' }}>
                            {summary.action_items.map((act, i) => <li key={i}>{act}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Suggested Reply Box & Action */}
                    {summary.suggested_reply && (
                      <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px', marginTop: '4px' }}>
                        <h5 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#10b981' }}><i class="fa-solid fa-reply"></i> Suggested Auto-Reply:</h5>
                        <p style={{ margin: 0, fontSize: '0.88rem', color: '#d1d5db', whiteSpace: 'pre-line', lineHeight: 1.5 }}>{summary.suggested_reply}</p>
                        
                        {onSelectReply && (
                          <button
                            type="button"
                            class="btn-pill-sm btn-pill-accent"
                            onClick={() => onSelectReply({
                              recipient: msg.senderEmail,
                              subject: msg.subject.startsWith('Re:') ? msg.subject : `Re: ${msg.subject}`,
                              body: summary.suggested_reply
                            })}
                            style={{ marginTop: '10px', fontSize: '0.82rem', padding: '6px 12px' }}
                          >
                            <i class="fa-solid fa-paper-plane"></i> ⚡ Load Reply into Email Composer
                          </button>
                        )}
                      </div>
                    )}

                  </div>
                )}

              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
