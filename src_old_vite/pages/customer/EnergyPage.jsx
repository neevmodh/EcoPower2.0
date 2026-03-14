import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { startSimulation, stopSimulation, getLiveData } from '../../services/iotSimulator';
import Papa from 'papaparse';
import {
    Activity, Zap, Battery, AlertTriangle, UploadCloud,
    CheckCircle, XCircle, Download, FileText, ArrowRight, Sun, Leaf
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';

const CountUpLive = ({ value, decimals = 1, prefix = '', suffix = '' }) => {
    return <span>{prefix}{(value || 0).toFixed(decimals)}{suffix}</span>;
};

const EnergyPage = () => {
    const { currentUser, csvData, getTodayReadings, setLiveReading, liveReading, setCsvData } = useApp();

    // Custom polling for waveform chart
    const [waveformData, setWaveformData] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Drag & drop state
    const [isDragging, setIsDragging] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadPreview, setUploadPreview] = useState([]);
    const [uploadErrors, setUploadErrors] = useState([]);
    const fileInputRef = useRef(null);

    // Time & IoT simulation
    useEffect(() => {
        // Clock tick
        const clock = setInterval(() => setCurrentTime(new Date()), 1000);

        // Initial state setup for waveform
        const initData = Array(20).fill(0).map((_, i) => ({
            time: new Date(Date.now() - (20 - i) * 10000).toLocaleTimeString('en-US', { hour12: false }),
            solar: 0,
            load: 0,
        }));
        setWaveformData(initData);

        // Start IoT Simulator pulling local generated reading
        const stopFn = startSimulation(currentUser.id, currentUser.solarKw || 10, (reading) => {
            setLiveReading(reading);

            const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false });
            setWaveformData(prev => {
                const newData = [...prev.slice(1), { time: nowTime, solar: reading.solarGen, load: reading.consumption }];
                return newData;
            });
        });

        return () => {
            clearInterval(clock);
            stopSimulation();
            if (stopFn) stopFn();
        };
    }, [currentUser.id, currentUser.solarKw, setLiveReading]);

    // Today's stats calculation
    const todayReadings = getTodayReadings(currentUser.id) || [];

    const todayStats = useMemo(() => {
        if (!todayReadings.length) return { solar: 0, load: 0, netGrid: 0, peakSolarHr: '-', peakLoadHr: '-', selfSufficiency: 0 };

        let solar = 0, load = 0, gridIn = 0, gridOut = 0;
        let maxSolar = -1, peakSolarHr = '-';
        let maxLoad = -1, peakLoadHr = '-';

        todayReadings.forEach(r => {
            const s = parseFloat(r.solarGen || 0);
            const l = parseFloat(r.consumption || 0);
            solar += s;
            load += l;
            gridIn += parseFloat(r.gridImport || 0);
            gridOut += parseFloat(r.gridExport || 0);

            if (s > maxSolar) { maxSolar = s; peakSolarHr = `${r.hour}:00`; }
            if (l > maxLoad) { maxLoad = l; peakLoadHr = `${r.hour}:00`; }
        });

        const netGrid = gridOut - gridIn;
        const selfSufficiency = load > 0 ? Math.min(100, (solar / load) * 100).toFixed(0) : 0;

        return { solar, load, netGrid, peakSolarHr, peakLoadHr, selfSufficiency };
    }, [todayReadings]);

    // CSV Upload Logic
    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processCSV(e.dataTransfer.files[0]);
        }
    };
    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) processCSV(e.target.files[0]);
    };

    const expectedHeaders = ['date', 'hour', 'solarGen', 'consumption', 'gridImport', 'gridExport', 'batteryLevel', 'voltage', 'frequency'];

    const processCSV = (file) => {
        setUploadFile(file);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const headers = results.meta.fields || [];
                const missing = expectedHeaders.filter(h => !headers.includes(h));

                if (missing.length > 0) {
                    setUploadErrors(['Missing columns: ' + missing.join(', ')]);
                    setUploadPreview([]);
                } else {
                    setUploadErrors([]);
                    setUploadPreview(results.data.slice(0, 5));
                    // Full data stored in file state temporarily
                }
            }
        });
    };

    const confirmUpload = () => {
        if (!uploadFile) return;

        Papa.parse(uploadFile, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                if (!uploadErrors.length) {
                    try {
                        const newRows = results.data.map(row => ({ ...row, userId: currentUser.id, id: `ER_UP_${Date.now()}_${Math.random()}` }));
                        setCsvData(prev => ({ ...prev, energyReadings: [...prev.energyReadings, ...newRows] }));
                        window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: `Imported ${results.data.length} rows successfully.`, type: 'success' } }));
                        setUploadFile(null);
                        setUploadPreview([]);
                    } catch (err) {
                        window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Import failed.', type: 'error' } }));
                    }
                }
            }
        });
    };

    const cancelUpload = () => {
        setUploadFile(null);
        setUploadPreview([]);
        setUploadErrors([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const downloadTemplate = () => {
        const csvContent = expectedHeaders.join(',') + '\n2026-03-01,12,8.5,3.2,0,5.3,85,230,50';
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'energy_readings_template.csv';
        link.click();
    };

    // Status computation for cards
    let solarStatus = "Night Mode";
    if (liveReading.solarGen > 0.5 * currentUser.solarKw) solarStatus = "Peak Generation";
    else if (liveReading.solarGen > 0) solarStatus = "Low Light";

    let loadStatus = "Normal";
    if (liveReading.consumption > 6) loadStatus = "Critical";
    else if (liveReading.consumption > 3) loadStatus = "High";

    let vColor = "text-[#00FF85]";
    if (liveReading.voltage < 210 || liveReading.voltage > 250) vColor = "text-red-500";

    const progressRingData = [{ name: 'Battery', value: liveReading.batteryLevel, fill: '#A855F7' }];

    return (
        <div className="space-y-6 animate-fade-in pb-10">

            {/* ─── SECTION 1: Live Status Bar ────────────────────────────────────── */}
            <div className="w-full bg-[#00C864]/10 border border-[#00C864]/30 rounded-lg p-3 flex flex-wrap items-center justify-between text-sm shadow-[0_0_15px_rgba(0,200,100,0.1)] backdrop-blur-md">
                <div className="flex items-center gap-4 text-gray-200">
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#00FF85]/10 text-[#00FF85] text-xs font-bold uppercase border border-[#00FF85]/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00FF85] animate-ping"></span> Live
                    </span>
                    <span className="font-ibm-plex text-xs text-gray-400">Last update: {currentTime.toLocaleTimeString('en-US', { hour12: false })}</span>
                    <span className="font-ibm-plex text-xs text-gray-400 hidden sm:inline">Meter: {currentUser.meterNo}</span>
                    <span className="font-ibm-plex text-xs text-gray-400 hidden md:inline">Today: {new Date().toISOString().split('T')[0]}</span>
                </div>
                <div className="flex items-center gap-4 text-white font-ibm-plex font-medium">
                    <span className="text-[#00FF85]">Solar: {liveReading.solarGen.toFixed(2)} kW ↑</span>
                    <span className="text-blue-400">Load: {liveReading.consumption.toFixed(2)} kW</span>
                    <span className={`${vColor}`}>Volt: {liveReading.voltage.toFixed(1)} V</span>
                    <span className="text-gray-300 hidden sm:inline">Freq: {liveReading.frequency.toFixed(2)} Hz</span>
                </div>
            </div>

            {/* ─── SECTION 2: 4 Live Metric Cards ────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Card 1: Solar */}
                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-5 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-gray-400 text-sm font-semibold tracking-wide flex items-center gap-2">
                            <Sun className="w-4 h-4 text-[#00FF85]" /> Current Solar Power
                        </h3>
                    </div>
                    <div className="mt-2">
                        <h2 className="text-4xl font-ibm-plex font-bold text-white tracking-tight">
                            <CountUpLive value={liveReading.solarGen} decimals={2} suffix=" kW" />
                        </h2>
                        <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs font-semibold px-2 py-1 rounded bg-[#00C864]/20 text-[#00FF85]">
                                {solarStatus}
                            </span>
                            <div className="w-16 h-4 opacity-50 flex items-end gap-0.5">
                                {/* Mini pseudo-sparkline using recent waveform data */}
                                {waveformData.slice(-12).map((d, i) => (
                                    <div key={i} className="flex-1 bg-[#00FF85] rounded-t-sm" style={{ height: `${Math.max(10, (d.solar / 10) * 100)}%` }}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 2: Load */}
                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-gray-400 text-sm font-semibold tracking-wide flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-400" /> Current Load
                        </h3>
                    </div>
                    <div className="mt-2">
                        <h2 className="text-4xl font-ibm-plex font-bold text-white tracking-tight">
                            <CountUpLive value={liveReading.consumption} decimals={2} suffix=" kW" />
                        </h2>
                        <div className="mt-3 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <span className={`text-xs font-semibold px-2 py-1 rounded ${loadStatus === 'Normal' ? 'bg-blue-500/20 text-blue-400' :
                                        loadStatus === 'High' ? 'bg-orange-500/20 text-orange-400' :
                                            'bg-red-500/20 text-red-500'
                                    }`}>
                                    {loadStatus} Demand
                                </span>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className={`h-full ${loadStatus === 'Normal' ? 'bg-blue-500' : loadStatus === 'High' ? 'bg-orange-500' : 'bg-red-500'} transition-all duration-300`}
                                    style={{ width: `${Math.min(100, (liveReading.consumption / 8) * 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 3: Voltage Grid */}
                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-gray-400 text-sm font-semibold tracking-wide flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-400" /> Grid Voltage
                        </h3>
                    </div>
                    <div className="mt-2">
                        <h2 className={`text-4xl font-ibm-plex font-bold tracking-tight ${liveReading.voltage < 210 || liveReading.voltage > 250 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                            <CountUpLive value={liveReading.voltage} decimals={1} suffix=" V" />
                        </h2>
                        <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                            {liveReading.voltage >= 210 && liveReading.voltage <= 250 ? (
                                <><CheckCircle className="w-4 h-4 text-[#00C864]" /> Stable Grid</>
                            ) : (
                                <><AlertTriangle className="w-4 h-4 text-red-500" /> Unstable Voltage</>
                            )}
                        </div>
                    </div>
                </div>

                {/* Card 4: Battery */}
                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-5 relative overflow-hidden flex items-center justify-between">
                    <div className="flex-1">
                        <h3 className="text-gray-400 text-sm font-semibold tracking-wide flex items-center gap-2 mb-2">
                            <Battery className="w-4 h-4 text-purple-400" /> Battery Level
                        </h3>
                        <div className="mt-4">
                            {liveReading.gridExport > 0 ? (
                                <span className="text-xs font-semibold px-2 py-1 rounded bg-purple-500/20 text-purple-400">Charging ⚡</span>
                            ) : liveReading.gridImport > 0 ? (
                                <span className="text-xs font-semibold px-2 py-1 rounded bg-orange-500/20 text-orange-400">Discharging</span>
                            ) : (
                                <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-500/20 text-gray-400">Idle / Balanced</span>
                            )}
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                            Est. ~{(liveReading.batteryLevel * currentUser.batteryKwh / 100 / (liveReading.consumption || 1)).toFixed(1)} hrs left at current load
                        </div>
                    </div>

                    <div className="w-24 h-24 relative flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={8} data={progressRingData} startAngle={90} endAngle={-270}>
                                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                <RadialBar minAngle={15} background={{ fill: 'rgba(255,255,255,0.05)' }} clockWise dataKey="value" cornerRadius={4} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center font-ibm-plex font-bold text-lg text-white">
                            {liveReading.batteryLevel}%
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── SECTION 3: Live Waveform Chart ────────────────────────────────── */}
            <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-5 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-semibold text-lg text-gray-200">Real-Time Waveform (10s updates)</h3>
                    <div className="flex items-center gap-4 text-xs font-ibm-plex">
                        <span className="flex items-center gap-1.5 text-[#00FF85]"><div className="w-2 h-2 rounded-full bg-[#00FF85]"></div> Solar (kW)</span>
                        <span className="flex items-center gap-1.5 text-blue-400"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Load (kW)</span>
                    </div>
                </div>

                <div className="flex-1 min-h-[300px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={waveformData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="liveSolar" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00FF85" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#00FF85" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="liveLoad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.5} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="time" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} domain={[0, 'dataMax + 2']} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0a0f0d', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                itemStyle={{ fontSize: '12px' }}
                                labelStyle={{ color: '#9ca3af', marginBottom: '4px', fontSize: '12px' }}
                                isAnimationActive={false}
                            />
                            <Area type="monotone" dataKey="solar" stroke="#00FF85" strokeWidth={2} fillOpacity={1} fill="url(#liveSolar)" isAnimationActive={false} />
                            <Area type="monotone" dataKey="load" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#liveLoad)" isAnimationActive={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ─── SECTION 4 & 5: Summary & CSV Upload ───────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Today Summary Cards */}
                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-5">
                    <h3 className="font-semibold text-lg text-gray-200 mb-4">Today's Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-xs text-gray-400 mb-1">Total Solar Generated</p>
                            <p className="text-xl font-ibm-plex text-[#00FF85] font-bold">{todayStats.solar.toFixed(1)} <span className="text-sm">kWh</span></p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-xs text-gray-400 mb-1">Total Consumed</p>
                            <p className="text-xl font-ibm-plex text-blue-400 font-bold">{todayStats.load.toFixed(1)} <span className="text-sm">kWh</span></p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-xs text-gray-400 mb-1">Net Grid Position</p>
                            <p className={`text-xl font-ibm-plex font-bold ${todayStats.netGrid >= 0 ? 'text-[#00FF85]' : 'text-orange-400'}`}>
                                {todayStats.netGrid > 0 ? '+' : ''}{todayStats.netGrid.toFixed(1)} <span className="text-sm">kWh</span>
                            </p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-xs text-gray-400 mb-1">Self-Sufficiency</p>
                            <p className="text-xl font-ibm-plex text-white font-bold">{todayStats.selfSufficiency}%</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-xs text-gray-400 mb-1">Peak Solar Hour</p>
                            <p className="text-lg font-ibm-plex text-gray-200">{todayStats.peakSolarHr}</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-xs text-gray-400 mb-1">Peak Load Hour</p>
                            <p className="text-lg font-ibm-plex text-gray-200">{todayStats.peakLoadHr}</p>
                        </div>
                    </div>
                </div>

                {/* CSV Upload Panel */}
                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-5 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-lg text-gray-200 flex items-center gap-2">
                            <UploadCloud className="w-5 h-5 text-gray-400" /> Upload Readings Data
                        </h3>
                        <button onClick={downloadTemplate} className="text-xs text-blue-400 hover:text-blue-300 font-medium">Download Template</button>
                    </div>

                    {!uploadFile ? (
                        <div
                            className={`flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors cursor-pointer text-center
                 ${isDragging ? 'border-[#00C864] bg-[#00C864]/5' : 'border-white/10 hover:border-white/20 bg-white/5'}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".csv" className="hidden" />
                            <UploadCloud className={`w-12 h-12 mb-4 ${isDragging ? 'text-[#00C864]' : 'text-gray-500'}`} />
                            <p className="text-sm font-medium text-gray-200">Drag & drop meter CSV here</p>
                            <p className="text-xs text-gray-500 mt-2">or click to browse from your computer</p>

                            <div className="mt-6">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Expected Columns:</p>
                                <div className="flex flex-wrap justify-center gap-1">
                                    {expectedHeaders.slice(0, 6).map(h => (
                                        <span key={h} className="px-2 py-0.5 rounded bg-black/50 border border-white/5 text-[10px] text-gray-300">{h}</span>
                                    ))}
                                    <span className="px-2 py-0.5 rounded bg-black/50 border border-white/5 text-[10px] text-gray-500">+{expectedHeaders.length - 6} more</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-sm font-medium text-white">{uploadFile.name}</p>
                                        <p className="text-xs text-gray-400">{(uploadFile.size / 1024).toFixed(1)} KB • CSV Format</p>
                                    </div>
                                    <button onClick={cancelUpload} className="p-1 hover:bg-white/10 rounded-full text-gray-400">
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>

                                {uploadErrors.length > 0 ? (
                                    <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                                        <p className="font-semibold mb-1">Validation Errors:</p>
                                        <ul className="list-disc pl-4 space-y-1">
                                            {uploadErrors.map((err, i) => <li key={i}>{err}</li>)}
                                        </ul>
                                    </div>
                                ) : (
                                    <div className="mt-3">
                                        <p className="text-xs text-[#00C864] flex items-center gap-1 mb-2 font-medium">
                                            <CheckCircle className="w-3.5 h-3.5" /> Validation passed
                                        </p>
                                        <div className="overflow-x-auto custom-scrollbar border border-white/5 rounded bg-black/30">
                                            <table className="w-full text-left text-[10px] whitespace-nowrap">
                                                <thead className="bg-white/5 border-b border-white/5 text-gray-400">
                                                    <tr>{expectedHeaders.slice(0, 6).map(h => <th key={h} className="px-2 py-1.5">{h}</th>)}</tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5 text-gray-300 font-ibm-plex">
                                                    {uploadPreview.map((r, i) => (
                                                        <tr key={i}>
                                                            <td className="px-2 py-1.5">{r.date || '-'}</td>
                                                            <td className="px-2 py-1.5">{r.hour || '-'}</td>
                                                            <td className="px-2 py-1.5 text-[#00FF85]">{r.solarGen || '-'}</td>
                                                            <td className="px-2 py-1.5 text-blue-400">{r.consumption || '-'}</td>
                                                            <td className="px-2 py-1.5">{r.gridImport || '-'}</td>
                                                            <td className="px-2 py-1.5">{r.gridExport || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-auto flex gap-3">
                                <button onClick={cancelUpload} className="flex-1 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-sm font-medium transition-colors">
                                    Cancel
                                </button>
                                <button onClick={confirmUpload} disabled={uploadErrors.length > 0} className="flex-1 py-2 rounded-lg bg-[#00C864] hover:bg-[#00FF85] text-black text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    Import Data
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EnergyPage;
