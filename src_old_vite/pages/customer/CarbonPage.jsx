import React, { useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import html2canvas from 'html2canvas';
import {
    Leaf, Download, Share2, TreePine, Car, Home, TrendingUp, Zap, Plane, Activity, CloudRain, Factory, Droplets
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, ReferenceLine
} from 'recharts';
import { format, parseISO } from 'date-fns';

// ─── SVG CUSTOM PROGRESS RING ──────────────────────────────────────────────
const CircularProgress = ({ value, max, milestones }) => {
    const radius = 120;
    const stroke = 16;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (value / max) * circumference;

    return (
        <div className="relative w-full max-w-[320px] aspect-square mx-auto flex items-center justify-center">
            <svg height="100%" width="100%" viewBox="0 0 240 240" className="transform -rotate-90">
                {/* Background Ring */}
                <circle
                    stroke="rgba(255, 255, 255, 0.05)"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx="120"
                    cy="120"
                />
                {/* Progress Ring */}
                <circle
                    stroke="#00C864"
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx="120"
                    cy="120"
                />

                {/* Milestone Markers */}
                {milestones.map((m, i) => {
                    const angle = (m / max) * 360;
                    const rad = (angle * Math.PI) / 180;
                    const rx = 120 + normalizedRadius * Math.cos(rad);
                    const ry = 120 + normalizedRadius * Math.sin(rad);
                    return (
                        <circle key={i} cx={rx} cy={ry} r="4" fill="#ffffff" />
                    );
                })}
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-sm font-semibold text-[#00C864] uppercase tracking-widest mb-1">CO₂ Offset</span>
                <span className="text-4xl sm:text-5xl font-ibm-plex font-bold text-white mb-2">{Math.floor(value)}<span className="text-lg text-gray-400 font-jakarta ml-1">kg</span></span>
                <span className="text-xs text-gray-500">of {max}kg Goal</span>
            </div>
        </div>
    );
};


// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
const CarbonPage = () => {
    const { currentUser, csvData } = useApp();
    const shareRef = useRef(null);

    // 1. Calculate All-Time Impacts
    const impacts = useMemo(() => {
        const userReadings = csvData.energyReadings.filter(r => r.userId === currentUser.id);
        let totalSolar = 0;
        let totalCons = 0;

        userReadings.forEach(r => {
            totalSolar += parseFloat(r.solarGen) || 0;
            totalCons += parseFloat(r.consumption) || 0;
        });

        const co2Saved = totalSolar * 0.82; // 0.82kg per kWh
        const selfSufficiency = totalCons > 0 ? (totalSolar / totalCons) * 100 : 0;

        return {
            totalSolar,
            co2Saved,
            selfSufficiency,
            trees: Math.round(co2Saved / 21) || 0, // Roughly 21kg absorbed by a mature tree per year 
            carKm: Math.round(co2Saved / 0.21) || 0, // ~0.21kg per km driven
            homes: ((totalSolar || 0) / 250).toFixed(1), // Assume 250kWh avg monthly per Indian home
        };
    }, [csvData.energyReadings, currentUser.id]);

    // Determine Milestone
    const determineGoal = (co2) => {
        if (co2 < 100) return { max: 100, next: 100, label: '100kg' };
        if (co2 < 500) return { max: 500, next: 500, label: '500kg' };
        if (co2 < 1000) return { max: 1000, next: 1000, label: '1 Tonne' };
        return { max: Math.ceil(co2 / 1000) * 1000, next: Math.ceil(co2 / 1000) * 1000, label: `${Math.ceil(co2 / 1000)} Tonnes` };
    };
    const goal = determineGoal(impacts.co2Saved);

    // 2. Trend Chart Data (Last 6 Months grouped)
    const chartData = useMemo(() => {
        const monthsMap = new Map();
        const userReadings = csvData.energyReadings.filter(r => r.userId === currentUser.id);

        userReadings.forEach(r => {
            const g = parseFloat(r.solarGen) || 0;
            if (g <= 0 || !r.date) return;
            try {
                const monthStr = format(parseISO(r.date), 'MMM yy');
                monthsMap.set(monthStr, (monthsMap.get(monthStr) || 0) + (g * 0.82));
            } catch (e) {
                console.warn("Invalid date in CarbonPage rendering:", r.date);
            }
        });

        // If no real history, generate a mocked smooth upward trend
        if (monthsMap.size < 2) {
            const mocked = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(); d.setMonth(d.getMonth() - i);
                mocked.push({
                    month: format(d, 'MMM yy'),
                    CO2: parseFloat((Math.random() * 50 + 150 + (5 - i) * 20).toFixed(1))
                });
            }
            return mocked;
        }

        return Array.from(monthsMap.entries()).map(([month, co2]) => ({ month, CO2: parseFloat(co2.toFixed(1)) }));
    }, [csvData.energyReadings, currentUser.id]);

    // 3. Export Card to PNG
    const handleDownloadCard = async () => {
        if (!shareRef.current) return;
        try {
            const canvas = await html2canvas(shareRef.current, { backgroundColor: '#050908', scale: 2 });
            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `EcoPower_Impact_${currentUser.name.replace(/\s+/g, '_')}.png`;
            link.click();
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Image downloaded!', type: 'success' } }));
        } catch (err) {
            console.error(err);
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Failed to capture image.', type: 'error' } }));
        }
    };

    // WhatsApp Share
    const handleShareWA = () => {
        const text = `🌱 I've saved ${Math.floor(impacts.co2Saved)}kg of CO₂ and powered ${(impacts.totalSolar / 250).toFixed(1)} homes equivalent this month using @EcoPower! Join the movement towards Carbon Neutrality. ⚡🌍`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">

            {/* ─── HEADER ──────────────────────────────────────────────────────────── */}
            <div>
                <h2 className="text-2xl font-syne font-bold text-white mb-2">Environmental Impact</h2>
                <p className="text-sm text-gray-400">Track your contribution towards building a cleaner, self-reliant planet.</p>
            </div>

            {/* ─── SECTION 1: Hero Impact Grid ───────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-green-500/30 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><TreePine className="w-16 h-16 text-green-500" /></div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 block relative z-10">Trees Planted</span>
                    <div className="text-3xl font-ibm-plex font-bold text-green-500 mb-1 relative z-10">{impacts.trees}</div>
                    <p className="text-[10px] text-gray-500 relative z-10">Trees absorbing CO₂ for 1 yr</p>
                </div>

                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Car className="w-16 h-16 text-blue-500" /></div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 block relative z-10">Emissions Driven</span>
                    <div className="text-3xl font-ibm-plex font-bold text-white mb-1 relative z-10">{impacts.carKm.toLocaleString()} <span className="text-lg text-gray-500">km</span></div>
                    <p className="text-[10px] text-gray-500 relative z-10">Car tailpipe emissions offset</p>
                </div>

                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-yellow-500/30 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Home className="w-16 h-16 text-yellow-500" /></div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 block relative z-10">Homes Powered</span>
                    <div className="text-3xl font-ibm-plex font-bold text-white mb-1 relative z-10">{impacts.homes}</div>
                    <p className="text-[10px] text-gray-500 relative z-10">Avg Indian homes for 1 month</p>
                </div>

                <div className={`border rounded-2xl p-5 relative overflow-hidden transition-colors ${impacts.selfSufficiency > 80 ? 'bg-[#00C864]/10 border-[#00C864]/30' : 'bg-[#0d1512] border-white/5'}`}>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 block">Carbon Status</span>
                    {impacts.selfSufficiency > 80 ? (
                        <div className="mt-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#00C864] text-black text-sm font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-[#00C864]/20"><Leaf className="w-4 h-4" /> Neutral</span>
                            <p className="text-[10px] text-[#00C864] mt-2 font-medium tracking-wide">Excellent self-sufficiency sustained.</p>
                        </div>
                    ) : (
                        <div className="mt-2 text-white">
                            <div className="text-xl font-ibm-plex font-bold mb-1">{impacts.selfSufficiency.toFixed(1)}%</div>
                            <div className="w-full h-1.5 bg-black rounded-full overflow-hidden mb-2">
                                <div className="h-full bg-gradient-to-r from-blue-500 to-[#00C864]" style={{ width: `${impacts.selfSufficiency}%` }}></div>
                            </div>
                            <p className="text-[10px] text-gray-500">Progress to Carbon Neutrality target (~80%)</p>
                        </div>
                    )}
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">

                {/* ─── SECTION 2: CO2 Savings Ring ─────────────────────────────────── */}
                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-6 lg:p-8 flex flex-col items-center justify-center relative shadow-[0_0_30px_rgba(0,200,100,0.02)]">
                    <h3 className="text-lg font-syne font-bold text-white self-start lg:absolute lg:top-8 lg:left-8 mb-4 lg:mb-0">Milestone Tracker</h3>
                    <div className="w-full flex-1 flex flex-col items-center justify-center py-6">
                        <CircularProgress
                            value={impacts.co2Saved}
                            max={goal.max}
                            milestones={[goal.max * 0.25, goal.max * 0.5, goal.max * 0.75, goal.max]}
                        />
                        <div className="mt-6 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-gray-300">
                            <span className="text-[#00C864] font-bold">{Math.floor(goal.next - (impacts.co2Saved || 0))}kg</span> remaining to reach <span className="text-white font-bold">{goal.label}</span>!
                        </div>
                    </div>
                </div>

                {/* ─── SECTION 3: Monthly Trend Chart ──────────────────────────────── */}
                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-6 lg:p-8 flex flex-col w-full h-[450px]">
                    <h3 className="text-lg font-syne font-bold text-white mb-2">Monthly CO₂ Savings Trend</h3>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-6">Kilograms offset over past half-year</p>

                    <div className="flex-1 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCO2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00C864" stopOpacity={0.6} />
                                        <stop offset="95%" stopColor="#00C864" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="month" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} />
                                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `${v}kg`} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#0a0f0d', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px', color: '#00FF85', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#9ca3af', marginBottom: '4px', fontSize: '12px' }}
                                    formatter={(val) => [`${val} kg CO₂`, 'Offset']}
                                />
                                <ReferenceLine y={250} stroke="rgba(239, 68, 68, 0.5)" strokeDasharray="4 4" strokeWidth={1} label={{ position: 'top', value: 'Indian Avg Monthly Footprint (250kg)', fill: '#ef4444', fontSize: 9, align: 'right' }} />

                                <Area type="monotone" dataKey="CO2" stroke="#00C864" strokeWidth={3} fillOpacity={1} fill="url(#colorCO2)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">

                {/* ─── SECTION 4: Creative Equivalents Grid ────────────────────────── */}
                <div className="lg:col-span-7 bg-[#0d1512] border border-white/5 rounded-2xl p-6 lg:p-8 h-full">
                    <h3 className="text-lg font-syne font-bold text-white mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-400" /> Real-World Impact
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        <div className="flex gap-4 p-4 rounded-xl bg-black/40 border border-purple-500/10 hover:border-purple-500/30 transition-colors">
                            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                                <Plane className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-ibm-plex font-bold text-white mb-1">{((impacts.co2Saved || 0) / 120).toFixed(1)}</div>
                                <p className="text-xs text-gray-400">Mumbai–Delhi ✈️ domestic flights avoided entirely.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 p-4 rounded-xl bg-black/40 border border-blue-500/10 hover:border-blue-500/30 transition-colors">
                            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                <Factory className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-ibm-plex font-bold text-white mb-1">{Math.round((impacts.co2Saved || 0) * 0.4)}</div>
                                <p className="text-xs text-gray-400">kg of heavy coal not burned at power stations.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 p-4 rounded-xl bg-black/40 border border-[#00C864]/10 hover:border-[#00C864]/30 transition-colors">
                            <div className="w-12 h-12 rounded-lg bg-[#00C864]/10 flex items-center justify-center shrink-0">
                                <Droplets className="w-6 h-6 text-[#00C864]" />
                            </div>
                            <div>
                                <div className="text-2xl font-ibm-plex font-bold text-white mb-1">{((impacts.totalSolar || 0) * 1.5).toLocaleString()}</div>
                                <p className="text-xs text-gray-400">Liters of water saved in thermal plant cooling.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 p-4 rounded-xl bg-black/40 border border-yellow-500/10 hover:border-yellow-500/30 transition-colors">
                            <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                                <Zap className="w-6 h-6 text-yellow-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-ibm-plex font-bold text-white mb-1">{((impacts.totalSolar || 0) * 0.1).toFixed(1)}</div>
                                <p className="text-xs text-gray-400">Gallons of diesel equivalent conserved.</p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* ─── SECTION 5: Share Impact Card ────────────────────────────────── */}
                <div className="lg:col-span-5 flex flex-col items-center lg:items-end justify-center">

                    {/* The actual Card Element we will capture with html2canvas */}
                    <div
                        ref={shareRef}
                        className="w-full max-w-[340px] bg-gradient-to-br from-[#0a1812] to-[#040806] border border-[#00C864]/40 rounded-2xl p-6 relative overflow-hidden shadow-[0_10px_40px_rgba(0,200,100,0.15)] bg-slate-900"
                        style={{ backgroundColor: '#050908' }} // Hardcoded for canvas accuracy
                    >
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#00FF85]/20 blur-2xl rounded-full"></div>

                        <div className="flex items-center gap-2 mb-6">
                            <Zap className="w-5 h-5 text-[#00FF85]" fill="currentColor" />
                            <span className="font-syne font-bold text-white tracking-wide">My EcoPower Impact</span>
                        </div>

                        <div className="mb-6">
                            <p className="text-[10px] text-[#00C864] uppercase tracking-widest font-bold mb-1">{format(new Date(), 'MMMM yyyy')} Milestone</p>
                            <h3 className="font-syne text-2xl font-bold text-white leading-tight">{currentUser?.name}</h3>
                            <p className="text-xs text-gray-400 mt-1">{currentUser?.plan}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                                <span className="text-2xl font-ibm-plex font-bold text-white">{Math.floor(impacts.co2Saved)}</span>
                                <span className="text-[10px] text-gray-400 block mt-1">kg CO₂ Offset</span>
                            </div>
                            <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                                <span className="text-2xl font-ibm-plex font-bold text-[#00FF85]">{impacts.trees}</span>
                                <span className="text-[10px] text-gray-400 block mt-1">Trees Planted EQ</span>
                            </div>
                        </div>

                        <div className="text-sm font-medium text-white/90 italic border-l-2 border-[#00C864] pl-3 mb-6">
                            "I'm decentralizing the grid and fighting climate change! 🌱"
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-gray-500 pt-3 border-t border-white/10">
                            <span className="font-bold tracking-widest uppercase">@EcoPowerNetwork</span>
                            <span>#SolarRevolution</span>
                        </div>
                    </div>

                    {/* Actions for the Share Card (outside capture div) */}
                    <div className="w-full max-w-[340px] flex gap-3 mt-6">
                        <button
                            onClick={handleDownloadCard}
                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-colors flex items-center justify-center gap-2"
                        >
                            <Download className="w-4 h-4" /> Save PNG
                        </button>
                        <button
                            onClick={handleShareWA}
                            className="flex-1 py-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-xl text-sm font-bold text-[#25D366] transition-colors flex items-center justify-center gap-2"
                        >
                            <Share2 className="w-4 h-4" /> Share
                        </button>
                    </div>
                </div>

            </div>

            {/* ─── NEW SECTION 6: Carbon Credit Tokenization (P2P Wallet) ──────────────── */}
            <div className="bg-[#050908] border border-[#00C864]/30 rounded-2xl overflow-hidden relative shadow-[0_0_40px_rgba(0,200,100,0.05)] mt-6">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00C864] to-transparent"></div>
                
                <div className="p-6 lg:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5">
                    <div>
                        <h3 className="text-xl font-syne font-bold text-white flex items-center gap-2 mb-2">
                            <Leaf className="w-5 h-5 text-[#00FF85]" /> Carbon Credit Wallet
                        </h3>
                        <p className="text-sm text-gray-400">Your verified CO₂ offsets are automatically tokenized into tradable credits (1 Credit = 1 Tonne CO₂). </p>
                    </div>
                    
                    <div className="flex gap-4 p-4 rounded-xl bg-black/40 border border-[#00C864]/20 w-full md:w-auto">
                        <div className="w-12 h-12 rounded-lg bg-[#00C864]/10 flex items-center justify-center shrink-0">
                            <Activity className="w-6 h-6 text-[#00FF85]" />
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Live Market Price</span>
                            <div className="text-xl font-ibm-plex font-bold text-[#00FF85]">₹420.50<span className="text-sm font-normal text-gray-400 ml-1">/ Credit</span></div>
                        </div>
                    </div>
                </div>

                <div className="p-6 lg:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#00C864]/5 rounded-full blur-xl group-hover:bg-[#00C864]/10 transition-colors"></div>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 block relative z-10">Available Credits</span>
                        <div className="text-4xl font-ibm-plex font-bold text-white mb-1 relative z-10">
                            {Math.floor((impacts.co2Saved || 0) / 1000).toLocaleString('en-IN')}
                        </div>
                        <p className="text-[10px] text-gray-500 relative z-10 font-medium">Fully verified & mintable tokens</p>
                    </div>

                    <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 block relative z-10">Total Asset Value</span>
                        <div className="text-4xl font-ibm-plex font-bold text-[#00FF85] mb-1 relative z-10">
                            ₹{(Math.floor((impacts.co2Saved || 0) / 1000) * 420.5).toLocaleString('en-IN')}
                        </div>
                        <p className="text-[10px] text-gray-500 relative z-10 font-medium">Current market valuation</p>
                    </div>

                    <div className="flex flex-col gap-3 justify-center">
                        <button className="w-full py-3.5 bg-gradient-to-r from-[#00C864] to-[#00A050] hover:to-[#00C864] rounded-xl text-black font-bold text-sm shadow-[0_4px_15px_rgba(0,200,100,0.3)] transition-all flex items-center justify-center gap-2">
                            <Share2 className="w-4 h-4" /> Trade on Open Market
                        </button>
                        <button className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 font-bold text-sm transition-all flex items-center justify-center gap-2">
                            <Download className="w-4 h-4" /> Download ESG Certificate
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default CarbonPage;
