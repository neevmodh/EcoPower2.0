import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import {
    Users, Zap, CreditCard, Ticket, AlertCircle,
    TrendingUp, Activity, CheckCircle2, ChevronRight
} from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

const AdminDashboard = () => {
    const { csvData, refreshData } = useApp();
    const navigate = useNavigate();

    // ─── PLATFORM KPI AGGREGATION ─────────────────────────────────────────
    const platformStats = useMemo(() => {
        const totalUsers = csvData.users.filter(u => u.role !== 'admin').length;

        // Solar Today
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const todaySolar = csvData.energyReadings
            .filter(r => r.date && r.date.startsWith(todayStr))
            .reduce((sum, r) => sum + parseFloat(r.solarGen || 0), 0);

        // Revenue MTD
        const startMtd = startOfMonth(new Date());
        const endMtd = endOfMonth(new Date());
        const revenueMtd = csvData.invoices
            .filter(i => i.date && isWithinInterval(parseISO(i.date), { start: startMtd, end: endMtd }))
            .reduce((sum, i) => sum + parseFloat(i.totalAmount || 0), 0);

        // Pending Payments
        const pendingInvoices = csvData.invoices.filter(i => i.status?.toLowerCase() === 'pending').length;

        // Open Tickets
        const openTickets = csvData.tickets.filter(t => t.status?.toLowerCase() === 'open' || t.status?.toLowerCase() === 'in progress').length;

        // Platform CO2
        const totalSolarEver = csvData.energyReadings.reduce((sum, r) => sum + parseFloat(r.solarGen || 0), 0);
        const co2Saved = totalSolarEver * 0.82;

        return { totalUsers, todaySolar: todaySolar.toFixed(1), revenueMtd, pendingInvoices, openTickets, co2Saved: co2Saved.toFixed(0) };
    }, [csvData]);


    // ─── CHARTS DATA PUMP ───────────────────────────────────────────────
    const revenueChartData = useMemo(() => {
        const data = [];
        for (let i = 5; i >= 0; i--) {
            const d = subMonths(new Date(), i);
            const start = startOfMonth(d); const end = endOfMonth(d);
            const monthTotal = csvData.invoices
                .filter(inv => inv.date && isWithinInterval(parseISO(inv.date), { start, end }))
                .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0);

            data.push({ name: format(d, 'MMM'), revenue: monthTotal });
        }
        return data;
    }, [csvData.invoices]);

    const planBreakdown = useMemo(() => {
        const counts = { 'Solar Basic': 0, 'Solar Premium': 0, 'Solar Pro': 0 };
        csvData.users.filter(u => u.role !== 'admin').forEach(u => {
            if (counts[u.plan] !== undefined) counts[u.plan]++;
            else counts['Solar Basic']++; // fallback
        });
        return [
            { name: 'Solar Basic', value: counts['Solar Basic'], color: '#3b82f6' },
            { name: 'Solar Premium', value: counts['Solar Premium'], color: '#00C864' },
            { name: 'Solar Pro', value: counts['Solar Pro'], color: '#8b5cf6' }
        ];
    }, [csvData.users]);


    // ─── LIVE USERS TABLE MAPPER ────────────────────────────────────────
    const liveUsers = useMemo(() => {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        return csvData.users.filter(u => u.role !== 'admin').map(user => {
            const todayGen = csvData.energyReadings
                .filter(r => r.userId === user.id && r.date && r.date.startsWith(todayStr))
                .reduce((sum, r) => sum + parseFloat(r.solarGen || 0), 0).toFixed(1);
            return { ...user, todayGen };
        }).slice(0, 10); // Display top 10 for dashboard
    }, [csvData.users, csvData.energyReadings]);


    // ─── RECENT ACTIVITY LOGS ───────────────────────────────────────────
    const recentActivity = useMemo(() => {
        const logs = [];
        // 1. Invoices paid
        csvData.invoices.filter(i => i.status === 'Paid').forEach(i => {
            const u = csvData.users.find(usr => usr.id === i.userId);
            if (u) logs.push({ time: i.date, text: `${u.name} paid invoice ${i.id} — ₹${i.totalAmount}`, type: 'pay', icon: <CreditCard className="w-3 h-3 text-blue-400" />, color: 'bg-blue-500/10 border-blue-500/20' });
        });
        // 2. Tickets raised
        csvData.tickets.forEach(t => {
            const u = csvData.users.find(usr => usr.id === t.userId);
            if (u) logs.push({ time: t.createdAt, text: `${u.name} raised ticket ${t.id} — ${t.issueType}`, type: 'ticket', icon: <Ticket className="w-3 h-3 text-red-400" />, color: 'bg-red-500/10 border-red-500/20' });
        });
        // 3. New Subscriptions (mock using user join date)
        csvData.users.filter(u => u.role !== 'admin').forEach(u => {
            if (u.joinDate) {
                logs.push({ time: u.joinDate, text: `${u.name} subscribed to ${u.plan}`, type: 'sub', icon: <Zap className="w-3 h-3 text-[#00C864]" />, color: 'bg-[#00C864]/10 border-[#00C864]/20' });
            }
        });

        return logs.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);
    }, [csvData]);

    // Support Tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#0c1020] border border-[#3b82f6]/20 p-3 rounded-lg shadow-xl">
                    <p className="text-white font-bold text-xs mb-1">{label}</p>
                    <p className="text-blue-400 text-sm font-ibm-plex font-bold">₹{payload[0].value.toLocaleString()}</p>
                </div>
            );
        }
        return null;
    };


    return (
        <div className="space-y-8 animate-fade-in pb-10">

            {/* ─── HEADER ──────────────────────────────────────────────────────── */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-syne font-bold text-white mb-2">Platform Overview</h2>
                    <p className="text-sm text-gray-400">Global metrics aggregating all {platformStats.totalUsers} registered customers.</p>
                </div>
                <button onClick={refreshData} className="px-4 py-2 bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 border border-[#3b82f6]/30 text-blue-400 rounded-lg text-sm font-bold transition-all flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Sync Data
                </button>
            </div>

            {/* ─── SECTION 1: KPIS ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">

                <div className="bg-[#0c1020] border border-[#3b82f6]/15 rounded-2xl p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Total Active Users</span>
                        <div className="w-8 h-8 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center shrink-0"><Users className="w-4 h-4 text-[#3b82f6]" /></div>
                    </div>
                    <div className="text-2xl font-ibm-plex font-bold text-white">{platformStats.totalUsers}</div>
                </div>

                <div className="bg-[#0c1020] border border-[#3b82f6]/15 rounded-2xl p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Platform Solar Today</span>
                        <div className="w-8 h-8 rounded-lg bg-[#00C864]/10 flex items-center justify-center shrink-0"><Zap className="w-4 h-4 text-[#00C864]" /></div>
                    </div>
                    <div className="text-2xl font-ibm-plex font-bold text-white">{platformStats.todaySolar} <span className="text-sm text-gray-500 font-normal">kWh</span></div>
                </div>

                <div className="bg-[#0c1020] border border-[#3b82f6]/15 rounded-2xl p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Revenue (MTD)</span>
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0"><TrendingUp className="w-4 h-4 text-green-400" /></div>
                    </div>
                    <div className="text-2xl font-ibm-plex font-bold text-white">₹{platformStats.revenueMtd.toLocaleString()}</div>
                </div>

                <div className="bg-[#0c1020] border border-[#3b82f6]/15 rounded-2xl p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Pending Payments</span>
                        <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0"><CreditCard className="w-4 h-4 text-yellow-500" /></div>
                    </div>
                    <div className="text-2xl font-ibm-plex font-bold text-white flex items-center gap-2">
                        {platformStats.pendingInvoices}
                        {platformStats.pendingInvoices > 0 && <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>}
                    </div>
                </div>

                <div className="bg-[#0c1020] border border-red-500/20 rounded-2xl p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(239,68,68,0.05)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 blur-[20px]"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <span className="text-[10px] text-red-300 uppercase font-bold tracking-widest">Open Tickets</span>
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0"><AlertCircle className="w-4 h-4 text-red-500" /></div>
                    </div>
                    <div className="text-2xl font-ibm-plex font-bold text-white relative z-10">{platformStats.openTickets}</div>
                </div>

                <div className="bg-[#0c1020] border border-[#3b82f6]/15 rounded-2xl p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.2)] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDYwODEwIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjM2I4MmY2IiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')]"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <span className="text-[10px] text-purple-300 uppercase font-bold tracking-widest">Total CO₂ Saved</span>
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0"><CheckCircle2 className="w-4 h-4 text-purple-400" /></div>
                    </div>
                    <div className="text-2xl font-ibm-plex font-bold text-white relative z-10">{platformStats.co2Saved} <span className="text-sm text-gray-500 font-normal">kg</span></div>
                </div>

            </div>

            {/* ─── SECTION 2: CHARTS ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Monthly Revenue Chart */}
                <div className="lg:col-span-2 bg-[#0c1020] border border-[#3b82f6]/15 rounded-3xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#3b82f6]" /> Monthly Revenue Trend</h3>
                        <select className="bg-[#060810] border border-[#3b82f6]/20 text-xs text-gray-300 rounded-lg px-2 py-1 outline-none">
                            <option>Last 6 Months</option>
                            <option>Last 12 Months</option>
                        </select>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barSize={36}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                                <YAxis hide />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
                                <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 6, 6]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Plan Distribution Pie */}
                <div className="bg-[#0c1020] border border-[#3b82f6]/15 rounded-3xl p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-2"><Users className="w-4 h-4 text-[#3b82f6]" /> User Tiers</h3>
                    </div>
                    <div className="flex-1 min-h-[220px] relative mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={planBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                                    {planBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0c1020', borderColor: 'rgba(59,130,246,0.2)', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="text-3xl font-ibm-plex font-bold text-white">{platformStats.totalUsers}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total</div>
                        </div>
                    </div>
                    <div className="flex justify-center gap-4 mt-2">
                        {planBreakdown.map(p => (
                            <div key={p.name} className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></div>
                                <span className="text-[10px] text-gray-400 font-medium">{p.name && p.name.includes(' ') ? p.name.split(' ')[1] : p.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* ─── SECTION 3: BOTTOM PANELS ───────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Live Users Table preview */}
                <div className="lg:col-span-2 bg-[#0c1020] border border-[#3b82f6]/15 rounded-3xl p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-white tracking-widest uppercase">Live Installations</h3>
                        <button onClick={() => navigate('/admin/users')} className="text-xs text-[#3b82f6] hover:text-blue-400 font-bold flex items-center gap-1">View All <ChevronRight className="w-3 h-3" /></button>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#3b82f6]/10">
                                    <th className="pb-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Customer</th>
                                    <th className="pb-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold">City</th>
                                    <th className="pb-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Plan</th>
                                    <th className="pb-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold text-right pt-1">Today's Solar</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-[#3b82f6]/5">
                                {liveUsers.map((u, i) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="py-3">
                                            <div className="font-bold text-white group-hover:text-[#3b82f6] transition-colors">{u.name}</div>
                                            <div className="text-[10px] text-gray-500 font-ibm-plex">{u.id}</div>
                                        </td>
                                        <td className="py-3 text-gray-300">{u.city || '-'}</td>
                                        <td className="py-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest border ${u.plan === 'Solar Premium' ? 'bg-[#00C864]/10 border-[#00C864]/30 text-[#00C864]' : u.plan === 'Solar Pro' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-[#3b82f6]/10 border-[#3b82f6]/30 text-[#3b82f6]'}`}>
                                                {u.plan.replace('Solar ', '')}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right">
                                            <span className="font-ibm-plex font-bold text-white">{u.todayGen}</span> <span className="text-[10px] text-gray-500">kWh</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Global Activity Feed */}
                <div className="bg-[#0c1020] border border-[#3b82f6]/15 rounded-3xl p-6 flex flex-col">
                    <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-6 flex items-center gap-2"><Activity className="w-4 h-4 text-[#3b82f6]" /> Platform Activity</h3>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                        {recentActivity.map((log, idx) => (
                            <div key={idx} className="flex gap-3 items-start animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${log.color}`}>
                                    {log.icon}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-300 leading-relaxed font-medium">{log.text}</p>
                                    <span className="text-[10px] text-gray-500 font-ibm-plex">{format(new Date(log.time), 'dd MMM HH:mm')}</span>
                                </div>
                            </div>
                        ))}
                        {recentActivity.length === 0 && <div className="text-xs text-center text-gray-500 mt-10">No recent activity detected.</div>}
                    </div>
                </div>

            </div>

        </div>
    );
};

export default AdminDashboard;
