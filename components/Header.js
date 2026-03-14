'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Header({ onShowLogin }) {
  const { user, logout, getInitials } = useAuth();

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header className="site-header">
      <div className="container">
        <nav className="navbar">
          <div className="logo">
            <div className="logo-icon"><i className="fas fa-bolt"></i></div>
            <div className="logo-text">
              <span>EcoPower</span>
              <span className="logo-subtitle">Energy-as-a-Service</span>
            </div>
          </div>

          <div className="nav-links">
            {['dashboard','subscription','billing','discom','support','analytics'].map(s => (
              <button key={s} className="nav-link" onClick={() => scrollTo(s)}>
                <i className={`fas fa-${s === 'dashboard' ? 'home' : s === 'subscription' ? 'solar-panel' : s === 'billing' ? 'file-invoice-dollar' : s === 'discom' ? 'network-wired' : s === 'support' ? 'headset' : 'chart-line'}`}></i>
                <span>{s === 'discom' ? 'DISCOM' : s.charAt(0).toUpperCase() + s.slice(1)}</span>
              </button>
            ))}
          </div>

          <div className="header-actions">
            <button className="notification-btn">
              <i className="fas fa-bell"></i>
              <span className="notification-badge"></span>
            </button>

            {user ? (
              <>
                <div className="user-profile">
                  <div className="user-avatar">{getInitials()}</div>
                  <div className="user-info">
                    <span className="user-name">{user.name}</span>
                    <span className="user-plan">{user.company || user.role}</span>
                  </div>
                </div>
                <button className="btn btn-outline" onClick={logout}>
                  <i className="fas fa-sign-out-alt"></i> Logout
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={onShowLogin}>
                <i className="fas fa-sign-in-alt"></i> Login
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
