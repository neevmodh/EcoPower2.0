'use client';
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="logo" style={{ color: 'var(--white)', marginBottom: '1rem' }}>
              <div className="logo-icon"><i className="fas fa-bolt"></i></div>
              <div className="logo-text">
                <span>EcoPower</span>
                <span className="logo-subtitle" style={{ color: '#94a3b8' }}>Energy-as-a-Service</span>
              </div>
            </div>
            <p className="footer-description">Making clean, reliable energy affordable and accessible for everyone. Subscribe to energy services and let us handle the rest.</p>
            <div className="social-links">
              {['fa-twitter','fa-linkedin-in','fa-facebook-f','fa-instagram'].map((ic, i) => (
                <a className="social-link" key={i}><i className={`fab ${ic}`}></i></a>
              ))}
            </div>
          </div>
          <div className="footer-column">
            <h3>Services</h3>
            <div className="footer-links">
              {['Solar Power','Battery Backup','Smart Monitoring','Grid Sync','EV Charging'].map((l, i) => (
                <span className="footer-link" key={i}>{l}</span>
              ))}
            </div>
          </div>
          <div className="footer-column">
            <h3>Company</h3>
            <div className="footer-links">
              {['About Us','Careers','Blog','Press','Partners'].map((l, i) => (
                <span className="footer-link" key={i}>{l}</span>
              ))}
            </div>
          </div>
          <div className="footer-column">
            <h3>Support</h3>
            <div className="footer-links">
              {['Help Center','Contact Us','FAQs','Documentation','Status Page'].map((l, i) => (
                <span className="footer-link" key={i}>{l}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 EcoPower. All rights reserved.</span>
          <div className="d-flex gap-2">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
