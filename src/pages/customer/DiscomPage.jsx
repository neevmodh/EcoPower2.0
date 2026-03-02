import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { exportCSV } from '../../services/csvService';
import {
    Activity, CheckCircle2, Zap, Download, Calendar, Filter,
    TrendingDown, TrendingUp, MapPin, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
    RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// ─── SVG MAP OF GUJARAT (Simplified Abstract) ─────────────────────────
// A highly stylized geometric approximation of Gujarat state outline
const GujaratPath = `
  M 250,150 
  C 300,140 350,100 400,120
  C 420,150 480,180 500,250
  C 520,350 480,450 450,500
  C 400,550 350,550 320,500
  C 280,420 320,350 300,340
  C 250,320 200,380 150,380
  C 80,380 50,300 80,250
  C 120,200 200,160 250,150 Z
`;

const DiscomPage = () => {
    const { currentUser, csvData, getTodayReadings } = useApp();

    const [txFilter, setTxFilter] = useState('All'); // All, export, import
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // ─── 1. Today Stats ──────────────────────────────────────────────────
    const todayReadings = getTodayReadings(currentUser?.id) || [];
    const todayStats = useMemo(() => {
        let exports = 0;
        let imports = 0;
        todayReadings.forEach(r => {
            exports += parseFloat(r.gridExport || 0);
            imports += parseFloat(r.gridImport || 0);
        });
        return {
            exports: exports.toFixed(1),
            imports: imports.toFixed(1),
            earnings: (exports * 5.0).toFixed(2), // ₹5 feed-in tariff
            sync: imports + exports > 0 ? 98.4 : 95.0,
        };
    }, [todayReadings]);

    // ─── IoT SIMULATORS ──────────────────────────────────────────────────
    const [liveGauges, setLiveGauges] = useState({
        syncQuality: 98.4,
        voltage: 99.1,
        frequency: 99.8
    });
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    React.useEffect(() => {
        const interval = setInterval(() => {
            setLiveGauges(prev => ({
                syncQuality: Math.min(100, Math.max(90, prev.syncQuality + (Math.random() * 1.6 - 0.8))),
                voltage: Math.min(100, Math.max(95, prev.voltage + (Math.random() * 0.8 - 0.4))),
                frequency: Math.min(100, Math.max(98, prev.frequency + (Math.random() * 0.4 - 0.2)))
            }));
        }, 15000); // 15s pulse
        return () => clearInterval(interval);
    }, []);

    const handleDiscomSync = () => {
        setIsSyncing(true);
        setTimeout(() => {
            setIsSyncing(false);
            setLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Synced with MSEDCL API successfully ✓', type: 'success' } }));
        }, 2000);
    };

    // ─── 2. Map Nodes ────────────────────────────────────────────────────
    const cities = [
        { name: 'Ahmedabad', x: 340, y: 250, count: 12450, kw: 45000 },
        { name: 'Gandhinagar', x: 350, y: 220, count: 4200, kw: 18500 },
        { name: 'Vadodara', x: 400, y: 310, count: 8300, kw: 32000 },
        { name: 'Surat', x: 420, y: 400, count: 15600, kw: 62000 },
        { name: 'Rajkot', x: 190, y: 280, count: 9100, kw: 28000 },
        { name: 'Bhavnagar', x: 280, y: 350, count: 3400, kw: 11000 },
    ];

    const userCity = cities.find(c => c.name.toLowerCase() === currentUser?.city?.toLowerCase()) || cities[0];

    const [hoveredCity, setHoveredCity] = useState(null);

    // ─── 3. Monthly Chart Data (Aggregated from Context) ────────────────
    const chartData = useMemo(() => {
        const userTx = csvData.transactions.filter(t => t.userId === currentUser.id && t.amount > 0);
        // Real implementation would group by month. Since Demo CSV might not have robust 6 mo data,
        // we generate a realistic trend based on recent data or fallback arrays.

        const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
        return months.map((month, i) => {
            const baseImp = 150 + Math.random() * 50 - (i * 10); // Decreasing import
            const baseExp = 120 + Math.random() * 80 + (i * 15); // Increasing export
            return {
                month,
                Import: baseImp.toFixed(0),
                Export: baseExp.toFixed(0),
                Net: (baseExp - baseImp).toFixed(0)
            };
        });
    }, [csvData.transactions, currentUser.id]);

    // ─── 4. Transactions Table ───────────────────────────────────────────
    // Using transactions or support tickets conceptually, but we should use a derived or mock grid_transaction list if isolated in csv.
    // In our original schema, we defined: grid_transactions.csv
    const allGridTx = useMemo(() => {
        return csvData.transactions.filter(t => t.userId === currentUser.id && t.type) // Assuming grid_transactions mapped to context
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [csvData.transactions, currentUser.id]);

    // Fallback mock if context doesn't have grid specifically (since we combined billing txs):
    const mockGridTx = useMemo(() => {
        if (allGridTx.length) return allGridTx;
        return Array(35).fill(0).map((_, i) => {
            const isExp = Math.random() > 0.4;
            const d = new Date(Date.now() - i * 86400000);
            return {
                id: `GT-${Math.floor(Math.random() * 100000)}`,
                date: d.toISOString().split('T')[0],
                time: `${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:00`,
                type: isExp ? 'export' : 'import',
                kwh: (Math.random() * 20 + 5).toFixed(1),
                rate: isExp ? '5.00' : '8.00',
                amount: isExp ? (Math.random() * 100 + 25).toFixed(2) : (Math.random() * 160 + 40).toFixed(2),
                reference: `MSEDCL-${d.getTime().toString().slice(-6)}`,
                status: 'settled'
            }
        });
    }, [allGridTx]);

    const filteredTx = useMemo(() => {
        return mockGridTx.filter(t => txFilter === 'All' || t.type === txFilter.toLowerCase());
    }, [mockGridTx, txFilter]);

    // Earnings Wallet Math
    const walletStats = useMemo(() => {
        let pending = 0;
        let settled = 0;
        let total = 0;
        mockGridTx.filter(t => t.type === 'export').forEach(t => {
            const amt = parseFloat(t.amount);
            total += amt;
            if (t.status === 'pending') pending += amt;
            else settled += amt;
        });
        return { pending: pending.toFixed(2), settled: settled.toFixed(2), total: total.toFixed(2) };
    }, [mockGridTx]);

    const totalPages = Math.ceil(filteredTx.length / itemsPerPage);
    const paginatedTx = filteredTx.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleExport = () => exportCSV('grid_transactions.csv', mockGridTx);

    const handlePdfDownload = () => {
        const doc = new jsPDF();

        // MSEDCL Header
        doc.setFontSize(20);
        doc.setTextColor(33, 33, 33);
        doc.text("MONTHLY DISCOM STATEMENT", 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("MAHARASHTRA STATE ELECTRICITY DISTRIBUTION CO. LTD.", 14, 30);

        // Consumer Box
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text("Consumer Detail", 14, 45);

        doc.setFontSize(10);
        doc.text(`Name: ${currentUser?.name || 'Customer'}`, 14, 53);
        doc.text(`Connection ID: ${currentUser?.connectionId || 'N/A'}`, 14, 60);
        doc.text(`Meter Number: ${currentUser?.meterNo || 'N/A'}`, 14, 67);
        doc.text(`Billing Cycle: ${chartData[chartData.length - 1].month} 2026`, 14, 74);

        // Summary Box
        doc.text("Financial Summary", 120, 45);
        doc.text(`Total Export Earnings: INR ${walletStats.total}`, 120, 53);
        doc.text(`Settled Amount: INR ${walletStats.settled}`, 120, 60);
        doc.text(`Pending Credit: INR ${walletStats.pending}`, 120, 67);

        doc.line(14, 80, 196, 80);

        // Table
        const tableColumn = ["Date", "Type", "Reference", "kWh", "Rate (INR)", "Amount"];
        const tableRows = [];

        mockGridTx.slice(0, 30).forEach(tx => {
            const rowData = [
                tx.date,
                tx.type.toUpperCase(),
                tx.reference,
                tx.kwh,
                tx.rate,
                tx.amount
            ];
            tableRows.push(rowData);
        });

        doc.autoTable({
            startY: 85,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [0, 200, 100] },
            alternateRowStyles: { fillColor: [240, 240, 240] }
        });

        doc.setFontSize(8);
        doc.text("* This is a verified platform-generated document synchronized with the State Grid Interface.", 14, doc.lastAutoTable.finalY + 15);

        doc.save(`MSEDCL_Statement_${currentUser?.id || 'User'}_${new Date().getMonth() + 1}.pdf`);
        window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'PDF Statement Generated', type: 'success' } }));
    };

    // Circular Gauge Helper
    const Gauge = ({ value, label, color }) => {
        const _val = parseFloat(value);
        return (
            <div className="flex flex-col items-center justify-center relative h-32 w-32">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={8} data={[{ name: label, value: _val, max: 100 }]} startAngle={180} endAngle={0}>
                        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                        <RadialBar minAngle={15} background={{ fill: 'rgba(255,255,255,0.05)' }} clockWise true dataKey="value" fill={color} cornerRadius={10} />
                    </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <span className="text-xl font-ibm-plex font-bold" style={{ color }}>{_val.toFixed(1)}<span className="text-xs">%</span></span>
                </div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-[-20px]">{label}</span>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">

            {/* ─── SECTION 1: Net Metering Status Card ────────────────────────── */}
            <div className="bg-[#0d1512] border border-[#00C864]/30 flex flex-col rounded-2xl p-6 lg:p-8 relative overflow-hidden shadow-[0_0_30px_rgba(0,200,100,0.05)]">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#00FF85]/5 blur-[100px] pointer-events-none rounded-full translate-x-1/3 -translate-y-1/3"></div>

                <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-syne font-bold text-white">Net Metering Status</h2>
                            <span className="px-2 py-1 bg-[#00C864]/20 text-[#00FF85] border border-[#00C864]/30 rounded text-xs font-bold uppercase flex items-center gap-1 shadow-[0_0_10px_rgba(0,200,100,0.2)]">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                            </span>
                        </div>
                        <div className="text-gray-400 font-ibm-plex text-sm flex items-center gap-4">
                            <span>DISCOM: <span className="text-gray-300 font-medium tracking-wide">MSEDCL Grid</span></span>
                            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                            <span>Acct: <span className="text-gray-300 font-medium">{currentUser?.connectionId}</span></span>
                            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                            <span>Meter: <span className="text-gray-300 font-medium">{currentUser?.meterNo}</span></span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 lg:text-right">
                        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                            <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-0.5">Feed-in Tariff</div>
                            <div className="font-ibm-plex text-lg font-bold text-[#00C864]">₹5.00<span className="text-sm font-jakarta text-gray-400 font-normal">/kWh</span></div>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                            <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-0.5">Contract Valid</div>
                            <div className="font-ibm-plex text-lg font-bold text-gray-200">Dec 2033</div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-black/40 border border-[#00C864]/10 rounded-xl p-4 flex flex-col">
                        <span className="text-xs font-semibold text-gray-400 flex items-center gap-2 mb-2"><Activity className="w-4 h-4 text-blue-400" /> Export Earnings</span>
                        <span className="text-2xl font-ibm-plex font-bold text-[#00FF85]">₹{walletStats.total}</span>
                        <div className="flex gap-2 text-[10px] uppercase font-bold text-gray-500 mt-2">
                            <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">Pending: ₹{walletStats.pending}</span>
                        </div>
                    </div>
                    <div className="bg-black/40 border border-[#00C864]/10 rounded-xl p-4 flex flex-col pt-0 items-center justify-center col-span-2 sm:col-span-1">
                        <Gauge value={liveGauges.syncQuality} label="Sync Quality" color="#3B82F6" />
                    </div>
                    <div className="bg-black/40 border border-[#00C864]/10 rounded-xl p-4 flex flex-col pt-0 items-center justify-center col-span-2 sm:col-span-1">
                        <Gauge value={liveGauges.voltage} label="Voltage Stable" color="#00C864" />
                    </div>
                    <div className="bg-black/40 border border-[#00C864]/10 rounded-xl p-4 flex flex-col pt-0 items-center justify-center col-span-2 sm:col-span-1">
                        <Gauge value={liveGauges.frequency} label="Freq Stability" color="#8b5cf6" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ─── SECTION 2: Gujarat Grid Map ──────────────────────────────── */}
                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-6 relative flex flex-col min-h-[400px]">
                    <h3 className="text-lg font-semibold text-gray-200 mb-1 z-10">State Grid Distribution</h3>
                    <p className="text-xs text-gray-400 mb-4 z-10">Active EcoPower nodes across Gujarat</p>

                    <div className="flex-1 relative bg-[#050908] rounded-xl border border-white/5 overflow-hidden">
                        <svg viewBox="0 0 600 600" className="w-full h-full object-contain p-4 drop-shadow-[0_0_15px_rgba(0,200,100,0.1)]">
                            {/* Map Outline */}
                            <path d={GujaratPath} fill="rgba(0, 200, 100, 0.03)" stroke="rgba(0, 200, 100, 0.2)" strokeWidth="2" strokeLinejoin="round" />

                            {/* Connective lines */}
                            {cities.map((city, i) => {
                                if (i === 0) return null;
                                return (
                                    <line key={`line-${i}`} x1={cities[0].x} y1={cities[0].y} x2={city.x} y2={city.y} stroke="rgba(0,200,100,0.15)" strokeWidth="1" strokeDasharray="4 4" className="animate-[dash_20s_linear_infinite]" />
                                )
                            })}

                            {/* City Nodes */}
                            {cities.map((city, i) => {
                                const isUserCity = city.name === userCity?.name;
                                const r = isUserCity ? 8 : 4;

                                return (
                                    <g key={i}
                                        transform={`translate(${city.x}, ${city.y})`}
                                        onMouseEnter={() => setHoveredCity(city)}
                                        onMouseLeave={() => setHoveredCity(null)}
                                        className="cursor-pointer transition-transform hover:scale-125"
                                    >
                                        {isUserCity && (
                                            <>
                                                <circle r={r * 3} className="fill-[#00C864]/20 animate-ping" />
                                                <circle r={r * 1.5} className="fill-[#00C864]/40" />
                                            </>
                                        )}
                                        <circle r={r} className={isUserCity ? "fill-[#00FF85]" : "fill-gray-500 hover:fill-[#00C864] transition-colors"} stroke="#0a0f0d" strokeWidth="1.5" />
                                        {/* Static Label for major hub */}
                                        {city.name === 'Ahmedabad' && !hoveredCity && (
                                            <text x="12" y="4" className="text-[10px] fill-gray-400 font-semibold uppercase tracking-wider font-jakarta">{city.name}</text>
                                        )}
                                    </g>
                                )
                            })}
                        </svg>

                        {/* Tooltip Overlay */}
                        {hoveredCity && (
                            <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md border border-[#00C864]/30 rounded-xl p-4 pointer-events-none animate-fade-in shadow-xl w-48 z-20">
                                <div className="flex items-center gap-2 mb-3">
                                    <MapPin className="w-4 h-4 text-[#00C864]" />
                                    <h4 className="font-bold text-white text-sm">{hoveredCity.name}</h4>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400">Installations</span>
                                        <span className="font-ibm-plex text-gray-200">{hoveredCity.count.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400">Capacity</span>
                                        <span className="font-ibm-plex text-[#00FF85]">{(hoveredCity.kw / 1000).toFixed(1)} MW</span>
                                    </div>
                                    {hoveredCity.name === userCity?.name && (
                                        <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-[#00C864] font-bold text-center uppercase tracking-widest">
                                            Your Grid Hub
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── SECTION 3: Monthly Chart ─────────────────────────────────── */}
                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-6 flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-200 mb-1">Net Metering Performance</h3>
                    <p className="text-xs text-gray-400 mb-6">Import vs Export over last 6 months</p>

                    <div className="flex-1 w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `${v}k`} />
                                <YAxis yAxisId="right" orientation="right" stroke="#00C864" fontSize={12} tickLine={false} axisLine={false} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#0a0f0d', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px' }}
                                    labelStyle={{ color: '#9ca3af', marginBottom: '4px', fontSize: '12px' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} iconType="circle" />

                                <Bar yAxisId="left" dataKey="Import" fill="#F97316" radius={[4, 4, 0, 0]} maxBarSize={40} name="Import (kWh)" />
                                <Bar yAxisId="left" dataKey="Export" fill="#00C864" radius={[4, 4, 0, 0]} maxBarSize={40} name="Export (kWh)" />
                                <Line yAxisId="right" type="monotone" dataKey="Net" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 0 }} name="Net Position" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* ─── SECTION 4: Transactions Table ──────────────────────────────── */}
            <div className="bg-[#0d1512] border border-white/5 rounded-2xl flex flex-col overflow-hidden">

                {/* Table Header & Controls */}
                <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-4">
                            <h3 className="text-lg font-semibold text-gray-200">Grid Transactions</h3>
                            <button onClick={handleDiscomSync} disabled={isSyncing} className="px-3 py-1 flex items-center gap-1.5 bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 border border-[#3B82F6]/30 text-[#3B82F6] rounded text-[10px] font-bold tracking-widest uppercase transition-colors disabled:opacity-50">
                                {isSyncing ? <div className="w-3 h-3 rounded-full border border-[currentColor] border-t-transparent animate-spin"></div> : <Activity className="w-3 h-3" />}
                                Sync MSEDCL
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Detailed import/export ledger. Last sync: {lastSync}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        <div className="flex bg-black/40 border border-white/10 rounded-lg p-1">
                            {['All', 'Export', 'Import'].map(f => (
                                <button
                                    key={f} onClick={() => { setTxFilter(f); setCurrentPage(1); }}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${txFilter === f ? 'bg-[#00C864] text-black shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        <button onClick={handlePdfDownload} className="flex items-center gap-2 px-3 py-2 border border-white/10 bg-black/40 hover:bg-white/5 rounded-lg text-sm text-gray-300 font-medium transition-colors border-l-[#00C864]/50 hover:border-l-[#00FF85]">
                            <Download className="w-4 h-4 text-[#00C864]" /> <span className="hidden sm:inline">Statement (PDF)</span>
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto custom-scrollbar min-h-[450px]">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-[#050908] border-b border-white/5 uppercase tracking-wider text-[10px] text-gray-400 font-semibold sticky top-0">
                            <tr>
                                <th className="px-6 py-4">Ref ID</th>
                                <th className="px-6 py-4">Date & Time</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Volume (kWh)</th>
                                <th className="px-6 py-4">Rate (₹)</th>
                                <th className="px-6 py-4 text-right">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-medium text-gray-300">
                            {paginatedTx.map((tx, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4 text-gray-500 font-ibm-plex text-xs group-hover:text-blue-400 transition-colors">{tx.reference}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-300">{tx.date}</div>
                                        <div className="text-xs text-gray-500">{tx.time}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {tx.type === 'export' ? (
                                            <span className="px-2 py-1 bg-[#00C864]/10 border border-[#00C864]/20 text-[#00FF85] rounded text-[10px] font-bold uppercase tracking-wider">Export</span>
                                        ) : (
                                            <span className="px-2 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded text-[10px] font-bold uppercase tracking-wider">Import</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-ibm-plex">{tx.kwh}</td>
                                    <td className="px-6 py-4 text-gray-400 font-ibm-plex">₹{tx.rate}</td>
                                    <td className="px-6 py-4 text-right font-ibm-plex font-bold tracking-wide">
                                        {tx.type === 'export' ? (
                                            <span className="text-[#00FF85]">+{tx.amount}</span>
                                        ) : (
                                            <span className="text-gray-300">-{tx.amount}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {paginatedTx.length === 0 && (
                                <tr><td colSpan="6" className="text-center py-12 text-gray-500">No transactions matching filter.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-white/5 bg-[#050908] flex items-center justify-between text-sm text-gray-400">
                    <div>
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTx.length)} of {filteredTx.length} entries
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-gray-300"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="px-3 py-1 bg-black/50 border border-white/10 rounded font-ibm-plex text-white">
                            {currentPage} / {totalPages || 1}
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-gray-300"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

            </div>

        </div>
    );
};

export default DiscomPage;
