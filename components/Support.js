'use client';
export default function Support({ onNewTicket }) {
  const tickets = [
    { id: '#TKT-2026-0487', status: 'In Progress', statusColor: 'rgba(245,158,11,0.1)', statusTextColor: 'var(--orange)', priority: 'High', title: 'Inverter efficiency drop noticed', desc: 'Solar inverter showing 15% less output than expected for the past 3 days.', date: 'Mar 8, 2026' },
    { id: '#TKT-2026-0421', status: 'Open', statusColor: 'rgba(59,130,246,0.1)', statusTextColor: 'var(--info)', priority: 'Medium', title: 'Billing discrepancy inquiry', desc: 'The grid usage charges do not match the smart meter readings displayed on dashboard.', date: 'Mar 5, 2026' },
    { id: '#TKT-2026-0398', status: 'Resolved', statusColor: 'rgba(16,185,129,0.1)', statusTextColor: 'var(--success)', priority: 'Low', title: 'Battery maintenance scheduled', desc: 'Annual battery health check and maintenance completed successfully.', date: 'Feb 28, 2026' },
  ];

  return (
    <section className="support-section" id="support">
      <div className="container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Support & Service</h2>
            <p className="section-subtitle">Get help with your energy services and track support requests</p>
          </div>
          <button className="btn btn-primary" onClick={onNewTicket}><i className="fas fa-plus"></i> New Ticket</button>
        </div>
        <div className="support-grid">
          <div className="tickets-list">
            {tickets.map((t, i) => (
              <div className="ticket-card" key={i}>
                <div className="ticket-header">
                  <span className="ticket-id">{t.id}</span>
                  <div>
                    <span className="ticket-status" style={{ backgroundColor: t.statusColor, color: t.statusTextColor }}>{t.status}</span>
                    <span className={`ticket-priority priority-${t.priority.toLowerCase()}`}>{t.priority}</span>
                  </div>
                </div>
                <div className="ticket-title">{t.title}</div>
                <div className="ticket-description">{t.desc}</div>
                <div className="ticket-footer">
                  <span className="ticket-date"><i className="fas fa-calendar-alt"></i> {t.date}</span>
                  <button className="btn btn-outline btn-sm">View Details</button>
                </div>
              </div>
            ))}
          </div>
          <div className="quick-actions">
            <h3 style={{ marginBottom: '1.5rem' }}>Quick Actions</h3>
            {[
              { icon: 'fa-exclamation-triangle', title: 'Report Outage', desc: 'Report a power outage in your area' },
              { icon: 'fa-phone-alt', title: 'Contact Support', desc: 'Call +91 1800-123-4567' },
              { icon: 'fa-book', title: 'Knowledge Base', desc: 'Browse common FAQs and guides' },
              { icon: 'fa-calendar-check', title: 'Schedule Maintenance', desc: 'Book a service appointment' },
            ].map((a, i) => (
              <div className="quick-action" key={i}>
                <div className="action-icon"><i className={`fas ${a.icon}`}></i></div>
                <div className="action-text">
                  <div className="action-title">{a.title}</div>
                  <div className="action-description">{a.desc}</div>
                </div>
                <i className="fas fa-chevron-right" style={{ color: 'var(--text-light)' }}></i>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
