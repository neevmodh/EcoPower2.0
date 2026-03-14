'use client';
import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

const translations = {
  en: {
    name: 'English',
    flag: '🇬🇧',
    dashboard: 'Dashboard',
    energy: 'Energy',
    billing: 'Billing',
    devices: 'Devices',
    support: 'Support',
    logout: 'Logout',
    login: 'Login',
    welcome: 'Welcome back',
    notifications: 'Notifications',
    settings: 'Settings',
    profile: 'Profile'
  },
  hi: {
    name: 'हिंदी',
    flag: '🇮🇳',
    dashboard: 'डैशबोर्ड',
    energy: 'ऊर्जा',
    billing: 'बिलिंग',
    devices: 'उपकरण',
    support: 'सहायता',
    logout: 'लॉग आउट',
    login: 'लॉगिन',
    welcome: 'वापसी पर स्वागत है',
    notifications: 'सूचनाएं',
    settings: 'सेटिंग्स',
    profile: 'प्रोफ़ाइल'
  },
  gu: {
    name: 'ગુજરાતી',
    flag: '🇮🇳',
    dashboard: 'ડેશબોર્ડ',
    energy: 'ઊર્જા',
    billing: 'બિલિંગ',
    devices: 'ઉપકરણો',
    support: 'સહાય',
    logout: 'લૉગ આઉટ',
    login: 'લૉગિન',
    welcome: 'પાછા સ્વાગત છે',
    notifications: 'સૂચનાઓ',
    settings: 'સેટિંગ્સ',
    profile: 'પ્રોફાઇલ'
  },
  mr: {
    name: 'मराठी',
    flag: '🇮🇳',
    dashboard: 'डॅशबोर्ड',
    energy: 'ऊर्जा',
    billing: 'बिलिंग',
    devices: 'उपकरणे',
    support: 'समर्थन',
    logout: 'लॉग आउट',
    login: 'लॉगिन',
    welcome: 'परत स्वागत आहे',
    notifications: 'सूचना',
    settings: 'सेटिंग्ज',
    profile: 'प्रोफाइल'
  }
};

export default function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState('en');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ecopower_language');
    if (saved && translations[saved]) {
      setCurrentLang(saved);
    }
  }, []);

  const changeLang = (lang) => {
    setCurrentLang(lang);
    localStorage.setItem('ecopower_language', lang);
    setIsOpen(false);
    // Trigger custom event for other components to update
    window.dispatchEvent(new CustomEvent('languageChange', { detail: lang }));
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: 500,
          color: '#1e293b',
          transition: 'all 0.2s'
        }}
      >
        <span>{translations[currentLang].flag}</span>
        <Globe size={16} />
        <span>{translations[currentLang].name}</span>
      </button>

      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
          />
          <div style={{
            position: 'absolute',
            top: '50px',
            right: 0,
            background: 'white',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '180px',
            overflow: 'hidden',
            border: '1px solid #e2e8f0'
          }}>
            {Object.entries(translations).map(([code, lang]) => (
              <button
                key={code}
                onClick={() => changeLang(code)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: currentLang === code ? '#f1f5f9' : 'white',
                  border: 'none',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: currentLang === code ? 600 : 400,
                  color: '#1e293b',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = currentLang === code ? '#f1f5f9' : 'white'}
              >
                <span style={{ fontSize: '1.2rem' }}>{lang.flag}</span>
                <span>{lang.name}</span>
                {currentLang === code && (
                  <span style={{ marginLeft: 'auto', color: '#10b981' }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export { translations };
