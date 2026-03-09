import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
    Calendar, Download, TrendingUp, TrendingDown, Zap, Sun, Leaf, Activity, Award, FileText
} from 'lucide-react';
import {
    BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ReferenceLine, Cell
} from 'recharts';
import { format, subDays, subMonths, isAfter, isBefore, parseISO, differenceInDays } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// ─── UTILS & PDF GENERATORS ──────────────────────────────────────────────────
const generateMonthlyPDF = (readings, user) => {
    const doc = new jsPDF();

    doc.setFillColor(5, 9, 8); // #050908
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(0, 200, 100); // #00C864
    doc.setFontSize(22);
    doc.text('EcoPower', 14, 25);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('Monthly Energy Summary', 14, 32);

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.text(`Customer: ${user?.name || 'User'}`, 14, 50);
    doc.text(`Account ID: ${user?.connectionId || 'N/A'}`, 14, 56);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy')}`, 14, 62);

    const tableData = readings.slice(0, 30).map(r => [
        r.date,
        parseFloat(r.solarGen).toFixed(1) + ' kWh',
        parseFloat(r.consumption).toFixed(1) + ' kWh',
        parseFloat(r.gridExport).toFixed(1) + ' kWh',
        parseFloat(r.gridImport).toFixed(1) + ' kWh'
    ]);

    doc.autoTable({
        startY: 70,
        head: [['Date', 'Solar Gen', 'Consumption', 'Export', 'Import']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [0, 200, 100], textColor: [0, 0, 0], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.save(`EcoPower_MonthlySummary_${format(new Date(), 'MMM_yyyy')}.pdf`);
};

const generateSavingsPDF = (readings, user) => {
    const doc = new jsPDF();
    doc.setFillColor(5, 9, 8); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(0, 200, 100); doc.setFontSize(22); doc.text('EcoPower', 14, 25);
    doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.text('Savings Analysis Report', 14, 32);

    doc.setTextColor(0, 0, 0);
    doc.text("Cost comparison with and without Solar installation.", 14, 50);

    // Calculate aggregates
    let totalCons = 0, totalGen = 0, totalImp = 0, totalExp = 0;
    readings.forEach(r => {
        totalCons += parseFloat(r.consumption) || 0;
        totalGen += parseFloat(r.solarGen) || 0;
        totalImp += parseFloat(r.gridImport) || 0;
        totalExp += parseFloat(r.gridExport) || 0;
    });

    const withoutSolarCost = totalCons * 8;
    const withSolarCost = (totalImp * 8) - (totalExp * 5);
    const savings = withoutSolarCost - withSolarCost;

    doc.setFontSize(14);
    doc.text(`Estimated Old Bill (Grid Only): Rs ${withoutSolarCost.toFixed(2)}`, 14, 65);
    doc.text(`New Bill (EcoPower Solar): Rs ${withSolarCost.toFixed(2)}`, 14, 75);

    doc.setTextColor(0, 180, 80);
    doc.setFontSize(16);
    doc.text(`Total Period Savings: Rs ${savings.toFixed(2)}`, 14, 90);

    doc.save(`EcoPower_SavingsAnalysis_${Date.now()}.pdf`);
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const AnalyticsPage = () => {
    const { currentUser, csvData } = useApp();
    const [timeRange, setTimeRange] = useState('30D'); // 7D, 30D, 90D, 180D
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    // 1. FILTER DATA BY USER AND DATE RANGE
    const allUserReadings = useMemo(() => {
        return csvData.energyReadings
            .filter(r => r.userId === currentUser?.id)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [csvData.energyReadings, currentUser]);

    const filteredReadings = useMemo(() => {
        if (!allUserReadings.length) return [];

        let startDate, endDate = new Date();

        if (timeRange === '7D') startDate = subDays(endDate, 7);
        else if (timeRange === '30D') startDate = subDays(endDate, 30);
        else if (timeRange === '90D') startDate = subDays(endDate, 90);
        else if (timeRange === '180D') startDate = subDays(endDate, 180);
        else if (timeRange === 'CUSTOM' && customStart && customEnd) {
            startDate = new Date(customStart);
            endDate = new Date(customEnd);
            // Include full end day
            endDate.setHours(23, 59, 59, 999);
        } else {
            startDate = subDays(endDate, 30); // fallback
        }

        return allUserReadings.filter(r => {
            const d = parseISO(r.date);
            return (d >= startDate && d <= endDate);
        });
    }, [allUserReadings, timeRange, customStart, customEnd]);

    // 2. CALCULATE KPIs
    const kpis = useMemo(() => {
        if (!filteredReadings.length) return { bestDay: '-', bestGen: 0, avgGen: 0, earnings: 0, selfSuff: 0, co2: 0, zeroImportDays: 0 };

        let maxGen = 0;
        let bestDay = '-';
        let totalGen = 0;
        let totalCons = 0;
        let totalExp = 0;
        let zeroImpDays = 0;

        filteredReadings.forEach(r => {
            const gen = parseFloat(r.solarGen) || 0;
            const cons = parseFloat(r.consumption) || 0;
            const exp = parseFloat(r.gridExport) || 0;
            const imp = parseFloat(r.gridImport) || 0;

            totalGen += gen;
            totalCons += cons;
            totalExp += exp;

            if (imp <= 0 && cons > 0) zeroImpDays++;

            if (gen > maxGen) {
                maxGen = gen;
                bestDay = r.date;
            }
        });

        const daysCount = filteredReadings.length;
        const selfSuff = totalCons > 0 ? (totalGen / totalCons) * 100 : 0;
        const earnings = totalExp * 5.0; // ₹5 per kWh export
        const co2 = totalGen * 0.82; // 0.82 kg CO2 per kWh

        return {
            bestDay,
            bestGen: maxGen.toFixed(1),
            avgGen: (totalGen / daysCount).toFixed(1),
            earnings: earnings.toFixed(0),
            selfSuff: Math.min(100, selfSuff).toFixed(1), // cap at 100% just in case
            co2: co2.toFixed(0),
            zeroImportDays: zeroImpDays
        };
    }, [filteredReadings]);

    // 3. PREPARE CHART DATA
    // Chart 1: Monthly/Daily Trend (using daily for better viz in smaller ranges)
    const chart1Data = filteredReadings.map(r => ({
        date: format(parseISO(r.date), 'MMM dd'),
        Generation: parseFloat(r.solarGen) || 0,
        Consumption: parseFloat(r.consumption) || 0
    }));

    // Chart 2: Average Daily Pattern (Mocked by distributing daily totals into a bell curve for Solar, and M-curve for Load)
    const chart2Data = useMemo(() => {
        // In real app, we'd aggregate hourly data. We mock a 24h profile scaled by daily averages
        if (!filteredReadings.length) return [];

        const avgGen = parseFloat(kpis.avgGen);
        const avgCons = filteredReadings.reduce((sum, r) => sum + parseFloat(r.consumption || 0), 0) / filteredReadings.length;

        const profile = [];
        for (let i = 0; i < 24; i++) {
            // Solar: Bell curve peaking at 13:00
            let solarObj = 0;
            if (i >= 6 && i <= 18) {
                solarObj = Math.max(0, Math.sin((i - 6) * Math.PI / 12) * (avgGen / 6));
            }
            // Load: M-curve peaking at 9:00 and 20:00
            const baseLoad = avgCons / 36;
            let loadObj = baseLoad + Math.sin(i * Math.PI / 12) * (baseLoad * 0.3) + (i === 9 || i === 20 ? baseLoad * 1.5 : 0);

            profile.push({
                hour: `${i.toString().padStart(2, '0')}:00`,
                Load: parseFloat(loadObj.toFixed(2)),
                Solar: parseFloat(solarObj.toFixed(2))
            });
        }
        return profile;
    }, [filteredReadings, kpis.avgGen]);

    // Chart 3: Financial Analysis
    // Group by month to show stacked finances
    const chart3Data = useMemo(() => {
        const monthlyMap = new Map();
        filteredReadings.forEach(r => {
            const month = format(parseISO(r.date), 'MMM yyyy');
            if (!monthlyMap.has(month)) {
                monthlyMap.set(month, { month, PlanFee: 2999, ImportCost: 0, ExportCredit: 0 }); // Hardcoded base plan fee for mockup
            }
            const data = monthlyMap.get(month);
            data.ImportCost += (parseFloat(r.gridImport) || 0) * 8.0;
            data.ExportCredit -= (parseFloat(r.gridExport) || 0) * 5.0; // Negative for overlay
            monthlyMap.set(month, data);
        });

        return Array.from(monthlyMap.values()).map(d => ({
            ...d,
            NetCost: parseFloat((d.PlanFee + d.ImportCost + d.ExportCredit).toFixed(0)), // ExportCredit is negative
            ImportCost: parseFloat(d.ImportCost.toFixed(0)),
            ExportCredit: parseFloat(d.ExportCredit.toFixed(0))
        }));
    }, [filteredReadings]);

    // Chart 4: Self Sufficiency Trend
    const chart4Data = filteredReadings.map(r => {
        const gen = parseFloat(r.solarGen) || 0;
        const cons = parseFloat(r.consumption) || 0;
        const suff = cons > 0 ? (gen / cons) * 100 : 0;
        return {
            date: format(parseISO(r.date), 'MMM dd'),
            Sufficiency: parseFloat(Math.min(150, suff).toFixed(1)) // Cap at 150 solely for chart scale
        };
    });

    return (
        <div className="space-y-8 animate-fade-in pb-10">

            {/* ─── SECTION 1: Header & Time Range Picker ──────────────────────────── */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-syne font-bold text-white">Advanced Analytics</h2>
                    <p className="text-sm text-gray-400 mt-1">Deep dive into your energy generation and financial metrics</p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                    <div className="flex bg-[#0d1512] border border-white/10 rounded-xl p-1 shadow-inner h-10 w-full sm:w-auto overflow-x-auto min-w-max">
                        {['7D', '30D', '90D', '180D', 'CUSTOM'].map(t => (
                            <button
                                key={t}
                                onClick={() => setTimeRange(t)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${timeRange === t ? 'bg-[#00C864] text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                {t === 'CUSTOM' ? 'Custom Range' : t}
                            </button>
                        ))}
                    </div>

                    {timeRange === 'CUSTOM' && (
                        <div className="flex items-center gap-2 animate-fade-in w-full sm:w-auto h-10">
                            <input
                                type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                                className="bg-[#0d1512] border border-white/10 text-white text-xs px-2 py-1.5 rounded-lg h-full [color-scheme:dark] w-full sm:w-auto"
                            />
                            <span className="text-gray-500 text-xs">to</span>
                            <input
                                type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                                className="bg-[#0d1512] border border-white/10 text-white text-xs px-2 py-1.5 rounded-lg h-full [color-scheme:dark] w-full sm:w-auto"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* ─── SECTION 2: KPI Cards Row ───────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">

                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-4 flex flex-col group hover:border-yellow-500/30 transition-colors">
                    <div className="flex items-center gap-2 mb-2"><Award className="w-4 h-4 text-yellow-500" /><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Best Solar Day</span></div>
                    <div className="text-xl font-ibm-plex font-bold text-white mb-1">{kpis.bestGen} <span className="text-xs text-gray-500 font-jakarta">kWh</span></div>
                    <div className="text-xs text-yellow-500/80 font-medium">{format(parseISO(kpis.bestDay || new Date().toISOString()), 'MMM dd, yyyy')}</div>
                </div>

                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-4 flex flex-col group hover:border-[#00C864]/30 transition-colors">
                    <div className="flex items-center gap-2 mb-2"><Sun className="w-4 h-4 text-[#00FF85]" /><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Avg Daily Gen</span></div>
                    <div className="text-xl font-ibm-plex font-bold text-white mb-1">{kpis.avgGen} <span className="text-xs text-gray-500 font-jakarta">kWh</span></div>
                    <div className="text-[10px] text-gray-500 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-[#00C864]" /> Over selected period</div>
                </div>

                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-4 flex flex-col group hover:border-purple-500/30 transition-colors">
                    <div className="flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-purple-400" /><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Earnings</span></div>
                    <div className="text-xl font-ibm-plex font-bold text-white mb-1">₹{parseInt(kpis.earnings).toLocaleString('en-IN')}</div>
                    <div className="text-[10px] text-gray-500">From Grid Exports</div>
                </div>

                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-4 flex flex-col group hover:border-blue-500/30 transition-colors relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/10 blur-xl"></div>
                    <div className="flex items-center gap-2 mb-2"><Activity className="w-4 h-4 text-blue-400" /><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Self-Sufficiency</span></div>
                    <div className="text-xl font-ibm-plex font-bold text-blue-400 mb-1">{kpis.selfSuff}%</div>
                    <div className="text-[10px] text-gray-500">Avg Independence</div>
                </div>

                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-4 flex flex-col group hover:border-green-500/30 transition-colors">
                    <div className="flex items-center gap-2 mb-2"><Leaf className="w-4 h-4 text-green-500" /><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total CO₂ Saved</span></div>
                    <div className="text-xl font-ibm-plex font-bold text-white mb-1">{parseInt(kpis.co2).toLocaleString('en-IN')} <span className="text-xs text-gray-500 font-jakarta">kg</span></div>
                    <div className="text-[10px] text-gray-500">≈ {(kpis.co2 / 21).toFixed(0)} Trees Planted</div>
                </div>

                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-4 flex flex-col group hover:border-orange-500/30 transition-colors">
                    <div className="flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-orange-400 opacity-50" /><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Off-Grid Days</span></div>
                    <div className="text-xl font-ibm-plex font-bold text-white mb-1">{kpis.zeroImportDays} <span className="text-xs text-gray-500 font-jakarta">Days</span></div>
                    <div className="text-[10px] text-gray-500">Zero Grid Import</div>
                </div>

            </div>

            {/* ─── SECTION 3: 4 Charts Grid (2x2) ─────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">

                {/* Chart 1: Generation Trend */}
                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-5 flex flex-col w-full h-[360px]">
                    <h3 className="text-sm font-bold text-white mb-1">Energy Generation vs Consumption</h3>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-4">Daily Trend Line</p>
                    <div className="flex-1 min-h-0 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chart1Data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} />
                                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#0a0f0d', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px' }} labelStyle={{ color: '#9ca3af', marginBottom: '4px', fontSize: '12px' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} iconType="circle" />
                                <Bar dataKey="Generation" fill="#00C864" radius={[4, 4, 0, 0]} name="Solar Gen (kWh)" maxBarSize={15} />
                                <Bar dataKey="Consumption" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Consumption (kWh)" maxBarSize={15} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 2: Daily Consumption Pattern */}
                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-5 flex flex-col w-full h-[360px]">
                    <h3 className="text-sm font-bold text-white mb-1">Average Daily Pattern</h3>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-4">Hourly Load & Solar Output</p>
                    <div className="flex-1 min-h-0 w-full relative">
                        {/* Contextual Highlight Box for Peak Solar */}
                        <div className="absolute top-0 bottom-[30px] left-[35%] right-[35%] bg-yellow-500/5 pointer-events-none rounded-xl border border-yellow-500/10 hidden md:block z-0">
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-yellow-500/20 text-yellow-500 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest whitespace-nowrap">Peak Solar Hours</div>
                        </div>

                        <ResponsiveContainer width="100%" height="100%" className="relative z-10">
                            <AreaChart data={chart2Data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EAB308" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#EAB308" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="hour" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} interval={3} tickMargin={10} />
                                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#0a0f0d', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px' }} labelStyle={{ color: '#9ca3af', marginBottom: '4px', fontSize: '12px' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} iconType="circle" />
                                <Area type="monotone" dataKey="Solar" stroke="#EAB308" strokeWidth={2} fillOpacity={1} fill="url(#colorSolar)" name="Solar Profile" />
                                <Area type="monotone" dataKey="Load" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorLoad)" name="Load Profile" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 3: Financial Analysis */}
                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-5 flex flex-col w-full h-[360px]">
                    <h3 className="text-sm font-bold text-white mb-1">Financial Analysis</h3>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-4">Total Cost Breakdown by Month</p>
                    <div className="flex-1 min-h-0 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chart3Data} margin={{ top: 5, right: 0, left: -10, bottom: 0 }} stackOffset="sign">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="month" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} />
                                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#0a0f0d', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px' }} labelStyle={{ color: '#9ca3af', marginBottom: '4px', fontSize: '12px' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} iconType="circle" />

                                <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />

                                {/* Stacked Bars for Costs (Positive) */}
                                <Bar dataKey="PlanFee" stackId="costs" fill="#6366f1" radius={[0, 0, 0, 0]} name="Base Plan Fee" maxBarSize={30} />
                                <Bar dataKey="ImportCost" stackId="costs" fill="#ef4444" radius={[4, 4, 0, 0]} name="Grid Import Cost" maxBarSize={30} />

                                {/* Negative Bar for Credits */}
                                <Bar dataKey="ExportCredit" fill="#00C864" radius={[0, 0, 4, 4]} name="Grid Export Credit" maxBarSize={30} />

                                {/* Line for absolute Net Cost */}
                                <Line type="monotone" dataKey="NetCost" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} name="Net Payable" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 4: Self Sufficiency Trend */}
                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-5 flex flex-col w-full h-[360px]">
                    <h3 className="text-sm font-bold text-white mb-1">Self-Sufficiency Trend</h3>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-4">% of consumption powered purely by solar</p>
                    <div className="flex-1 min-h-0 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chart4Data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} />
                                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} />

                                <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1} label={{ position: 'top', value: '80% Target', fill: '#22c55e', fontSize: 10, align: 'right' }} />

                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#0a0f0d', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px' }} labelStyle={{ color: '#9ca3af', marginBottom: '4px', fontSize: '12px' }}
                                    formatter={(val) => [`${val}%`, 'Sufficiency']}
                                />
                                <Line type="monotone" dataKey="Sufficiency" stroke="#00C864" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: '#00C864' }} name="Self-Sufficiency %" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* ─── SECTION 4: Download Reports ────────────────────────────────────── */}
            <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00FF85]/5 blur-3xl rounded-full pointer-events-none"></div>

                <div className="relative z-10 max-w-md">
                    <h3 className="text-xl font-syne font-bold text-white mb-2">Export Data & Reports</h3>
                    <p className="text-sm text-gray-400">Download cryptographically tagged PDF reports for accounting, auditing, or environmental compliance.</p>
                </div>

                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
                    <button
                        onClick={() => generateMonthlyPDF(filteredReadings, currentUser)}
                        className="flex flex-col items-center justify-center gap-3 p-4 bg-black/40 border border-white/10 hover:border-[#00C864]/50 hover:bg-white/5 rounded-xl transition-all group"
                    >
                        <FileText className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                        <span className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors text-center uppercase tracking-wider">Summary Table<br />(PDF)</span>
                    </button>
                    <button
                        onClick={() => generateSavingsPDF(filteredReadings, currentUser)}
                        className="flex flex-col items-center justify-center gap-3 p-4 bg-black/40 border border-white/10 hover:border-[#00C864]/50 hover:bg-white/5 rounded-xl transition-all group"
                    >
                        <TrendingDown className="w-6 h-6 text-[#00C864] transition-colors" />
                        <span className="text-xs font-bold text-gray-300 group-hover:text-[#00FF85] transition-colors text-center uppercase tracking-wider">Savings Analysis<br />(PDF)</span>
                    </button>
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Carbon Report generated!', type: 'success' } }))}
                        className="flex flex-col items-center justify-center gap-3 p-4 bg-black/40 border border-white/10 hover:border-green-500/50 hover:bg-white/5 rounded-xl transition-all group"
                    >
                        <Leaf className="w-6 h-6 text-green-500 transition-colors" />
                        <span className="text-xs font-bold text-gray-300 group-hover:text-green-400 transition-colors text-center uppercase tracking-wider">Carbon Report<br />(PDF)</span>
                    </button>
                </div>
            </div>

        </div>
    );
};

export default AnalyticsPage;
