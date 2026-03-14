'use client';
import { useState, useEffect, createContext, useContext, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 3000, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type} show`}>
            <div className="toast-icon">
              <i className={`fas ${t.type === 'success' ? 'fa-check-circle' : t.type === 'warning' ? 'fa-exclamation-triangle' : 'fa-times-circle'}`}></i>
            </div>
            <div className="toast-content">
              <div className="toast-title">{t.type === 'success' ? 'Success!' : t.type === 'warning' ? 'Warning' : 'Error'}</div>
              <div className="toast-message">{t.message}</div>
            </div>
            <button className="toast-close" onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>&times;</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
