import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';

export function ScheduledEmailsList() {
  const [scheduledEmails, setScheduledEmails] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadScheduled = async () => {
    setLoading(true);
    const list = await api.fetchScheduledEmails();
    setScheduledEmails(list || []);
    setLoading(false);
  };

  useEffect(() => {
    loadScheduled();
    const interval = setInterval(loadScheduled, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled email?')) return;
    await api.deleteScheduledEmail(id);
    loadScheduled();
  };

  return (
    <section class="panel history-panel" id="containerScheduledEmails" style={{ marginTop: '28px' }}>
      <div class="panel-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div class="panel-title">
          <i class="fa-solid fa-clock text-purple" style={{ fontSize: '1.3rem' }}></i>
          <div>
            <h2 style={{ fontSize: '1.35rem', margin: 0 }}>Scheduled Emails Queue (Neon DB Background Worker)</h2>
            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Automated background email dispatch queue</span>
          </div>
        </div>

        <button class="btn-pill-sm btn-pill-accent" onClick={loadScheduled}>
          <i class={`fa-solid fa-rotate ${loading ? 'fa-spin' : ''}`}></i> Refresh Queue
        </button>
      </div>

      <div className="scheduled-queue-container" style={{ marginTop: '16px' }}>
        {scheduledEmails.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', background: 'rgba(18, 24, 38, 0.6)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <i class="fa-solid fa-calendar-check text-muted" style={{ fontSize: '2rem', marginBottom: '10px', display: 'block' }}></i>
            <p style={{ color: '#9ca3af', margin: 0 }}>No scheduled emails in queue. Compose an email above and select a delivery time!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {scheduledEmails.map((item) => {
              const isSent = item.status === 'sent';
              return (
                <div
                  key={item.id}
                  style={{
                    background: 'rgba(18, 24, 38, 0.85)',
                    border: `1px solid ${isSent ? 'rgba(16, 185, 129, 0.3)' : 'rgba(168, 85, 247, 0.3)'}`,
                    borderRadius: '16px',
                    padding: '18px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', padding: '4px 10px', borderRadius: '8px', background: isSent ? 'rgba(16, 185, 129, 0.2)' : 'rgba(168, 85, 247, 0.2)', color: isSent ? '#10b981' : '#c084fc' }}>
                        {isSent ? '✅ Delivered' : '⏳ Pending Dispatch'}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Priority: {item.priority}</span>
                    </div>

                    <h4 style={{ margin: '0 0 6px 0', color: '#f3f4f6', fontSize: '1.05rem' }}>{item.subject}</h4>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#06b6d4' }}>
                      <i class="fa-solid fa-at"></i> To: {item.to}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#a855f7', fontWeight: 600 }}>
                      <i class="fa-regular fa-clock"></i> Target Delivery: {new Date(item.scheduled_at).toLocaleString()}
                    </p>
                  </div>

                  {!isSent && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button
                        class="btn-pill-sm danger"
                        onClick={() => handleCancel(item.id)}
                        style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                      >
                        <i class="fa-solid fa-ban"></i> Cancel Schedule
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
