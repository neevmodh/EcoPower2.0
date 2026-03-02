import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
    Zap, LayoutDashboard, Users, CreditCard, Ticket,
    BarChart3, Database, UploadCloud, Settings, LogOut, ArrowLeft
} from 'lucide-react';

const AdminLayout = () => {
    const { currentUser, handleLogout } = useApp();
    const navigate = useNavigate();
    const location = useLocation();

    const doLogout = () => {
        handleLogout();
        navigate('/login');
    };

    const navGroups = [
        {
            label: 'PLATFORM',
            items: [
                { path: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard Overview' },
                { path: '/admin/users', icon: <Users size={20} />, label: 'User Management' },
                { path: '/admin/billing', icon: <CreditCard size={20} />, label: 'Billing Control' },
                { path: '/admin/tickets', icon: <Ticket size={20} />, label: 'All Tickets' },
            ]
        },
        {
            label: 'DATA & INSIGHTS',
            items: [
                { path: '/admin/analytics', icon: <BarChart3 size={20} />, label: 'Platform Analytics' },
                { path: '/admin/data', icon: <Database size={20} />, label: 'Data Manager' },
            ]
        }
    ];

    return (
        <div className="flex h-screen bg-[#060810] text-gray-200 font-jakarta overflow-hidden">

            {/* ─── SIDEBAR (Deep Navy) ────────── */}
            <aside className="w-[260px] bg-[#0a0d1a] border-r border-[#3b82f6]/10 flex flex-col shrink-0">

                {/* LOGO */}
                <div className="h-16 flex items-center px-6 border-b border-[#3b82f6]/10">
                    <Zap className="w-6 h-6 text-blue-500 mr-2" />
                    <h1 className="text-xl font-syne font-bold text-white tracking-wide">EcoPower <span className="text-blue-500">Admin</span></h1>
                </div>

                {/* ADMIN USER BUBBLE */}
                <div className="p-6 border-b border-[#3b82f6]/10 bg-gradient-to-b from-[#3b82f6]/5 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold font-ibm-plex">
                            {currentUser?.name?.substring(0, 2).toUpperCase() || 'AD'}
                        </div>
                        <div>
                            <div className="text-sm font-bold text-white">{currentUser?.name || 'Administrator'}</div>
                            <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Platform Admin</div>
                        </div>
                    </div>
                </div>

                {/* NAV LINKS */}
                <div className="flex-1 overflow-y-auto custom-scrollbar py-6 px-4 space-y-8">
                    {navGroups.map((group, idx) => (
                        <div key={idx}>
                            <h3 className="text-[10px] uppercase font-bold text-gray-500 tracking-widest pl-3 mb-2">{group.label}</h3>
                            <nav className="space-y-1">
                                {group.items.map(item => {
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <NavLink
                                            key={item.path} to={item.path}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${isActive ? 'bg-blue-500/10 text-blue-400 shadow-[inset_2px_0_0_#3b82f6]' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
                                        >
                                            {item.icon} {item.label}
                                        </NavLink>
                                    )
                                })}
                            </nav>
                        </div>
                    ))}

                    <div>
                        <h3 className="text-[10px] uppercase font-bold text-gray-500 tracking-widest pl-3 mb-2">SYSTEM</h3>
                        <nav className="space-y-1">
                            <NavLink to="/admin/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-white/5">
                                <Settings size={20} /> Settings
                            </NavLink>
                            <button onClick={doLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                <LogOut size={20} /> Logout Session
                            </button>
                        </nav>
                    </div>
                </div>

                {/* CUSTOMER PORTAL ESCAPE */}
                <div className="p-4 border-t border-[#3b82f6]/10">
                    <NavLink to="/dashboard" className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-bold text-gray-300 transition-colors">
                        <ArrowLeft size={16} /> Switch to Customer View
                    </NavLink>
                </div>
            </aside>

            {/* ─── MAIN CONTENT ───────── */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#060810] relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 relative z-10">
                    <Outlet />
                </div>
            </main>

        </div>
    );
};

export default AdminLayout;
