import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Zap,
    Package,
    CreditCard,
    Unplug,
    Cpu,
    BarChart3,
    CloudSun,
    Leaf,
    Bot,
    FileText,
    SearchCode,
    LifeBuoy,
    User,
    LogOut,
    Bell,
    Moon,
    Sun,
    RefreshCw,
    Download,
    Menu,
    X,
    CheckCircle2,
    AlertCircle,
    Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { logout } from '../services/authService';
import { formatDistanceToNow } from 'date-fns';

const CustomerLayout = () => {
    const { currentUser, csvData, unreadCount, markAllRead, markNotificationRead, refreshData } = useApp();
    const navigate = useNavigate();
    const location = useLocation();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    // Refs for clicking outside to close panels
    const notifRef = useRef(null);
    const sidebarRef = useRef(null);

    // Time update
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Click outside handlers
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotifOpen(false);
            }
            if (sidebarRef.current && !sidebarRef.current.contains(event.target) && window.innerWidth < 1024) {
                setIsSidebarOpen(false);
            }
        };
        if (isNotifOpen || isSidebarOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isNotifOpen, isSidebarOpen]);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        if (window.innerWidth < 1024) setIsSidebarOpen(false);
    }, [location.pathname]);

    // Offline Detection
    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Global Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore if typing in input/textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            const key = e.key.toLowerCase();
            if (key === 'd') navigate('/dashboard');
            if (key === 'e') navigate('/energy');
            if (key === 'b') navigate('/billing');
            if (key === 's') navigate('/support');
            if (key === 'a') navigate('/advisor');
            if (e.key === 'Escape') {
                setIsNotifOpen(false);
                setIsSidebarOpen(false);
            }
            if (e.key === '?') {
                window.dispatchEvent(new CustomEvent('eco-toast', {
                    detail: { message: 'Shortcuts: D (Dash), E (Energy), B (Billing), S (Support), A (Advisor)', type: 'info', duration: 4000 }
                }));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshData();
        setTimeout(() => setIsRefreshing(false), 800);
        window.dispatchEvent(new CustomEvent('eco-toast', {
            detail: { message: 'Data refreshed successfully', type: 'success' }
        }));
    };

    // Get user specific notifications
    const userNotifications = csvData.notifications
        .filter(n => n.userId === currentUser?.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const pendingInvoices = csvData.invoices.filter(
        i => i.userId === currentUser?.id && i.status === 'pending'
    ).length;

    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U';
    };

    // ─── NAV LINKS CONFIGURATION ──────────────────────────────────────────────

    const navGroups = [
        {
            title: 'OVERVIEW',
            items: [
                { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
                { name: 'Live Energy', path: '/energy', icon: Zap, isLive: true },
            ]
        },
        {
            title: 'MY ACCOUNT',
            items: [
                { name: 'Service Plans', path: '/services', icon: Package },
                { name: 'Billing & Payments', path: '/billing', icon: CreditCard, badge: pendingInvoices },
                { name: 'DISCOM / Grid', path: '/discom', icon: Unplug },
                { name: 'My Devices', path: '/devices', icon: Cpu },
            ]
        },
        {
            title: 'INSIGHTS',
            items: [
                { name: 'Analytics', path: '/analytics', icon: BarChart3 },
                { name: 'Solar Forecast', path: '/forecast', icon: CloudSun },
                { name: 'Carbon Impact', path: '/carbon', icon: Leaf },
            ]
        },
        {
            title: 'AI FEATURES',
            isSpecial: true,
            items: [
                { name: 'AI Energy Advisor', path: '/advisor', icon: Bot, isNew: true },
                { name: 'AI Bill Analyzer', path: '/bill-analyzer', icon: FileText, isNew: true },
                { name: 'AI Anomaly Detect', path: '/anomaly', icon: SearchCode, isNew: true },
            ]
        },
        {
            title: 'HELP',
            items: [
                { name: 'Support Tickets', path: '/support', icon: LifeBuoy },
                { name: 'My Profile', path: '/profile', icon: User },
            ]
        }
    ];

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'solar_alert': return <Zap className="w-5 h-5 text-yellow-500" />;
            case 'invoice': return <FileText className="w-5 h-5 text-blue-500" />;
            case 'usage_warning': return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'maintenance': return <Info className="w-5 h-5 text-purple-500" />;
            default: return <Bell className="w-5 h-5 text-gray-400" />;
        }
    };

    const getNotificationColor = (type) => {
        if (type === 'solar_alert') return 'border-yellow-500 bg-yellow-500/5';
        if (type === 'invoice') return 'border-blue-500 bg-blue-500/5';
        if (type === 'usage_warning') return 'border-red-500 bg-red-500/5';
        if (type === 'maintenance') return 'border-purple-500 bg-purple-500/5';
        return 'border-[#00C864] bg-[#00C864]/5';
    };

    return (
        <div className="flex h-screen bg-[#050908] text-white font-jakarta overflow-hidden">

            {/* ─── SIDEBAR ────────────────────────────────────────────────────────── */}

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* Sidebar Content */}
            <aside
                ref={sidebarRef}
                className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-[#0a0f0d] border-r border-[#00C864]/10 
          transform transition-transform duration-300 ease-in-out flex flex-col 
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                {/* Logo Area */}
                <div className="h-[64px] flex items-center px-6 border-b border-[#00C864]/10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00C864]/20 to-transparent border border-[#00C864]/30 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-[#00FF85]" fill="currentColor" />
                        </div>
                        <span className="font-syne font-bold text-xl tracking-wide">
                            Eco<span className="text-[#00C864]">Power</span>
                        </span>
                    </div>
                    <button className="ml-auto lg:hidden" onClick={() => setIsSidebarOpen(false)}>
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* User Card */}
                <div className="p-5 border-b border-[#00C864]/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#00C864] flex items-center justify-center text-black font-bold text-sm">
                            {getInitials(currentUser?.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate">{currentUser?.name}</div>
                            <div className="text-xs text-gray-400 truncate">{currentUser?.connectionId}</div>
                        </div>
                        {currentUser?.plan === 'Solar Pro' && (
                            <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" title="Pro Plan"></span>
                        )}
                    </div>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                    <div className="px-4 space-y-6">
                        {navGroups.map((group, i) => (
                            <div key={i}>
                                <div className="px-3 mb-2 flex items-center gap-2">
                                    <span className={`text-[10px] font-bold tracking-wider uppercase ${group.isSpecial ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400' : 'text-gray-500'}`}>
                                        {group.title}
                                    </span>
                                    {group.isSpecial && <div className="h-px flex-1 bg-gradient-to-r from-blue-500/20 to-transparent"></div>}
                                </div>

                                <div className="space-y-1">
                                    {group.items.map((item) => (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative
                        ${isActive
                                                    ? 'bg-[#00C864]/10 text-[#00FF85]'
                                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                      `}
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    {isActive && (
                                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#00C864] rounded-r-md"></div>
                                                    )}
                                                    <item.icon className={`w-5 h-5 ${isActive ? 'text-[#00C864]' : 'text-gray-500 group-hover:text-gray-300'}`} />
                                                    <span className="text-sm font-medium">{item.name}</span>

                                                    {/* Badges */}
                                                    {item.isLive && (
                                                        <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                                    )}
                                                    {item.badge > 0 && (
                                                        <span className="ml-auto px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-bold border border-amber-500/20">
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                    {item.isNew && (
                                                        <span className="ml-auto px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[9px] font-bold tracking-wider border border-blue-500/20 uppercase">
                                                            New
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-[#00C864]/10">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* ─── MAIN CONTENT AREA ──────────────────────────────────────────────── */}

            <main className="flex-1 flex flex-col min-w-0 bg-[#050908] relative">

                {/* Subtle background glow from top corner */}
                <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-[#00C864]/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

                {isOffline && (
                    <div className="w-full bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-500 text-xs font-bold px-4 py-2 flex items-center justify-center gap-2 relative z-[60]">
                        <AlertCircle className="w-4 h-4" /> You're offline — showing cached data
                    </div>
                )}

                {/* ─── TOPBAR ──────────────────────────────────────────────────────── */}
                <header className="h-[64px] flex items-center justify-between px-4 lg:px-8 border-b border-[#00C864]/10 bg-[#0a0f0d]/80 backdrop-blur-md sticky top-0 z-30">

                    {/* Left: Mobile Menu & Breadcrumb */}
                    <div className="flex items-center gap-4">
                        <button className="p-2 -ml-2 text-gray-400 hover:text-white lg:hidden" onClick={() => setIsSidebarOpen(true)}>
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="hidden sm:flex flex-col">
                            <h1 className="text-lg font-syne font-semibold capitalize text-gray-100">
                                {location.pathname.substring(1).replace('-', ' ') || 'Dashboard'}
                            </h1>
                        </div>
                    </div>

                    {/* Center: Live Status Indicator */}
                    <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/5">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C864] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00FF85]"></span>
                        </span>
                        <span className="text-xs text-gray-300 font-ibm-plex tracking-wider uppercase font-semibold">
                            Live Connection
                        </span>
                        <span className="w-px h-3 bg-gray-600 mx-1"></span>
                        <span className="text-xs text-gray-400 font-ibm-plex">
                            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                        </span>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={handleRefresh}
                            className={`p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all
                ${isRefreshing ? 'animate-spin text-[#00C864]' : ''}`}
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>

                        <button className="hidden sm:flex p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                            <Moon className="w-5 h-5" />
                        </button>

                        <div className="h-6 w-px bg-white/10 hidden sm:block mx-1"></div>

                        {/* Notification Bell */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setIsNotifOpen(!isNotifOpen)}
                                className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#0a0f0d]"></span>
                                )}
                            </button>

                            {/* Notification Panel (Dropdown) */}
                            {isNotifOpen && (
                                <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-[#0d1512] shadow-2xl border border-white/10 overflow-hidden transform origin-top-right transition-all animate-fade-in z-50">
                                    <div className="p-4 flex items-center justify-between border-b border-white/5 bg-white/5">
                                        <h3 className="font-semibold text-gray-200">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={() => markAllRead(currentUser.id)}
                                                className="text-xs text-[#00C864] hover:text-[#00FF85] font-medium transition-colors"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>

                                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                        {userNotifications.length > 0 ? (
                                            <div className="divide-y divide-white/5">
                                                {userNotifications.map((notif) => (
                                                    <div
                                                        key={notif.id}
                                                        onClick={() => {
                                                            markNotificationRead(notif.id);
                                                            // Simple navigation logic based on type could go here
                                                        }}
                                                        className={`p-4 flex gap-4 hover:bg-white/5 cursor-pointer transition-colors border-l-2
                              ${String(notif.isRead).toLowerCase() !== 'true' ? getNotificationColor(notif.type) : 'border-transparent bg-transparent opacity-60'}`}
                                                    >
                                                        <div className="mt-1 flex-shrink-0">
                                                            {getNotificationIcon(notif.type)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm mb-1 ${String(notif.isRead).toLowerCase() !== 'true' ? 'text-white font-medium' : 'text-gray-300'}`}>
                                                                {notif.title}
                                                            </p>
                                                            <p className="text-xs text-gray-400 leading-relaxed mb-2">
                                                                {notif.message}
                                                            </p>
                                                            <p className="text-[10px] text-gray-500 font-medium tracking-wide uppercase">
                                                                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                                            </p>
                                                        </div>
                                                        {String(notif.isRead).toLowerCase() !== 'true' && (
                                                            <div className="w-2 h-2 rounded-full bg-[#00C864] mt-2 flex-shrink-0"></div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center">
                                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <CheckCircle2 className="w-6 h-6 text-[#00C864]" />
                                                </div>
                                                <p className="text-sm text-gray-300 font-medium">🎉 All caught up!</p>
                                                <p className="text-xs text-gray-500 mt-1">No new notifications.</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-3 border-t border-white/5 text-center bg-black/20">
                                        <button className="text-sm text-gray-400 hover:text-white transition-colors">
                                            View all history
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </header>

                {/* ─── PAGE CONTENT WRAPPER ────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8 relative z-10">
                    <Outlet />
                </div>
            </main>

        </div>
    );
};

export default CustomerLayout;
