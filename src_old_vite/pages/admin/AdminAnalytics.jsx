import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Activity, Zap, TrendingUp, Users, Leaf, Cpu } from 'lucide-react';
import { format, parseISO, startOfMonth, subMonths, isWithinInterval, endOfMonth, eachDayOfInterval } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#050908]/95 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl">
                <p className="font-bold text-white mb-2 text-sm border-b border-white/10 pb-1">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex justify-between gap-4 text-xs font-ibm-plex mb-1">
                        <span className="text-gray-400 font-medium">{entry.name}:</span>
                        <span className="font-bold text-white">{Number(entry.value).toLocaleString()} <span className="text-[10px] text-gray-500">{entry.unit || ''}</span></span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const AdminAnalytics = () => {
    const { csvData } = useApp();

    const dataSets = useMemo(() => {
        // 1. Generation vs Consumption over the last 14 days (Global)
        const dailyData = {};
        csvData.energyReadings.forEach(r => {
            if (!r.date) return;
            const dateStr = r.date.split('T')[0];
            if (!dailyData[dateStr]) dailyData[dateStr] = { date: dateStr, solar: 0, consumption: 0 };
            dailyData[dateStr].solar += parseFloat(r.solarGen || 0);
            dailyData[dateStr].consumption += parseFloat(r.consumption || 0);
        });

        const sortedDaily = Object.values(dailyData)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(-14)
            .map(d => ({ ...d, displayDate: format(parseISO(d.date), 'dd MMM') }));

        // 2. Plan Distribution
        const plans = { 'Basic': 0, 'Premium': 0, 'Pro': 0 };
        csvData.users.forEach(u => {
            if (u.role !== 'admin' && u.plan) {
                const p = u.plan.split(' ')[1] || 'Basic';
                if (plans[p] !== undefined) plans[p]++;
                else plans['Basic']++;
            }
        });
        const pieData = [
            { name: 'Basic', value: plans.Basic, color: '#338bf3' },
            { name: 'Premium', value: plans.Premium, color: '#00C864' },
            { name: 'Pro', value: plans.Pro, color: '#FFB800' }
        ];

        // 3. IoT Device Distribution
        const devices = {};
        csvData.devices.forEach(d => {
            if (!devices[d.type]) devices[d.type] = 0;
            devices[d.type]++;
        });
        const deviceData = Object.entries(devices).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

        // 4. Global Vitals
        const totalUsers = csvData.users.filter(u => u.role !== 'admin').length;
        const totalSolar = sortedDaily.reduce((sum, d) => sum + d.solar, 0).toFixed(0);
        const totalSavedCO2 = (totalSolar * 0.82).toFixed(0); // Approximate 0.82 kg CO2 per kWh

        return { sortedDaily, pieData, deviceData, totalUsers, totalSolar, totalSavedCO2 };
    }, [csvData]);

    return (
        <div className="p-6 lg:p-8 space-y-6 animate-fade-in custom-scrollbar">

            <div className="mb-8">
                <h1 className="text-3xl font-syne font-bold text-white flex items-center gap-3">
                    <Activity className="w-8 h-8 text-purple-500" /> Platform Analytics
                </h1>
                <p className="text-sm text-gray-400 mt-1">Global performance metrics, grid health, and distribution analytics.</p>
            </div>

            {/* Vitals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#0c1020] border border-blue-500/20 rounded-2xl p-6 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-2xl rounded-full group-hover:bg-blue-500/20 transition-all"></div>
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-xs font-semibold text-gray-400 flex items-center gap-2 mb-2 uppercase tracking-wide"><Users className="w-4 h-4 text-blue-400" /> Active Installations</span>
                            <span className="text-3xl font-ibm-plex font-bold text-white block">{dataSets.totalUsers} <span className="text-lg text-gray-500 font-normal">Homes</span></span>
                        </div>
                    </div>
                </div>

                <div className="bg-[#0c1020] border border-[#00C864]/20 rounded-2xl p-6 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#00C864]/10 blur-2xl rounded-full group-hover:bg-[#00C864]/20 transition-all"></div>
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-xs font-semibold text-gray-400 flex items-center gap-2 mb-2 uppercase tracking-wide"><Zap className="w-4 h-4 text-[#00FF85]" /> Platform Solar (14d)</span>
                            <span className="text-3xl font-ibm-plex font-bold text-[#00FF85] block">{Number(dataSets.totalSolar).toLocaleString()} <span className="text-lg text-gray-500 font-normal">kWh</span></span>
                        </div>
                    </div>
                </div>

                <div className="bg-[#0c1020] border border-emerald-500/20 rounded-2xl p-6 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full group-hover:bg-emerald-500/20 transition-all"></div>
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-xs font-semibold text-gray-400 flex items-center gap-2 mb-2 uppercase tracking-wide"><Leaf className="w-4 h-4 text-emerald-400" /> CO2 Offset (14d)</span>
                            <span className="text-3xl font-ibm-plex font-bold text-emerald-400 block">{Number(dataSets.totalSavedCO2).toLocaleString()} <span className="text-lg text-gray-500 font-normal">kg</span></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Energy Trend */}
                <div className="col-span-1 lg:col-span-2 bg-[#0c1020] border border-blue-500/20 rounded-2xl p-6 shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-white flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-400" /> Global Energy Yield vs Load</h3>
                        <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded">Past 14 Days</span>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dataSets.sortedDaily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00C864" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#00C864" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                <XAxis dataKey="displayDate" stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} dx={-10} tickFormatter={(v) => `${v / 1000}k`} />
                                <RechartsTooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
                                <Area type="monotone" name="Solar Yield" dataKey="solar" stroke="#00C864" strokeWidth={3} fillOpacity={1} fill="url(#colorSolar)" unit=" kWh" />
                                <Area type="monotone" name="Power Draw" dataKey="consumption" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorLoad)" unit=" kWh" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distributions */}
                <div className="space-y-6">
                    {/* User Tiers Pie */}
                    <div className="bg-[#0c1020] border border-blue-500/20 rounded-2xl p-6 shadow-lg h-[200px] flex flex-col relative overflow-hidden">
                        <h3 className="font-bold text-white text-sm tracking-wide bg-black/40 px-3 py-1 rounded-full absolute top-4 left-4 z-10 border border-white/5">Subscription Tiers</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={dataSets.pieData} cx="70%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value" stroke="none">
                                    {dataSets.pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                                </Pie>
                                <RechartsTooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 space-y-2">
                            {dataSets.pieData.map(d => (
                                <div key={d.name} className="flex items-center gap-2 text-xs font-semibold">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                                    <span className="text-gray-300">{d.name} <span className="text-gray-500 ml-1">({d.value})</span></span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* IoT Devices Bar */}
                    <div className="bg-[#0c1020] border border-blue-500/20 rounded-2xl p-6 shadow-lg h-[204px] flex flex-col relative">
                        <h3 className="font-bold text-white text-sm tracking-wide mb-4 flex items-center gap-2"><Cpu className="w-4 h-4 text-purple-400" /> Registered IoT Assets</h3>
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dataSets.deviceData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                    <Bar dataKey="value" name="Count" fill="#a855f7" radius={[0, 4, 4, 0]} barSize={12}>
                                        {dataSets.deviceData.map((e, index) => <Cell key={index} fill={index === 0 ? '#a855f7' : '#6b21a8'} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminAnalytics;
