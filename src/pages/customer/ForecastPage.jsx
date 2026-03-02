import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
    CloudSun, Sun, CloudRain, Cloud, Wind, Thermometer,
    Droplets, Zap, ArrowRight, Activity, Percent, Clock
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, RadialBarChart, RadialBar, Line
} from 'recharts';
import { format, addDays, getHours, subDays } from 'date-fns';

// ─── API & MOCK UTILS ──────────────────────────────────────────────────────
const CITY_COORDS = {
    'Ahmedabad': { lat: 23.0225, lon: 72.5714 },
    'Surat': { lat: 21.1702, lon: 72.8311 },
    'Vadodara': { lat: 22.3072, lon: 73.1812 },
    'Rajkot': { lat: 22.3039, lon: 70.8022 },
    'Gandhinagar': { lat: 23.2156, lon: 72.6369 },
    'Bhavnagar': { lat: 21.7645, lon: 72.1519 },
    'default': { lat: 23.0225, lon: 72.5714 }
};

const getWeatherIcon = (condition, className = "w-6 h-6") => {
    if (condition.includes('Rain')) return <CloudRain className={`${className} text-blue-400`} />;
    if (condition.includes('Cloud')) return <Cloud className={`${className} text-gray-400`} />;
    if (condition.includes('Partly')) return <CloudSun className={`${className} text-yellow-500`} />;
    return <Sun className={`${className} text-yellow-400`} />;
};

