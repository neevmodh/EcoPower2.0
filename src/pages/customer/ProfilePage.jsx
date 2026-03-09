import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
    User, Mail, Phone, MapPin, Shield, Edit2, Check, X,
    Bell, Moon, Sun, Globe, Download, Lock, KeyRound, Battery
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const ProfilePage = () => {
    const { currentUser, csvData, refreshData, setCsvData } = useApp();

    // Edit Profile State
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: currentUser?.name || '',
        phone: currentUser?.phone || '',
        address: currentUser?.address || '',
        city: currentUser?.city || '',
        state: currentUser?.state || 'Gujarat',
        pincode: currentUser?.pincode || '',
        roofArea: currentUser?.roofArea || ''
    });

    // Password State
    const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });
    const [passStrength, setPassStrength] = useState(0);
    const [passError, setPassError] = useState('');
    const [isChangingPass, setIsChangingPass] = useState(false);

    // Preferences State
    const [prefs, setPrefs] = useState({
        usageAlerts: true, invoiceGen: true, solarPerf: true,
        weatherAlerts: false, ticketUpdates: true, maintenance: true,
        theme: 'dark', language: 'en', defaultRange: '7D'
    });

    // Load Prefs from local
    useEffect(() => {
        try {
            const stored = localStorage.getItem(`eco_prefs_${currentUser.id}`);
            if (stored) setPrefs(JSON.parse(stored));
        } catch (e) { }
    }, [currentUser.id]);

    // Save Prefs to local
    const updatePref = (key, val) => {
        const next = { ...prefs, [key]: val };
        setPrefs(next);
        localStorage.setItem(`eco_prefs_${currentUser.id}`, JSON.stringify(next));

        // Apply theme class (mock demo)
        if (key === 'theme') {
            document.documentElement.classList.toggle('light-theme', val === 'light');
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: `Theme set to ${val}`, type: 'info' } }));
        }
    };

    // Profile Form Handling
    const handleProfileSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            setCsvData(prev => ({
                ...prev,
                users: prev.users.map(u => u.id === currentUser.id ? { ...u, ...formData } : u)
            }));
            await refreshData();
            setIsEditing(false);
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Profile updated successfully ✓', type: 'success' } }));
        } catch (err) {
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Failed to update profile', type: 'error' } }));
        } finally {
            setIsSaving(false);
        }
    };

    // Password Validation
    useEffect(() => {
        let score = 0;
        const p = passData.new;
        if (p.length >= 8) score++;
        if (/[A-Z]/.test(p)) score++;
        if (/[0-9]/.test(p)) score++;
        if (/[^A-Za-z0-9]/.test(p)) score++;
        setPassStrength(Math.min(4, score));

        if (passData.new && passData.confirm && passData.new !== passData.confirm) {
            setPassError("Passwords do not match");
        } else {
            setPassError("");
        }
    }, [passData.new, passData.confirm]);

    const handlePasswordSave = async (e) => {
        e.preventDefault();
        if (passError || passStrength < 2) {
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Please ensure password meets strength requirements.', type: 'error' } }));
            return;
        }

        // Mock Verify Current Password
        if (passData.current !== currentUser.password) {
            setPassError("Current password incorrect");
            return;
        }

        setIsChangingPass(true);
        try {
            setCsvData(prev => ({
                ...prev,
                users: prev.users.map(u => u.id === currentUser.id ? { ...u, password: passData.new } : u)
            }));
            await refreshData();
            setPassData({ current: '', new: '', confirm: '' });
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Password changed successfully ✓', type: 'success' } }));
        } catch (err) {
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Failed to change password.', type: 'error' } }));
        } finally {
            setIsChangingPass(false);
        }
    };

    // ─── EXPORT DATA (CSV to ZIP) ──────────────────────────────────────────
    const handleExportData = async () => {
        window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Preparing your data export...', type: 'info' } }));
        try {
            const zip = new JSZip();

            // Helper to convert Objects to CSV string
            const toCSV = (arr) => {
                if (!arr || !arr.length) return "";
                const headers = Object.keys(arr[0]).join(',');
                const rows = arr.map(obj => Object.values(obj).map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','));
                return [headers, ...rows].join('\n');
            };

            // Filter all relevant datasets for this user
            const userData = [currentUser];
            const userReadings = csvData.energyReadings.filter(r => r.userId === currentUser.id);
            const userInvoices = csvData.invoices.filter(i => i.userId === currentUser.id);
            const userDevices = csvData.devices.filter(d => d.userId === currentUser.id);
            const userTickets = csvData.tickets.filter(t => t.userId === currentUser.id);
            const userTransactions = csvData.gridTransactions.filter(t => t.userId === currentUser.id);

            zip.file("User_Profile.csv", toCSV(userData));
            zip.file("Energy_Readings.csv", toCSV(userReadings));
            zip.file("Billing_Invoices.csv", toCSV(userInvoices));
            zip.file("Smart_Devices.csv", toCSV(userDevices));
            zip.file("Support_Tickets.csv", toCSV(userTickets));
            zip.file("Grid_Transactions.csv", toCSV(userTransactions));

            const blob = await zip.generateAsync({ type: "blob" });
            saveAs(blob, `EcoPower_DataExport_${currentUser.id}_${format(new Date(), 'yyyyMMdd')}.zip`);

            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Data export complete.', type: 'success' } }));
        } catch (err) {
            console.error("Export failed", err);
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Failed to generate export file.', type: 'error' } }));
        }
    };

    // Avatar initials logic
    const initials = currentUser?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'EP';
    const joinDate = currentUser?.joinDate ? format(parseISO(currentUser.joinDate), 'MMMM yyyy') : 'Jan 2024';

    return (
        <div className="space-y-6 animate-fade-in pb-10 max-w-5xl mx-auto">

            {/* ─── HEADER ──────────────────────────────────────────────────────── */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-syne font-bold text-white mb-2">My Profile</h2>
                    <p className="text-sm text-gray-400">Manage your personal information, security, and preferences.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* ─── LEFT COLUMN ────────────────────────────────────────────────── */}
                <div className="md:col-span-8 flex flex-col gap-6">

                    {/* PROFILE CARD & EDITING */}
                    <div className="bg-[#0d1512] border border-white/5 rounded-3xl overflow-hidden relative shadow-2xl">
                        <div className="h-32 bg-gradient-to-r from-[#00C864]/20 to-transparent absolute top-0 left-0 right-0"></div>

                        <div className="px-8 pt-20 pb-8 relative z-10 flex flex-col sm:flex-row gap-6 items-start">

                            {/* Avatar Bubble */}
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00C864] to-[#007038] p-1 shadow-[0_0_30px_rgba(0,200,100,0.3)] shrink-0">
                                <div className="w-full h-full rounded-full bg-[#0a0f0d] flex flex-col items-center justify-center border-4 border-[#0d1512]">
                                    <span className="text-2xl font-ibm-plex font-bold text-white tracking-wider">{initials}</span>
                                </div>
                            </div>

                            <div className="flex-1 w-full flex flex-col sm:flex-row sm:justify-between items-start gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-2xl font-syne font-bold text-white">{currentUser.name}</h3>
                                        <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-[10px] text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1"><Shield className="w-3 h-3" /> Subscriber</span>
                                    </div>
                                    <p className="text-sm text-gray-400 flex items-center gap-2 mb-3"><Mail className="w-4 h-4" /> {currentUser.email}</p>
                                    <div className="text-xs font-ibm-plex text-[#00C864]">Member since {joinDate}</div>
                                </div>

                                {!isEditing && (
                                    <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-colors flex items-center gap-2">
                                        <Edit2 className="w-4 h-4" /> Edit Profile
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Edit Form */}
                        {isEditing ? (
                            <form onSubmit={handleProfileSave} className="px-8 pb-8 animate-fade-in border-t border-white/5 pt-6 bg-black/20">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                                    <div>
                                        <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1"><User className="w-3 h-3" /> Full Name</label>
                                        <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#00C864]/50" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone Number</label>
                                        <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#00C864]/50" />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1"><MapPin className="w-3 h-3" /> Address block</label>
                                        <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#00C864]/50" placeholder="Street Address" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">City</label>
                                        <input type="text" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#00C864]/50" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">State</label>
                                        <input type="text" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-400 outline-none select-none cursor-not-allowed" readOnly />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                                    <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2 hover:bg-white/5 text-gray-400 hover:text-white rounded-lg text-sm font-bold transition-colors">Cancel</button>
                                    <button type="submit" disabled={isSaving} className="px-6 py-2 bg-[#00C864] hover:bg-[#00FF85] text-black rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                                        {isSaving ? <span className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full"></span> : <Check className="w-4 h-4" />} Save Changes
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="px-8 pb-8 pr-12 animate-fade-in grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-white/5 text-sm">
                                <div><div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Phone</div><div className="text-gray-200">{currentUser.phone || '-'}</div></div>
                                <div><div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">City</div><div className="text-gray-200">{currentUser.city || '-'}</div></div>
                                <div className="sm:col-span-2"><div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Address</div><div className="text-gray-200 truncate">{currentUser.address || '-'}</div></div>
                            </div>
                        )}
                    </div>

                    {/* PASSWORD CHANGE */}
                    <div className="bg-[#0d1512] border border-white/5 rounded-3xl p-6 lg:p-8">
                        <h3 className="text-base font-syne font-bold text-white mb-6 flex items-center gap-2"><Lock className="w-5 h-5 text-gray-400" /> Security & Authentication</h3>

                        <form onSubmit={handlePasswordSave} className="max-w-md space-y-4">
                            <div>
                                <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">Current Password</label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                                    <input type="password" required value={passData.current} onChange={e => setPassData({ ...passData, current: e.target.value })} className="w-full bg-black/60 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white outline-none focus:border-[#00C864]/50" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">New Password</label>
                                <input type="password" required value={passData.new} onChange={e => setPassData({ ...passData, new: e.target.value })} className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#00C864]/50" />

                                {passData.new && (
                                    <div className="mt-2 flex gap-1 h-1 w-full rounded-full overflow-hidden bg-white/5">
                                        <div className={`h-full transition-all ${passStrength > 0 ? (passStrength < 3 ? 'bg-yellow-500' : 'bg-[#00C864]') : 'bg-transparent'}`} style={{ width: `${(passStrength / 4) * 100}%` }}></div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5 flex justify-between">
                                    Confirm Password
                                    {passError && <span className="text-red-400 capitalize">{passError}</span>}
                                </label>
                                <input type="password" required value={passData.confirm} onChange={e => setPassData({ ...passData, confirm: e.target.value })} className={`w-full bg-black/60 border rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-colors ${passError && passData.confirm ? 'border-red-500/50' : 'border-white/10 focus:border-[#00C864]/50'}`} />
                            </div>
                            <button type="submit" disabled={isChangingPass || !!passError || !passData.new} className="mt-2 px-5 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors">Update Password</button>
                        </form>
                    </div>

                    {/* DATA EXPORT */}
                    <div className="bg-[#0d1512] border border-white/5 rounded-3xl p-6 lg:p-8 flex items-center justify-between border-l-4 border-l-purple-500">
                        <div>
                            <h3 className="text-base font-syne font-bold text-white mb-1 flex items-center gap-2"><Download className="w-5 h-5 text-purple-400" /> Data Portability</h3>
                            <p className="text-xs text-gray-400 max-w-sm">Download a complete ZIP file containing all your telemetry, invoices, and settings in CSV format.</p>
                        </div>
                        <button onClick={handleExportData} className="px-5 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 rounded-xl transition-all shadow-lg shrink-0">
                            Export My Data (CSV)
                        </button>
                    </div>

                </div>

                {/* ─── RIGHT COLUMN ───────────────────────────────────────────────── */}
                <div className="md:col-span-4 flex flex-col gap-6">

                    {/* ACCOUNT INFO (READ ONLY) */}
                    <div className="bg-[#050908] border border-[#00C864]/20 rounded-3xl p-6 shadow-[0_0_20px_rgba(0,200,100,0.05)]">
                        <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-5 flex items-center gap-2"><Battery className="w-4 h-4 text-[#00C864]" /> Active Plan</h3>

                        <div className="bg-[#0a0f0d] border border-white/5 rounded-xl p-4 mb-4 text-center">
                            <div className="text-xl font-syne font-bold text-[#00C864] mb-1">{currentUser.plan}</div>
                            <div className="text-xs text-gray-400">{currentUser.solarKw}kW Array • {currentUser.batteryKwh}kWh Battery</div>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <span className="text-gray-500 uppercase font-ibm-plex text-[10px] tracking-widest">Connect ID</span>
                                <span className="text-white font-ibm-plex font-medium">{currentUser.connectionId}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <span className="text-gray-500 uppercase font-ibm-plex text-[10px] tracking-widest">Meter S/N</span>
                                <span className="text-white font-ibm-plex font-medium">{currentUser.meterNo}</span>
                            </div>
                            <div className="flex justify-between items-center pb-1">
                                <span className="text-gray-500 uppercase font-ibm-plex text-[10px] tracking-widest">Roof Area Reg.</span>
                                <span className="text-white font-ibm-plex font-medium">{currentUser.roofArea || '150'} sq.ft</span>
                            </div>
                        </div>

                        <a href="/services" className="mt-5 w-full block text-center py-2.5 bg-[#00C864]/10 hover:bg-[#00C864]/20 border border-[#00C864]/30 text-[#00C864] rounded-xl text-sm font-bold transition-colors">
                            Manage Subscription →
                        </a>
                    </div>

                    {/* PREFERENCES */}
                    <div className="bg-[#0d1512] border border-white/5 rounded-3xl p-6">
                        <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-5">App Preferences</h3>

                        <div className="space-y-4">

                            {/* Lang */}
                            <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><Globe className="w-4 h-4 text-blue-400" /></div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-200">Language</div>
                                        <div className="text-[10px] text-gray-500">Interface localization</div>
                                    </div>
                                </div>
                                <select value={prefs.language} onChange={e => updatePref('language', e.target.value)} className="bg-black/50 border border-white/10 rounded text-xs text-white p-1.5 outline-none">
                                    <option value="en">English (US)</option>
                                    <option value="hi">हिन्दी (IN)</option>
                                    <option value="gu">ગુજરાતી (GJ)</option>
                                </select>
                            </div>

                            {/* Theme */}
                            <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center"><Sun className="w-4 h-4 text-yellow-400" /></div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-200">System Theme</div>
                                        <div className="text-[10px] text-gray-500">Dark or Light Mode</div>
                                    </div>
                                </div>
                                <div className="flex gap-1 bg-black/50 border border-white/10 p-0.5 rounded-lg">
                                    <button onClick={() => updatePref('theme', 'dark')} className={`p-1.5 rounded-md transition-colors ${prefs.theme === 'dark' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}><Moon className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => updatePref('theme', 'light')} className={`p-1.5 rounded-md transition-colors ${prefs.theme === 'light' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}><Sun className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>

                        </div>

                        {/* NOTIFICATIONS */}
                        <h3 className="text-sm font-bold text-white tracking-widest uppercase mt-8 mb-5 flex items-center gap-2"><Bell className="w-4 h-4 text-gray-400" /> Notifications</h3>

                        <div className="space-y-4">
                            {Object.entries({
                                usageAlerts: { label: 'Usage Alerts', desc: 'Alert at 50%, 75%, 90%' },
                                invoiceGen: { label: 'Invoice Delivery', desc: 'When monthly bill is ready' },
                                solarPerf: { label: 'Performance Updates', desc: 'Weekly diagnostic summaries' },
                                ticketUpdates: { label: 'Support Tickets', desc: 'Status change emails' },
                                weatherAlerts: { label: 'Weather Warnings', desc: 'Low PV forecast SMS' }
                            }).map(([key, info]) => (
                                <div key={key} className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-medium text-gray-200">{info.label}</div>
                                        <div className="text-[10px] text-gray-500">{info.desc}</div>
                                    </div>

                                    <button
                                        onClick={() => updatePref(key, !prefs[key])}
                                        className={`relative w-10 h-5 rounded-full transition-colors ${prefs[key] ? 'bg-[#00C864]' : 'bg-white/10 border border-white/20'}`}
                                    >
                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${prefs[key] ? 'left-[22px] shadow-sm' : 'left-0.5 bg-gray-400'}`}></div>
                                    </button>
                                </div>
                            ))}
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
