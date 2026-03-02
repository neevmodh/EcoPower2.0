import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { updateInCSV, appendToCSV } from '../../services/csvService';
import {
    Cpu, Power, Clock, Plus, Settings2, Trash2, Edit3, X, Zap, ArrowRight,
    TrendingDown, TrendingUp, AlertCircle, Sun, Activity, Droplets, Thermometer, Box, Fan
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';

const getDeviceIcon = (type) => {
    switch (type?.toLowerCase()) {
        case 'ac': return <Thermometer className="w-5 h-5" />;
        case 'heater': return <TrendingUp className="w-5 h-5 text-red-400" />;
        case 'pump': return <Droplets className="w-5 h-5 text-blue-400" />;
        case 'appliance': return <Box className="w-5 h-5" />;
        case 'fan': return <Fan className="w-5 h-5 text-gray-400" />;
        default: return <Cpu className="w-5 h-5" />;
    }
};

const getEmojiIcon = (type) => {
    switch (type?.toLowerCase()) {
        case 'ac': return '❄️';
        case 'heater': return '🔥';
        case 'pump': return '💧';
        case 'appliance': return '📺';
        case 'fan': return '💨';
        default: return '🔌';
    }
};

// ─── OPTIMIZER HELPER ─────────────────────────────────────────
const getRecommendation = (device) => {
    const type = device.type?.toLowerCase();
    const watts = parseFloat(device.powerWatts) || 0;

    // High power devices (>500W) should run during peak solar (9AM - 3PM)
    if (watts > 500) {
        if (type === 'ac') return { recommendedOn: '13:00', recommendedOff: '15:00', reason: 'Pre-cool house during peak solar generation (highest watts)', savings: 28 };
        if (type === 'heater') return { recommendedOn: '08:30', recommendedOff: '09:00', reason: 'Run 30 mins before peak solar starts', savings: 15 };
        if (type === 'pump') return { recommendedOn: '11:00', recommendedOff: '14:00', reason: 'Shift heavy water pumping to peak solar hours', savings: 14 };
        return { recommendedOn: '10:00', recommendedOff: '14:00', reason: 'High power load moved to peak solar window', savings: 12 };
    }

    // Low power
    if (type === 'fan') return { recommendedOn: '22:00', recommendedOff: '06:00', reason: 'Nighttime cooling when electricity is cheaper', savings: 5 };
    if (type === 'appliance') return { recommendedOn: '12:00', recommendedOff: '14:00', reason: 'Run appliances during solar peak', savings: 8 };

    return null;
};

// ─── ADD DEVICE MODAL ───────────────────────────────────────
const AddDeviceModal = ({ isOpen, onClose }) => {
    const { currentUser, setCsvData } = useApp();
    const [formData, setFormData] = useState({
        name: '', type: 'Appliance', location: '', powerWatts: '', scheduleOn: '00:00', scheduleOff: '00:00'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const newDevice = {
            id: `DEV_${Date.now()}`,
            userId: currentUser.id,
            ...formData,
            status: 'off'
        };

        try {
            await appendToCSV('devices.csv', newDevice);
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: `Device ${formData.name} added successfully.`, type: 'success' } }));
            onClose();
        } catch (err) {
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Failed to add device.', type: 'error' } }));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in custom-scrollbar">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-[#0d1512] border border-white/10 rounded-2xl shadow-2xl flex flex-col p-6">
                <h2 className="text-xl font-syne font-bold text-white mb-6">Add Smart Device</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Device Name</label>
                        <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white" placeholder="e.g. Living Room AC" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Type</label>
                            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white outline-none">
                                <option value="AC">Air Conditioner</option>
                                <option value="Pump">Water Pump</option>
                                <option value="Heater">Heater</option>
                                <option value="Appliance">Appliance</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Power (Watts)</label>
                            <input required type="number" value={formData.powerWatts} onChange={e => setFormData({ ...formData, powerWatts: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white" placeholder="e.g. 1500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Location</label>
                        <input required type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white" placeholder="e.g. Roof / Kitchen" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Auto On Time</label>
                            <input required type="time" value={formData.scheduleOn} onChange={e => setFormData({ ...formData, scheduleOn: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white [color-scheme:dark]" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Auto Off Time</label>
                            <input required type="time" value={formData.scheduleOff} onChange={e => setFormData({ ...formData, scheduleOff: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white [color-scheme:dark]" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-white/10 rounded-lg text-sm text-gray-300">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-[#00C864] rounded-lg text-sm font-bold text-black flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Add Device
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const DevicesPage = () => {
    const { currentUser, csvData, refreshData } = useApp();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingScheduleFor, setEditingScheduleFor] = useState(null);

    // Filter devices for user
    const devices = useMemo(() => {
        return csvData.devices.filter(d => d.userId === currentUser.id) || [];
    }, [csvData.devices, currentUser.id]);

    // Aggregate stats
    const stats = useMemo(() => {
        const total = devices.length;
        const active = devices.filter(d => d.status === 'on').length;
        const totalLoad = devices.reduce((sum, d) => sum + (d.status === 'on' ? parseFloat(d.powerWatts) || 0 : 0), 0) / 1000;

        // Cost calculation (assuming average 6 hours/day per device at ₹8/kWh if active, to give a rough metric)
        const activeLoadKW = devices.filter(d => d.status === 'on').reduce((sum, d) => sum + (parseFloat(d.powerWatts) || 0), 0) / 1000;
        const estCost = activeLoadKW * 6 * 8.0;

        return { total, active, totalLoad: totalLoad.toFixed(2), estCost: estCost.toFixed(2) };
    }, [devices]);

    // Toggle Device State (API Mock + Context Update)
    const toggleDevice = async (id, currentStatus) => {
        const newStatus = currentStatus === 'on' ? 'off' : 'on';
        try {
            await updateInCSV('devices.csv', id, { status: newStatus });
            // update context locally for immediate snap
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: `Device turned ${newStatus}.`, type: 'info' } }));
        } catch (err) {
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Failed to toggle device.', type: 'error' } }));
        }
    };

    const applySchedule = async (id, scheduleOn, scheduleOff) => {
        try {
            await updateInCSV('devices.csv', id, { scheduleOn, scheduleOff });
            setEditingScheduleFor(null);
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Schedule updated successfully.', type: 'success' } }));
        } catch (e) {
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Failed to update schedule.', type: 'error' } }));
        }
    };

    // Chart Data preparation (sorted by powerWatts desc)
    const chartData = useMemo(() => {
        return devices
            .map(d => ({
                name: d.name,
                power: parseFloat(d.powerWatts) || 0,
                status: d.status,
                color: d.status === 'on' ? '#00C864' : '#4b5563'
            }))
            .sort((a, b) => b.power - a.power);
    }, [devices]);

    // AI SMART SCHEDULER LOGIC
    const optimizationStats = useMemo(() => {
        let totalWeeklySavings = 0;
        const recommendations = [];
        devices.forEach(device => {
            const rec = getRecommendation(device);
            if (rec && (device.scheduleOn !== rec.recommendedOn || device.scheduleOff !== rec.recommendedOff)) {
                totalWeeklySavings += rec.savings * 7;
                recommendations.push({ deviceId: device.id, rec });
            }
        });
        return { totalWeeklySavings, recommendations };
    }, [devices]);

    const applyAllRecommendations = async () => {
        setIsSubmitting(true);
        try {
            for (const item of optimizationStats.recommendations) {
                await updateInCSV('devices.csv', item.deviceId, { scheduleOn: item.rec.recommendedOn, scheduleOff: item.rec.recommendedOff });
            }
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'All smart schedules applied. System Optimized! 🌿', type: 'success' } }));
        } catch (e) {
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Failed to apply schedules.', type: 'error' } }));
        } finally {
            setIsSubmitting(false);
        }
    };

    const [tariffPrice, setTariffPrice] = useState(8.5); // ₹/kWh
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Timeline helpers
    const timeToPercent = (timeStr) => {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        return ((h + m / 60) / 24) * 100;
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">

            {/* ─── SECTION 1: AI SMART SCHEDULER OPTIMIZER ────────────────────────── */}
            <div className="bg-[#050908] border border-purple-500/30 rounded-2xl overflow-hidden relative shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                {/* Decorative header glow */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-[#00C864]"></div>

                <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-purple-500/5">
                    <div>
                        <h2 className="text-2xl font-syne font-bold text-white flex items-center gap-2">
                            🧠 AI Smart Scheduler
                            <span className="flex space-x-1 ml-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse delay-75"></span>
                            </span>
                        </h2>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-300">
                            <Sun className="w-4 h-4 text-yellow-400" />
                            <span>Tomorrow's Forecast: <strong className="text-white">Clear, Peak Solar 9AM - 3PM</strong></span>
                        </div>
                    </div>

                    {optimizationStats.recommendations.length > 0 ? (
                        <div className="text-right flex items-center gap-4">
                            <div className="text-sm">
                                <span className="text-gray-400">Potential Savings: </span>
                                <span className="text-[#00FF85] font-bold font-ibm-plex text-xl">₹{optimizationStats.totalWeeklySavings} /wk</span>
                            </div>
                            <button
                                onClick={applyAllRecommendations}
                                disabled={isSubmitting}
                                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-lg text-sm transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                            >
                                <Zap className="w-4 h-4" />
                                {isSubmitting ? 'Optimizing...' : 'Apply All Recommendations'}
                            </button>
                        </div>
                    ) : (
                        <div className="px-4 py-2 bg-[#00C864]/10 border border-[#00C864]/30 text-[#00FF85] rounded-lg text-sm font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> System Fully Optimized
                        </div>
                    )}
                </div>

                {optimizationStats.recommendations.length > 0 && (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {devices.map(device => {
                            const rec = getRecommendation(device);
                            if (!rec) return null;
                            const isOptimized = device.scheduleOn === rec.recommendedOn && device.scheduleOff === rec.recommendedOff;
                            if (isOptimized) return null;

                            return (
                                <div key={`ai-rec-${device.id}`} className="bg-white/5 border border-white/10 rounded-xl p-4 transition-all hover:bg-white/10">
                                    <h4 className="font-bold text-white text-sm mb-3">{device.name}</h4>

                                    <div className="flex items-center justify-between mb-3 w-full bg-black/40 rounded-lg p-2.5">
                                        <div className="flex flex-col flex-1">
                                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Current</span>
                                            <span className="text-xs font-ibm-plex text-gray-300 line-through decoration-red-500/50">{device.scheduleOn} - {device.scheduleOff}</span>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-500 flex-shrink-0 mx-2" />
                                        <div className="flex flex-col flex-1 text-right">
                                            <span className="text-[10px] text-purple-400 uppercase tracking-widest font-bold">Optimal</span>
                                            <span className="text-xs font-ibm-plex text-[#00FF85] font-bold">{rec.recommendedOn} - {rec.recommendedOff}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 leading-relaxed flex gap-2">
                                        <AlertCircle className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                                        <span>{rec.reason}</span>
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ─── SECTION 2: DEVICE USAGE TIMELINE & SOLAR OVERLAY ──────────────────────── */}
            <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-6">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h3 className="text-xl font-syne font-bold text-white mb-1">Device Usage Timeline</h3>
                        <p className="text-sm text-gray-400">Green area indicates solar generation peak hours.</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#3B82F6]"></span> Device Run Time</div>
                        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#00C864]/30 border border-[#00C864]"></span> Solar Supply</div>
                        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-purple-500 border border-purple-400"></span> Optimal Overlap</div>
                    </div>
                </div>

                <div className="relative w-full pb-8">
                    {/* Time Axis Markers */}
                    <div className="absolute top-0 left-[100px] right-0 h-full flex justify-between pointer-events-none">
                        {[0, 6, 12, 18, 24].map(h => (
                            <div key={h} className="h-full border-l border-white/5 relative">
                                <span className="absolute -bottom-6 -left-3 text-xs text-gray-500 font-ibm-plex">{h === 0 || h === 24 ? '12AM' : h === 12 ? '12PM' : h < 12 ? `${h}AM` : `${h - 12}PM`}</span>
                            </div>
                        ))}
                    </div>

                    {/* Solar Overlay (e.g. 7AM to 5PM curve) */}
                    <div className="absolute top-0 left-[100px] right-0 bottom-0 pointer-events-none z-0 flex items-end overflow-hidden pb-1">
                        <div className="w-full h-full relative">
                            {/* Simple CSS curve representing solar power */}
                            <div className="absolute bottom-0 h-full w-[41%] left-[29%] bg-[#00C864]/10 border-t-2 border-[#00C864]/50 rounded-t-[100%] shadow-[0_0_20px_rgba(0,200,100,0.1)]"></div>
                        </div>
                    </div>

                    <div className="relative z-10 flex flex-col gap-3 ml-[100px]">
                        {devices.map(device => {
                            const onPct = timeToPercent(device.scheduleOn);
                            let offPct = timeToPercent(device.scheduleOff);
                            if (offPct < onPct) offPct = 100; // Handle cross-midnight by extending to end of graphic
                            const width = Math.max(0.5, offPct - onPct);

                            // Calculate overlap with 9AM (37.5%) to 3PM (62.5%) solar curve
                            const solarStart = 37.5;
                            const solarEnd = 62.5;
                            const overlapStart = Math.max(onPct, solarStart);
                            const overlapEnd = Math.min(offPct, solarEnd);
                            const hasOverlap = overlapEnd > overlapStart;

                            return (
                                <div key={`timeline-${device.id}`} className="relative h-6 flex items-center">
                                    <div className="absolute -left-[100px] w-[90px] text-right text-xs text-gray-300 font-medium truncate pr-3">{device.name}</div>
                                    <div className="w-full h-full bg-black/40 rounded-full overflow-hidden relative border border-white/5">
                                        <div
                                            className="absolute h-full bg-[#3B82F6] rounded-full opacity-80"
                                            style={{ left: `${onPct}%`, width: `${width}%` }}
                                        />
                                        {hasOverlap && (
                                            <div
                                                className="absolute h-full bg-purple-500/80 border-y border-purple-400"
                                                style={{ left: `${overlapStart}%`, width: `${overlapEnd - overlapStart}%` }}
                                            />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ─── SECTION 3: Energy Cost Calculator ────────────────────────────────────────── */}
            <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-xl font-syne font-bold text-white mb-1 flex items-center gap-2"><Activity className="w-5 h-5 text-orange-400" /> Energy Cost Calculator</h3>
                        <p className="text-sm text-gray-400">Estimate real-time impact of your devices.</p>
                    </div>
                    <div className="flex items-center gap-3 bg-black/40 border border-white/10 px-4 py-2 rounded-xl">
                        <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">Grid Tariff (₹/kWh)</label>
                        <input type="number" step="0.5" value={tariffPrice} onChange={e => setTariffPrice(e.target.value)} className="w-16 bg-transparent text-[#00FF85] font-ibm-plex font-bold text-lg outline-none text-right" />
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                <th className="py-3 px-4 font-normal">Device</th>
                                <th className="py-3 px-4 font-normal text-right">Power</th>
                                <th className="py-3 px-4 font-normal text-right">Run Time</th>
                                <th className="py-3 px-4 font-normal text-right">Without Solar (₹/mo)</th>
                                <th className="py-3 px-4 font-normal text-right">Est. With Solar (₹/mo)</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-ibm-plex">
                            {devices.map(device => {
                                const kw = (parseFloat(device.powerWatts) || 0) / 1000;

                                // calculate roughly run hours
                                const onH = parseFloat(device.scheduleOn.split(':')[0]) + parseFloat(device.scheduleOn.split(':')[1]) / 60;
                                let offH = parseFloat(device.scheduleOff.split(':')[0]) + parseFloat(device.scheduleOff.split(':')[1]) / 60;
                                if (offH < onH) offH += 24;
                                const hrs = offH - onH;

                                // check solar overlap
                                const solStart = 9; const solEnd = 15;
                                const overlapStart = Math.max(onH, solStart);
                                const overlapEnd = Math.min(offH, solEnd);
                                const solarHrs = Math.max(0, overlapEnd - overlapStart);
                                const gridHrs = hrs - solarHrs;

                                const costWithout = (kw * hrs * tariffPrice * 30).toFixed(0);
                                const costWith = (kw * gridHrs * tariffPrice * 30).toFixed(0);
                                const saved = (costWithout - costWith);

                                return (
                                    <tr key={`cost-${device.id}`} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="py-3 px-4 text-white font-sans font-medium flex items-center gap-2">
                                            {getEmojiIcon(device.type)} {device.name}
                                        </td>
                                        <td className="py-3 px-4 text-gray-300 text-right">{kw.toFixed(2)} kW</td>
                                        <td className="py-3 px-4 text-gray-300 text-right">{hrs.toFixed(1)} hrs/day</td>
                                        <td className="py-3 px-4 text-orange-400 text-right">₹{costWithout}</td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[#00FF85] font-bold">₹{costWith}</span>
                                                {saved > 0 && <span className="text-[10px] text-gray-500 uppercase">Save ₹{saved}</span>}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── SECTION 4: Device Grid (Old Overviews & Toggles) ────────────────────────────────────────── */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-syne font-bold text-white">Device Status</h2>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#00C864] hover:bg-[#00FF85] text-black font-bold rounded-lg transition-colors text-sm shadow-lg shadow-[#00C864]/20"
                    >
                        <Plus className="w-4 h-4" /> Add Device
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {devices.map(device => {
                        const isOn = device.status === 'on';
                        const costDaily = ((parseFloat(device.powerWatts) / 1000) * 8 * 8.0).toFixed(1); // Rough estimate: 8 hrs * 8 Rs

                        return (
                            <div key={device.id} className={`bg-[#0a0f0d] border rounded-2xl p-5 transition-all duration-300 relative ${isOn ? 'border-[#00C864]/50 shadow-[0_0_15px_rgba(0,200,100,0.1)]' : 'border-white/10 opacity-80'}`}>

                                {/* Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isOn ? 'bg-[#00C864]/20 border border-[#00C864]/30' : 'bg-white/5 border border-white/10'}`}>
                                            {getEmojiIcon(device.type)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-md">{device.name}</h4>
                                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {device.location}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Toggle Switch */}
                                    <button
                                        onClick={() => toggleDevice(device.id, device.status)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isOn ? 'bg-[#00C864]' : 'bg-gray-600'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isOn ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between mb-5 bg-black/40 px-3 py-2 rounded-lg border border-white/5">
                                    <div className="flex items-center gap-3 text-sm text-gray-300 font-ibm-plex">
                                        <span className="text-[#00FF85] font-bold">{device.powerWatts}W</span>
                                        <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                                        <span className="capitalize">{device.type}</span>
                                    </div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-widest">
                                        Tariff: ₹{costDaily}/day
                                    </div>
                                </div>

                                {/* Schedule Row */}
                                <div className="border-t border-white/5 pt-4">
                                    {editingScheduleFor === device.id ? (
                                        <div className="flex items-center gap-2 mb-2 p-2 bg-black/40 rounded-lg border border-[#00C864]/30">
                                            <input id={`on-${device.id}`} type="time" defaultValue={device.scheduleOn} className="bg-transparent text-xs text-white outline-none w-20 [color-scheme:dark]" />
                                            <span className="text-gray-500">-</span>
                                            <input id={`off-${device.id}`} type="time" defaultValue={device.scheduleOff} className="bg-transparent text-xs text-white outline-none w-20 [color-scheme:dark]" />
                                            <button onClick={() => {
                                                const onVal = document.getElementById(`on-${device.id}`).value;
                                                const offVal = document.getElementById(`off-${device.id}`).value;
                                                applySchedule(device.id, onVal, offVal);
                                            }} className="ml-auto p-1 bg-[#00C864] text-black rounded"><Check className="w-3 h-3" /></button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between group cursor-pointer" onClick={() => setEditingScheduleFor(device.id)}>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-[#00C864]" />
                                                <span className="text-xs text-[#00FF85] font-ibm-plex font-bold">Auto: {device.scheduleOn} - {device.scheduleOff}</span>
                                            </div>
                                            <Edit3 className="w-3.5 h-3.5 text-gray-600 group-hover:text-[#00C864] transition-colors" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ─── SECTION 5: Overview Row (Moved to Bottom) ───────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-5 flex flex-col relative overflow-hidden">
                    <span className="text-xs font-semibold text-gray-400 flex items-center gap-2 mb-2"><Box className="w-4 h-4" /> Devices</span>
                    <span className="text-2xl font-ibm-plex font-bold text-white">{stats.total}</span>
                </div>
                <div className="bg-[#0d1512] border border-[#00C864]/20 rounded-2xl p-5 flex flex-col relative overflow-hidden">
                    <span className="text-xs font-semibold text-[#00C864] flex items-center gap-2 mb-2"><Power className="w-4 h-4" /> Active</span>
                    <span className="text-2xl font-ibm-plex font-bold text-white">{stats.active}</span>
                </div>
                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-5 flex flex-col relative overflow-hidden">
                    <span className="text-xs font-semibold text-gray-400 flex items-center gap-2 mb-2"><Activity className="w-4 h-4 text-purple-400" /> Total Load</span>
                    <span className="text-2xl font-ibm-plex font-bold text-white">{stats.totalLoad} <span className="text-xs text-gray-500 font-jakarta">kW</span></span>
                </div>
                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-5 flex flex-col relative overflow-hidden">
                    <span className="text-xs font-semibold text-gray-400 flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-orange-400" /> Daily Cost</span>
                    <span className="text-2xl font-ibm-plex font-bold text-white">₹{stats.estCost}</span>
                </div>
            </div>

            {/* ─── Add Device Modal ────────────────────────────────────────── */}

        </div>
    );
};
import { CheckCircle2 } from 'lucide-react';

// Simple pseudo MapPin component stub as the icon isn't imported from lucide properly in early block
const MapPin = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;

export default DevicesPage;