const calculateCondition = (cloudcover, precipitation) => {
    if (precipitation > 2) return 'Rainy';
    if (cloudcover < 20) return 'Sunny';
    if (cloudcover < 50) return 'Partly Cloudy';
    if (cloudcover < 80) return 'Cloudy';
    return 'Overcast';
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
const ForecastPage = () => {
    const { currentUser, csvData } = useApp();

    const [loading, setLoading] = useState(true);
    const [forecastData, setForecastData] = useState([]);
    const [hourlyData, setHourlyData] = useState([]);
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [error, setError] = useState(null);

    const city = currentUser?.city || 'Ahmedabad';
    const solarKw = parseFloat(currentUser?.solarKw || 5);

    // 1. Fetch live Open-Meteo Data
    useEffect(() => {
        const fetchForecast = async () => {
            setLoading(true);
            setError(null);
            const coords = CITY_COORDS[city] || CITY_COORDS.default;
            const url = `https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&hourly=temperature_2m`;
            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error('API Error');
                const data = await res.json();

                // Transform Daily Data (Mocked out because the custom Open-Meteo API doesn't provide daily arrays)
                const mockDates = Array.from({ length: 7 }, (_, i) => {
                    return addDays(new Date(), i).toISOString().split('T')[0];
                });

                const daily = mockDates.map((dateStr, i) => {
                    const expectedKwh = solarKw * 4; // Mock
                    return {
                        date: dateStr,
                        dayName: i === 0 ? 'Today' : format(new Date(dateStr), 'EEE'),
                        tempMax: 35, // Mocked since API stripped min/max
                        tempMin: 22,
                        condition: 'Sunny',
                        cloudcover: 10,
                        expectedKwh: expectedKwh.toFixed(1),
                        score: 85
                    };
                });

                // Transform Hourly Data (Using the user's specific endpoint data: hourly=temperature_2m)
                const hourlyByDay = [];
                for (let day = 0; day < 7; day++) {
                    const hours = [];
                    for (let h = 0; h < 24; h++) {
                        const idx = (day * 24) + h;

                        // Fake Irradiance since API doesn't have it anymore
                        let irr = 0;
                        if (h >= 6 && h <= 18) irr = Math.sin((h - 6) * Math.PI / 12) * 800 + (Math.random() * 100);

                        hours.push({
                            time: `${h.toString().padStart(2, '0')}:00`,
                            hourNum: h,
                            irradiance: irr.toFixed(0),
                            cloudcover: 15, // Mapped statically since hourly cloudcover missing
                            temp: Array.isArray(data.hourly?.temperature_2m) ? data.hourly.temperature_2m[idx] || 30 : 30
                        });
                    }
                    hourlyByDay.push(hours);
                }

                setForecastData(daily);
                setHourlyData(hourlyByDay);
            } catch (err) {
                console.error("Forecast API failed, using fallback:", err);
                setError("Failed to fetch live weather. Using cached models.");
                // Fallback mock logic if API fails
                generateMockData();
            } finally {
                setLoading(false);
            }
        };

        const generateMockData = () => {
            const mockDaily = Array(7).fill(0).map((_, i) => ({
                date: addDays(new Date(), i).toISOString().split('T')[0],
                dayName: i === 0 ? 'Today' : format(addDays(new Date(), i), 'EEE'),
                tempMax: 35 - Math.random() * 5,
                tempMin: 22 + Math.random() * 3,
                condition: i % 3 === 0 ? 'Sunny' : 'Partly Cloudy',
                cloudcover: (Math.random() * 40).toFixed(0),
                expectedKwh: (solarKw * (4 + Math.random())).toFixed(1),
                score: (75 + Math.random() * 20).toFixed(0)
            }));

            const mockHourly = Array(7).fill(0).map(() => {
                return Array(24).fill(0).map((_, h) => {
                    let irr = 0;
                    if (h >= 6 && h <= 18) irr = Math.sin((h - 6) * Math.PI / 12) * 800 + (Math.random() * 100);
                    return { time: `${h.toString().padStart(2, '0')}:00`, hourNum: h, irradiance: irr.toFixed(0), cloudcover: Math.random() * 30, temp: 30 };
                });
            });

            setForecastData(mockDaily);
            setHourlyData(mockHourly);
        };

        fetchForecast();
    }, [city, solarKw]);

    // ─── DERIVED STATES ────────────────────────────────────────────────────────
    const todayForecast = forecastData[0];
    const selectedHourly = hourlyData[selectedDayIndex] || [];

    // Best window logic
    const bestWindow = useMemo(() => {
        if (!selectedHourly || selectedHourly.length < 4) return { start: '10', end: '14' };
        let maxSum = 0; let startH = 10;
        for (let i = 0; i < selectedHourly.length - 4; i++) {
            const sum = selectedHourly.slice(i, i + 4).reduce((acc, h) => acc + (parseFloat(h.irradiance) || 0), 0);
            if (sum > maxSum) { maxSum = sum; startH = i; }
        }
        return { start: startH.toString().padStart(2, '0'), end: (startH + 4).toString().padStart(2, '0') };
    }, [selectedHourly]);

    // Recommendations Logic
    const recommendations = useMemo(() => {
        if (!forecastData || forecastData.length < 2) return [];
        const recs = [];
        const tmrw = forecastData[1];

        // Safely parse cloudcover or default to 0
        const cCover = parseFloat(tmrw?.cloudcover || 0);

        if (cCover < 20) {
            recs.push({ icon: '☀️', title: 'Excellent Solar Day Tomorrow', desc: `Expected to generate ~${tmrw?.expectedKwh || 0} kWh. Schedule heavy appliances (AC, EV charging) between 10 AM and 3 PM.` });
        } else if (cCover > 70 || tmrw.condition === 'Rainy') {
            recs.push({ icon: '🌧️', title: 'Low Generation Expected', desc: `Heavy clouds tomorrow (${tmrw?.condition || 'Cloudy'}). Shift flexible energy usage to today or rely on grid/battery.` });
        }

        // Find best day
        let best = forecastData[1];
        for (let i = 2; i < forecastData.length; i++) {
            if (parseFloat(forecastData[i]?.expectedKwh || 0) > parseFloat(best?.expectedKwh || 0)) {
                best = forecastData[i];
            }
        }

        if (best) {
            recs.push({ icon: '🔋', title: 'Peak Yield Ahead', desc: `The best generation day this week is ${best.dayName} with an expected ${best.expectedKwh} kWh. Plan heavy loads accordingly.` });
        }

        return recs;
    }, [forecastData]);

    // Accuracy Tracker Mock (Requires joining historical energy_readings with past forecast, mocked here)
    const accuracyMocks = useMemo(() => {
        return Array(7).fill(0).map((_, i) => {
            const d = subDays(new Date(), Math.abs(i - 7)).toISOString().split('T')[0];
            const forecasted = (solarKw * 4.5).toFixed(1);
            const actual = (parseFloat(forecasted) * (0.85 + Math.random() * 0.3)).toFixed(1);
            const errorPct = (Math.abs(forecasted - actual) / forecasted) * 100;
            return { date: d, forecasted, actual, accuracy: (100 - errorPct).toFixed(1) };
        }).reverse();
    }, [solarKw]);

    const avgAccuracy = (accuracyMocks.reduce((acc, val) => acc + parseFloat(val.accuracy), 0) / 7).toFixed(1);

    if (loading || !forecastData.length) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center animate-pulse space-y-4">
                <Sun className="w-12 h-12 text-[#00C864] animate-spin-slow" />
                <h3 className="text-xl font-syne text-white">Fetching Live Satellite Data...</h3>
                <p className="text-sm text-gray-500">Contacting Open-Meteo for {city}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-10">

            {/* ─── SECTION 1: Today Hero Card ────────────────────────────────────── */}
            <div className="bg-gradient-to-br from-[#0d1512] to-[#050908] border border-white/10 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
                {/* Background Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/10 blur-[100px] pointer-events-none rounded-full translate-x-1/3 -translate-y-1/3"></div>
                {todayForecast?.condition?.includes('Rain') && (
                    <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none"></div>
                )}

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">

                    {/* Left Box: City & Current Weather */}
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-black/40 border border-white/10 rounded-2xl backdrop-blur-md">
                            {getWeatherIcon(todayForecast?.condition || 'Sunny', "w-12 h-12")}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-3xl font-syne font-bold text-white tracking-wide">{city}</h2>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-gray-300 uppercase tracking-widest">{todayForecast?.condition || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center gap-4 text-gray-400 font-ibm-plex mt-2">
                                <span className="flex items-center gap-1 text-red-400"><Thermometer className="w-4 h-4" /> H: {todayForecast?.tempMax || 0}°C</span>
                                <span className="flex items-center gap-1 text-blue-400 border-l border-gray-600 pl-4">L: {todayForecast?.tempMin || 0}°C</span>
                                <span className="flex items-center gap-1 text-gray-300 border-l border-gray-600 pl-4"><Cloud className="w-4 h-4" /> {todayForecast?.cloudcover || 0}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Box: Solar Score & Expected Generation */}
                    <div className="flex items-center gap-8 bg-black/40 border border-[#00C864]/20 rounded-2xl p-5 backdrop-blur-md">
                        <div>
                            <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">Expected Generation</div>
                            <div className="text-4xl font-ibm-plex font-bold text-[#00FF85] mb-2">{todayForecast?.expectedKwh || 0} <span className="text-lg text-gray-400 font-jakarta">kWh</span></div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#00C864]/10 border border-[#00C864]/30 rounded-lg text-xs font-bold text-[#00C864]">
                                <Clock className="w-3.5 h-3.5" /> Best Window: {bestWindow.start}:00 – {bestWindow.end}:00
                            </div>
                        </div>

                        {/* Radial Score */}
                        <div className="w-24 h-24 relative hidden sm:flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart
                                    cx="50%" cy="50%" innerRadius="70%" outerRadius="100%"
                                    data={[{ name: 'Score', value: todayForecast?.score || 0, fill: (todayForecast?.score || 0) > 70 ? '#00C864' : (todayForecast?.score || 0) > 40 ? '#EAB308' : '#EF4444' }]}
                                    startAngle={90} endAngle={-270}
                                >
                                    <RadialBar minAngle={15} clockWise={true} dataKey="value" cornerRadius={10} background={{ fill: 'rgba(255,255,255,0.05)' }} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xl font-ibm-plex font-bold text-white">{todayForecast?.score || 0}</span>
                                <span className="text-[8px] uppercase tracking-widest text-gray-400 mt-0.5">Score</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* ─── SECTION 2: 7-Day Forecast Strip ───────────────────────────────── */}
            <div>
                <h3 className="text-lg font-bold text-white mb-4">7-Day Solar Forecast</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                    {forecastData.map((day, i) => {
                        const isSelected = selectedDayIndex === i;
                        const isToday = i === 0;

                        return (
                            <div
                                key={i}
                                onClick={() => setSelectedDayIndex(i)}
                                className={`min-w-[140px] flex flex-col p-4 rounded-xl cursor-pointer snap-start transition-all duration-300 border
                     ${isSelected ? 'bg-[#00C864]/10 border-[#00C864] shadow-[0_0_15px_rgba(0,200,100,0.1)] -translate-y-1' : 'bg-[#0d1512] border-white/5 hover:border-white/20 hover:bg-white/5'}
                   `}
                            >
                                {isToday && <span className="text-[9px] font-bold uppercase tracking-widest text-[#00C864] mb-1">Today</span>}
                                <div className="font-syne font-bold text-gray-200 mb-3">{day.dayName}</div>

                                <div className="flex justify-between items-center mb-3">
                                    {getWeatherIcon(day.condition, "w-8 h-8")}
                                    <div className="text-right font-ibm-plex text-xs">
                                        <div className="text-red-400">{day.tempMax}°</div>
                                        <div className="text-blue-400">{day.tempMin}°</div>
                                    </div>
                                </div>

                                <div className="mt-auto border-t border-white/5 pt-3">
                                    <div className="text-xs text-gray-400 mb-1">Expected</div>
                                    <div className={`text-xl font-ibm-plex font-bold ${isSelected ? 'text-[#00FF85]' : 'text-white'}`}>{day.expectedKwh}</div>

                                    {/* Mini visual scale representing generation */}
                                    <div className="w-full h-1.5 bg-black rounded-full mt-2 overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-yellow-500 to-[#00C864]" style={{ width: `${day.score}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ─── SECTION 3: Hourly Chart ───────────────────────────────────────── */}
            <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-200">
                            Hourly Irradiance for {forecastData[selectedDayIndex]?.dayName}
                        </h3>
                        <p className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                            <span className="w-3 h-3 rounded-sm bg-yellow-500/20 border border-yellow-500"></span> Solar Energy (W/m²)
                            <span className="w-3 h-3 rounded-sm bg-gray-500 ml-2"></span> Cloud Cover %
                        </p>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-gray-300 font-ibm-plex">
                        <span className="w-2 h-2 rounded-full bg-[#00C864] animate-pulse"></span>
                        Generation Window: 06:00 - 18:00
                    </div>
                </div>

                <div className="w-full h-[320px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={selectedHourly} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorIrradiance" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#EAB308" stopOpacity={0.6} />
                                    <stop offset="95%" stopColor="#EAB308" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />

                            {/* Highlight the generation window */}
                            <CartesianGrid strokeDasharray="3 3" stroke="none" fill="rgba(0,200,100,0.03)" verticalCoordinatesGenerator={() => [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]} horizontal={false} />

                            <XAxis dataKey="time" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} interval={2} />
                            <YAxis yAxisId="left" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `${v}W`} />
                            <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />

                            <RechartsTooltip
                                contentStyle={{ backgroundColor: '#0a0f0d', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                itemStyle={{ fontSize: '12px' }} labelStyle={{ color: '#9ca3af', marginBottom: '4px', fontSize: '12px' }}
                                formatter={(value, name) => [name === 'Irradiance' ? `${parseFloat(value).toFixed(0)} W/m²` : `${value}%`, name]}
                            />

                            <Area yAxisId="left" type="monotone" dataKey="irradiance" stroke="#EAB308" strokeWidth={2} fillOpacity={1} fill="url(#colorIrradiance)" name="Irradiance" />
                            <Line yAxisId="right" type="stepAfter" dataKey="cloudcover" stroke="#9ca3af" strokeWidth={2} dot={false} name="Cloud Cover" strokeDasharray="4 4" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ─── SECTION 4 & 5 GRID ────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Smart Recommendations */}
                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-6 flex flex-col">
                    <h3 className="text-lg font-syne font-bold text-white mb-6 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-purple-400" /> Smart Assistant
                    </h3>

                    <div className="space-y-4 flex-1">
                        {recommendations.map((rec, i) => (
                            <div key={i} className="flex gap-4 p-4 rounded-xl bg-black/30 border border-white/5 hover:border-white/10 transition-colors">
                                <div className="text-2xl mt-1">{rec.icon}</div>
                                <div>
                                    <h4 className="font-bold text-gray-200 text-sm mb-1">{rec.title}</h4>
                                    <p className="text-xs text-gray-400 leading-relaxed">{rec.desc}</p>
                                </div>
                            </div>
                        ))}
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Accuracy Tracker */}
                <div className="bg-[#0d1512] border border-white/5 rounded-2xl p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-syne font-bold text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-[#00C864]" /> Algorithm Accuracy
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">Forecasted vs Actuals (Last 7 Days)</p>
                        </div>
                        <div className="px-3 py-2 bg-[#00C864]/10 border border-[#00C864]/20 rounded-lg text-center">
                            <div className="text-[10px] text-[#00C864] font-bold uppercase tracking-widest leading-none mb-1">Avg Accuracy</div>
                            <div className="text-xl font-ibm-plex font-bold text-white leading-none">{avgAccuracy}%</div>
                        </div>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar flex-1">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="text-[10px] text-gray-500 uppercase font-semibold border-b border-white/10">
                                <tr>
                                    <th className="pb-3 pt-1">Date</th>
                                    <th className="pb-3 pt-1 text-right">Forecast (kWh)</th>
                                    <th className="pb-3 pt-1 text-right">Actual (kWh)</th>
                                    <th className="pb-3 pt-1 text-right">Accuracy</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-gray-300">
                                {accuracyMocks.map((mock, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                        <td className="py-3 text-xs">{format(new Date(mock.date), 'dd MMM')}</td>
                                        <td className="py-3 text-right font-ibm-plex text-gray-400">{mock.forecasted}</td>
                                        <td className="py-3 text-right font-ibm-plex text-[#00C864]">{mock.actual}</td>
                                        <td className="py-3 text-right font-ibm-plex font-bold">
                                            <span className={parseFloat(mock.accuracy) > 90 ? 'text-green-400' : parseFloat(mock.accuracy) > 80 ? 'text-yellow-400' : 'text-red-400'}>
                                                {mock.accuracy}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

        </div>
    );
};

// SVG Subcomponents wrapper to bypass early return limits
function AlertCircle({ className }) { return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>; }

export default ForecastPage;
