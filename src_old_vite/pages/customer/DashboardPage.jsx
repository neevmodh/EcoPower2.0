import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Sun,
    Zap,
    Battery,
    Leaf,
    ArrowRight,
    Download,
    CreditCard,
    LifeBuoy,
    FileText,
    Bot,
    CloudSun,
    TrendingDown,
    TrendingUp,
    Activity,
    AlertTriangle
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { generateInvoicePDF } from '../../services/invoiceService';

// --- Small Helper for Animated Numbers ---
const CountUp = ({ end, decimals = 0, prefix = '', suffix = '' }) => {
    const [value, setValue] = useState(0);

    useEffect(() => {
        let startTimestamp = null;
        const duration = 1500; // 1.5s
        const startValue = 0;

        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // easeOutQuart
            const easeProgress = 1 - Math.pow(1 - progress, 4);
            setValue(startValue + easeProgress * (end - startValue));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }, [end]);

    return <span>{prefix}{value.toFixed(decimals)}{suffix}</span>;
};

const DashboardPage = () => {
    const navigate = useNavigate();
    const { currentUser, csvData, getTodayReadings, liveReading } = useApp();

    const [timeGreeting, setTimeGreeting] = useState('');
    const [chartRange, setChartRange] = useState('24H');

    // Real-time weather/forecast from CSV (using first item for simplicity)
    const todayWeather = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return csvData.weather.find(w => w.date === today) || csvData.weather[0] || {};
    }, [csvData.weather]);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setTimeGreeting('Good morning');
        else if (hour < 18) setTimeGreeting('Good afternoon');
        else setTimeGreeting('Good evening');
    }, []);

    // --- Calculate KPIs from today's readings ---
    const todayReadings = getTodayReadings(currentUser?.id) || [];

    const metrics = useMemo(() => {
        if (!todayReadings.length) return { solar: 0, consumption: 0, savings: 0, co2: 0, selfSufficiency: 0 };

        const solar = todayReadings.reduce((sum, r) => sum + parseFloat(r.solarGen || 0), 0);
        const consumption = todayReadings.reduce((sum, r) => sum + parseFloat(r.consumption || 0), 0);
        const gridImport = todayReadings.reduce((sum, r) => sum + parseFloat(r.gridImport || 0), 0);
        const gridExport = todayReadings.reduce((sum, r) => sum + parseFloat(r.gridExport || 0), 0);

        const savings = (solar * 8) - (gridImport * 8) + (gridExport * 5);
        const co2 = solar * 0.82; // 0.82 kg CO2 avoided per kWh

        let selfSufficiency = 0;
        if (consumption > 0) {
            selfSufficiency = Math.min(100, (solar / consumption) * 100);
        }

        return { solar, consumption, savings, co2, selfSufficiency, gridImport, gridExport };
    }, [todayReadings]);

    // --- Chart Data Preparation ---
    const chartData = todayReadings.map(r => ({
        time: `${r.hour}:00`,
        solar: parseFloat(r.solarGen),
        load: parseFloat(r.consumption),
        import: parseFloat(r.gridImport)
    }));

    const pieData = [
        { name: 'Solar Used', value: Math.max(0, metrics.solar - metrics.gridExport), color: '#00FF85' },
        { name: 'Grid Import', value: metrics.gridImport, color: '#F97316' }, // Orange
        { name: 'Grid Export', value: metrics.gridExport, color: '#3B82F6' }, // Blue
    ].filter(d => d.value > 0);

    const handleDownloadInvoice = () => {
        const userInvoices = csvData.invoices.filter(i => i.userId === currentUser.id);
        if (userInvoices.length > 0) {
            // Pick the latest one
            const latest = userInvoices[userInvoices.length - 1];
            generateInvoicePDF(latest, currentUser);
        } else {
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'No invoices found.', type: 'error' } }));
        }
    };

    const handleExportReadings = () => {
        if (todayReadings.length === 0) return;
        const header = "time,solar,load,import,battery\n";
        const rows = chartData.map(r => `${r.time},${r.solar},${r.load},${r.import},${r.battery}`).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `readings_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: `Exported readings successfully`, type: 'success' } }));
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">

            {/* ─── SECTION 1: Welcome Hero ────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#00C864]/20 to-transparent border border-[#00C864]/20 relative overflow-hidden">
                {/* Abstract shapes */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00FF85]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="relative z-10 w-full">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-syne font-bold text-white tracking-tight">
                            {timeGreeting}, {currentUser?.name?.split(' ')[0] || 'User'}! {timeGreeting.includes('morning') ? '☀️' : timeGreeting.includes('afternoon') ? '🌤️' : '🌙'}
                        </h1>
                    </div>
                    <p className="text-[#00C864] font-medium text-sm lg:text-base flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Your solar system is performing at 94% efficiency today.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-5">
                        <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                            <CloudSun className="w-4 h-4 text-blue-400" />
                            <span className="text-gray-300">Weather:</span>
                            <span className="text-white font-medium">{todayWeather.condition || 'Sunny'}, {todayWeather.tempHigh || 34}°C</span>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                            <Sun className="w-4 h-4 text-yellow-400" />
                            <span className="text-gray-300">Forecast Gen:</span>
                            <span className="text-white font-medium">{todayWeather.forecastedGenKwh || 12.5} kWh</span>
                        </div>
                        <div className="bg-[#00C864]/10 border border-[#00C864]/30 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                            <Leaf className="w-4 h-4 text-[#00FF85]" />
                            <span className="text-[#00C864] font-medium">On track for 15% savings goal</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── SECTION 2: 4 KPI Cards ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {/* Card 1: Solar Gen */}
                <div className="bg-[#0d1512] border border-[#00C864]/20 rounded-2xl p-5 relative overflow-hidden group hover:border-[#00C864]/40 transition-colors">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#00C864]/10 rounded-full blur-2xl group-hover:bg-[#00C864]/20 transition-colors"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-[#00C864]/10 rounded-xl">
                            <Sun className="w-6 h-6 text-[#00FF85] animate-[spin_10s_linear_infinite]" />
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-[#00C864] bg-[#00C864]/10 px-2 py-1 rounded-md">
                            <TrendingUp className="w-3 h-3" /> +12%
                        </div>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm font-medium mb-1 tracking-wide">Solar Generation Today</p>
                        <h3 className="text-3xl font-ibm-plex font-bold text-white tracking-tight">
                            <CountUp end={metrics.solar} decimals={1} suffix=" kWh" />
                        </h3>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-[#00C864] to-[#00FF85] rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${Math.min(100, (metrics.solar / 12.5) * 100)}%` }}
                            ></div>
                        </div>
                        <span className="text-xs text-gray-500 font-ibm-plex">{Math.round((metrics.solar / 12.5) * 100) || 0}% of expected</span>
                    </div>
                </div>

                {/* Card 2: Consumption */}
                <div className="bg-[#0d1512] border border-blue-500/20 rounded-2xl p-5 relative overflow-hidden group hover:border-blue-500/40 transition-colors">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-blue-500/10 rounded-xl">
                            <Zap className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded-md">
                            <TrendingUp className="w-3 h-3" /> +4%
                        </div>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm font-medium mb-1 tracking-wide">Consumption Today</p>
                        <h3 className="text-3xl font-ibm-plex font-bold text-white tracking-tight">
                            <CountUp end={metrics.consumption} decimals={1} suffix=" kWh" />
                        </h3>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs font-medium">
                        <span className="text-blue-400 font-ibm-plex">{metrics.selfSufficiency.toFixed(0)}% Self-sufficient</span>
                        <span className="text-gray-500 border border-white/10 px-2 py-0.5 rounded">vs Yes. {metrics.consumption > 0 ? '14.2' : '0.0'} kWh</span>
                    </div>
                </div>

                {/* Card 3: Savings */}
                <div className="bg-[#0d1512] border border-yellow-500/20 rounded-2xl p-5 relative overflow-hidden group hover:border-yellow-500/40 transition-colors">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl group-hover:bg-yellow-500/20 transition-colors"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-yellow-500/10 rounded-xl">
                            <CreditCard className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-[#00C864] bg-[#00C864]/10 px-2 py-1 rounded-md">
                            <TrendingDown className="w-3 h-3" /> -8% bill
                        </div>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm font-medium mb-1 tracking-wide">Est. Savings (Month)</p>
                        <h3 className="text-3xl font-ibm-plex font-bold text-white tracking-tight">
                            <CountUp end={metrics.savings > 0 ? metrics.savings : 0} prefix="₹" />
                        </h3>
                    </div>
                    <div className="mt-4">
                        <span className="text-xs text-yellow-500/80 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 font-medium">
                            Saved vs grid-only setup
                        </span>
                    </div>
                </div>

                {/* Card 4: CO2 */}
                <div className="bg-[#0d1512] border border-purple-500/20 rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/40 transition-colors">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-purple-500/10 rounded-xl group-hover:animate-bounce">
                            <Leaf className="w-6 h-6 text-purple-400" />
                        </div>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm font-medium mb-1 tracking-wide">CO₂ Avoided Today</p>
                        <h3 className="text-3xl font-ibm-plex font-bold text-white tracking-tight">
                            <CountUp end={metrics.co2} decimals={1} suffix=" kg" />
                        </h3>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-xs text-purple-400 font-ibm-plex border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 rounded">
                            ≈ {(metrics.co2 / 21).toFixed(1)} trees planted equivalent
                        </span>
                    </div>
                </div>
            </div>

            {/* ─── SECTION 3: Main Charts Row ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Chart: Energy Flow (Line/Area) */}
                <div className="lg:col-span-2 bg-[#0d1512] border border-white/5 rounded-2xl p-5 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-semibold text-lg text-gray-200">Energy Flow Analysis</h3>
                        <div className="flex bg-black/40 border border-white/5 rounded-lg p-1">
                            {['24H', '7D', '30D'].map(range => (
                                <button
                                    key={range}
                                    onClick={() => setChartRange(range)}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${chartRange === range ? 'bg-[#00C864]/20 text-[#00C864]' : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 min-h-[300px] w-full relative">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00C864" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#00C864" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="time"
                                        stroke="#6b7280"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => val.split(':')[0] % 4 === 0 ? val : ''} // Decimate labels
                                    />
                                    <YAxis
                                        stroke="#6b7280"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => `${val}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0a0f0d', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        itemStyle={{ fontSize: '12px' }}
                                        labelStyle={{ color: '#9ca3af', marginBottom: '4px', fontSize: '12px' }}
                                    />
                                    <Area type="monotone" dataKey="solar" name="Solar Gen (kW)" stroke="#00C864" strokeWidth={3} fillOpacity={1} fill="url(#colorSolar)" />
                                    <Area type="monotone" dataKey="load" name="Home Load (kW)" stroke="#3B82F6" strokeWidth={2} fill="none" dot={false} />
                                    <Area type="step" dataKey="import" name="Grid Import (kW)" stroke="#F97316" strokeWidth={1} strokeDasharray="4 4" fill="none" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                                No reading data available
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Chart: Pie Chart Breakdown */}
                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-5 flex flex-col items-center">
                    <h3 className="font-semibold text-lg text-gray-200 w-full text-left mb-2">Source Breakdown</h3>
                    <p className="text-xs text-gray-400 w-full text-left mb-4">Today's energy distribution</p>

                    <div className="w-full flex-1 relative min-h-[220px]">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                        animationDuration={1500}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0a0f0d', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        itemStyle={{ fontSize: '12px', color: '#fff' }}
                                        formatter={(value) => [`${value.toFixed(1)} kWh`, '']}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                                No data
                            </div>
                        )}
                        {/* Center Label Custom */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-36px]">
                            <span className="text-xl font-bold font-ibm-plex text-white">{metrics.selfSufficiency.toFixed(0)}%</span>
                            <span className="text-[10px] uppercase tracking-widest text-[#00C864] font-semibold mt-1">Self-Sufficient</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── SECTION 4 & 5: Live Flow & Readings Table ─────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Live Energy Flow Graphic */}
                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-lg text-gray-200">Live Energy Flow</h3>
                        <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#00FF85]/10 text-[#00FF85] text-xs font-bold uppercase border border-[#00FF85]/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF85] animate-ping"></span> Live
                        </span>
                    </div>

                    <div className="bg-[#050908] rounded-xl border border-white/5 p-8 relative flex flex-col items-center gap-12 mt-4">

                        {/* Top row: Solar -> Inverter -> Home */}
                        <div className="flex justify-between w-full items-center relative z-10 px-2 lg:px-8">
                            {/* Solar Hub */}
                            <div className="flex flex-col items-center relative z-20">
                                <div className="w-14 h-14 rounded-full bg-[#00C864]/20 border border-[#00C864]/50 flex items-center justify-center shadow-[0_0_15px_rgba(0,200,100,0.3)] mb-2">
                                    <Sun className="w-7 h-7 text-[#00FF85]" />
                                </div>
                                <span className="text-xs text-gray-400 font-medium tracking-wide">SOLAR</span>
                                <span className="text-sm font-bold text-[#00C864] font-ibm-plex mt-0.5">{liveReading.solarGen} kW</span>
                            </div>

                            {/* Home Hub */}
                            <div className="flex flex-col items-center relative z-20">
                                <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-2">
                                    <Activity className="w-7 h-7 text-blue-400" />
                                </div>
                                <span className="text-xs text-gray-400 font-medium tracking-wide">HOME</span>
                                <span className="text-sm font-bold text-blue-400 font-ibm-plex mt-0.5">{liveReading.consumption} kW</span>
                            </div>
                        </div>

                        {/* Bottom row: Battery & Grid */}
                        <div className="flex justify-between w-full items-center relative z-10 px-12 lg:px-[70px]">
                            {/* Battery Hub */}
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-2">
                                    <Battery className="w-6 h-6 text-purple-400" />
                                </div>
                                <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">Battery</span>
                                <span className="text-xs font-bold text-purple-400 font-ibm-plex mt-0.5">{liveReading.batteryLevel}%</span>
                            </div>

                            {/* Grid Hub */}
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-2">
                                    <Zap className="w-6 h-6 text-orange-400" />
                                </div>
                                <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">Grid</span>
                                {liveReading.gridExport > 0 ? (
                                    <span className="text-xs font-bold text-[#00C864] font-ibm-plex mt-0.5 flex items-center"><ArrowRight className="w-3 h-3 mr-0.5" />{liveReading.gridExport}kW</span>
                                ) : (
                                    <span className="text-xs font-bold text-orange-400 font-ibm-plex mt-0.5">{liveReading.gridImport} kW</span>
                                )}
                            </div>
                        </div>

                        {/* SVG Lines */}
                        <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" style={{ filter: 'drop-shadow(0px 0px 4px rgba(255,255,255,0.1))' }}>
                            <path d="M 80 50 L 250 50" stroke="#00C864" strokeWidth="2" strokeDasharray="6 6" fill="none" className="animate-[dash_20s_linear_infinite]" />
                            <path d="M 80 80 L 80 160" stroke="#A855F7" strokeWidth="2" strokeDasharray="4 4" fill="none" className="opacity-40" />
                            <path d="M 250 80 L 250 160" stroke="#F97316" strokeWidth="2" strokeDasharray="4 4" fill="none" className="opacity-40" />
                            <style>{`
                @keyframes dash { to { stroke-dashoffset: -400; } }
              `}</style>
                        </svg>

                    </div>
                </div>

                {/* Readings Table */}
                <div className="xl:col-span-2 bg-[#0d1512] border border-white/5 rounded-2xl p-5 flex flex-col h-[400px]">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <h3 className="font-semibold text-lg text-gray-200">Recent Readings</h3>
                        <button
                            onClick={handleExportReadings}
                            className="flex items-center gap-2 text-xs font-medium text-[#00C864] hover:text-white bg-[#00C864]/10 hover:bg-[#00C864]/20 px-3 py-1.5 rounded-lg border border-[#00C864]/20 transition-colors"
                        >
                            <Download className="w-3.5 h-3.5" /> Export Data
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-[#050908] sticky top-0 z-10 text-xs uppercase tracking-wider text-gray-400 font-semibold border-y border-white/5">
                                <tr>
                                    <th className="px-4 py-3">Time</th>
                                    <th className="px-4 py-3">Solar (kW)</th>
                                    <th className="px-4 py-3">Load (kW)</th>
                                    <th className="px-4 py-3">Grid Imp</th>
                                    <th className="px-4 py-3">Grid Exp</th>
                                    <th className="px-4 py-3">Battery</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-ibm-plex text-gray-300">
                                {todayReadings.slice(-10).reverse().map((r, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3">{r.hour}:00</td>
                                        <td className="px-4 py-3 text-[#00FF85]">{parseFloat(r.solarGen).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-blue-400">{parseFloat(r.consumption).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-orange-400">{parseFloat(r.gridImport) > 0 ? parseFloat(r.gridImport).toFixed(2) : '-'}</td>
                                        <td className="px-4 py-3 text-emerald-400">{parseFloat(r.gridExport) > 0 ? parseFloat(r.gridExport).toFixed(2) : '-'}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                    <div className="h-full bg-purple-500" style={{ width: `${r.batteryLevel}%` }}></div>
                                                </div>
                                                {r.batteryLevel}%
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {todayReadings.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-8 text-gray-500 font-jakarta">No readings available for today.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ─── SECTION 6: Quick Actions ───────────────────────────────────────── */}
            <h3 className="font-semibold text-lg text-gray-200 mt-8 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 lg:gap-4">
                <button onClick={() => navigate('/billing')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-[#0d1512] border border-white/5 hover:bg-white/5 hover:border-[#00C864]/30 transition-all group">
                    <CreditCard className="w-6 h-6 text-gray-400 group-hover:text-[#00C864]" />
                    <span className="text-xs font-medium text-gray-300 group-hover:text-white">Pay Bill</span>
                </button>
                <button onClick={() => navigate('/support')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-[#0d1512] border border-white/5 hover:bg-white/5 hover:border-[#00C864]/30 transition-all group">
                    <LifeBuoy className="w-6 h-6 text-gray-400 group-hover:text-amber-400" />
                    <span className="text-xs font-medium text-gray-300 group-hover:text-white">Report Issue</span>
                </button>
                <button onClick={handleDownloadInvoice} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-[#0d1512] border border-white/5 hover:bg-white/5 hover:border-[#00C864]/30 transition-all group">
                    <FileText className="w-6 h-6 text-gray-400 group-hover:text-blue-400" />
                    <span className="text-xs font-medium text-gray-300 group-hover:text-white">Last Invoice</span>
                </button>
                <button onClick={() => navigate('/advisor')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl relative overflow-hidden bg-[#0d1512] border border-white/5 hover:border-purple-500/30 transition-all group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Bot className="w-6 h-6 text-purple-400 relative z-10" />
                    <span className="text-xs font-medium text-gray-300 group-hover:text-white relative z-10">AI Advisor</span>
                    <div className="absolute top-2 right-2 flex space-x-0.5 animate-pulse">
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div><div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                    </div>
                </button>
                <button onClick={() => navigate('/forecast')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-[#0d1512] border border-white/5 hover:bg-white/5 hover:border-[#00C864]/30 transition-all group">
                    <CloudSun className="w-6 h-6 text-gray-400 group-hover:text-amber-300" />
                    <span className="text-xs font-medium text-gray-300 group-hover:text-white">Forecast</span>
                </button>
                <button onClick={() => navigate('/carbon')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-[#0d1512] border border-white/5 hover:bg-white/5 hover:border-[#00C864]/30 transition-all group">
                    <Leaf className="w-6 h-6 text-gray-400 group-hover:text-[#00C864]" />
                    <span className="text-xs font-medium text-gray-300 group-hover:text-white">Carbon Impact</span>
                </button>
            </div>

        </div>
    );
};

export default DashboardPage;
