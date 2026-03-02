import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
    Search, ShieldAlert, Cpu, CheckCircle2, AlertTriangle,
    Settings, Download, Activity, RefreshCw, Zap
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { appendToCSV } from '../../services/csvService';
import jsPDF from 'jspdf';
import { groqChat } from '../../services/groqService';

const AIAnomalyPage = () => {
    const { currentUser, csvData, refreshData } = useApp();
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [lastScanTime, setLastScanTime] = useState(localStorage.getItem(`eco_anomaly_time_${currentUser.id}`) || null);
    const [errorText, setErrorText] = useState(null);

    useEffect(() => {
        try { const cached = localStorage.getItem(`eco_anomaly_data_${currentUser.id}`); if (cached) setScanResult(JSON.parse(cached)); } catch (e) { }
    }, []);

    const getSeverityIcon = (level) => {
        switch (level?.toLowerCase()) {
            case 'high': return <ShieldAlert className="w-5 h-5 text-red-500" />;
            case 'medium': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            default: return <Settings className="w-5 h-5 text-blue-500" />;
        }
    };
    const getSeverityColor = (level) => {
        switch (level?.toLowerCase()) {
            case 'high': return 'bg-red-500/10 border-red-500/30 text-red-400';
            case 'medium': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500';
            default: return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
        }
    };

    const getThirtyDayStats = () => {
        const thirtyDaysAgo = subDays(new Date(), 30);
        const recentReadings = csvData.energyReadings.filter(r => r.userId === currentUser.id && new Date(r.date) >= thirtyDaysAgo);
        const dailySums = {};
        recentReadings.forEach(r => {
            const dateKey = r.date.split('T')[0];
            if (!dailySums[dateKey]) dailySums[dateKey] = { solar: 0, consumption: 0, voltages: [] };
            dailySums[dateKey].solar += parseFloat(r.solarGen || 0);
            dailySums[dateKey].consumption += parseFloat(r.consumption || 0);
            dailySums[dateKey].voltages.push(parseFloat(r.voltage || 230));
        });
        const days = Object.entries(dailySums).sort((a, b) => new Date(a[0]) - new Date(b[0])).map(([date, vals]) => ({
            date, solar: vals.solar.toFixed(2), consumption: vals.consumption.toFixed(2),
            avgVoltage: (vals.voltages.reduce((a, b) => a + b, 0) / vals.voltages.length).toFixed(1)
        }));
        const avgSolar = days.length ? (days.reduce((s, d) => s + parseFloat(d.solar), 0) / days.length).toFixed(2) : 0;
        const avgConsumption = days.length ? (days.reduce((s, d) => s + parseFloat(d.consumption), 0) / days.length).toFixed(2) : 0;
        return { days, avgSolar, avgConsumption };
    };

    const runScan = async () => {
        try {
            setIsScanning(true); setErrorText(null);
            const { days, avgSolar, avgConsumption } = getThirtyDayStats();
            if (days.length === 0) throw new Error("Not enough data. Needs at least 1 day of readings.");
            const daysPayload = days.map(d => `${d.date}: So=${d.solar}, Co=${d.consumption}, V=${d.avgVoltage}`).join('\n');

            const systemPrompt = `You are a diagnostic AI for EcoPower (a solar platform in Gujarat, India). 
Analyze this 30-day device energy telemetry and identify logical anomalies (e.g., sudden generation drops, strange grid consumption spikes, erratic voltage suggesting grid instability, or inverter faults).

User Profile: ${currentUser.name}, Plan: ${currentUser.plan} (${currentUser.solarKw}kW solar panel capacity)
Location: ${currentUser.city || 'Gujarat'}, India

30-DAY STATISTICAL AVERAGES: 
Daily Solar Generated: ${avgSolar} kWh
Daily Consumption: ${avgConsumption} kWh

DAILY REPORT DATA (Last 30 Days):
[Format = Date: Solar(kWh), Consumption(kWh), Voltage]
${daysPayload}

You must return ONLY a raw JSON object. The structure must exactly match:
{
  "anomalies": [
    {
      "type": "string describing issue",
      "severity": "High" | "Medium" | "Low",
      "date": "YYYY-MM-DD",
      "description": "2 sentence clear explanation",
      "possibleCause": "1 short sentence hypothesis",
      "recommendation": "1 actionable step for user"
    }
  ],
  "overallHealth": "Excellent" | "Good" | "Fair" | "Poor",
  "healthScore": integer from 0 to 100,
  "summary": "2 sentence high level scan summary"
}
If no anomalies are found, return an empty array for 'anomalies', healthScore = 100, and overallHealth = "Excellent".`;

            const aiText = await groqChat({
                systemPrompt,
                messages: [{ role: 'user', content: 'Analyze the telemetry data and return raw JSON strictly.' }],
                maxTokens: 1500,
                jsonMode: true
            });

            let cleaned = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedResult = JSON.parse(cleaned);
            setScanResult(parsedResult);
            const timeStr = format(new Date(), 'dd MMM yyyy, HH:mm');
            setLastScanTime(timeStr);
            localStorage.setItem(`eco_anomaly_time_${currentUser.id}`, timeStr);
            localStorage.setItem(`eco_anomaly_data_${currentUser.id}`, JSON.stringify(parsedResult));
            window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Deep scan completed successfully.', type: 'success' } }));
        } catch (err) {
            console.error(err);
            if (err.message === 'AUTH_FAILED') { setErrorText("Invalid API key. Contact administrator."); }
            else if (err.message === 'GROQ_KEY_MISSING') { setErrorText("Groq API key not configured."); }
            else if (err instanceof SyntaxError) { setErrorText("AI response format invalid. Try again."); }
            else { setErrorText(err.message || "Failed to scan. Try again."); }
        } finally { setIsScanning(false); }
    };

    const handleCreateTicket = async (anomaly) => {
        const newId = `#TKT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        let mappedType = "Other";
        if (anomaly.type.toLowerCase().includes('voltage')) mappedType = "Low Voltage";
        else if (anomaly.type.toLowerCase().includes('inverter') || anomaly.type.toLowerCase().includes('solar')) mappedType = "Inverter Problem";
        const newTicket = { id: newId, userId: currentUser.id, ticketNo: newId, title: `AI Alert: ${anomaly.type}`, description: `Auto-generated from Anomaly Scan.\n\nDate: ${anomaly.date}\nIssue: ${anomaly.description}\nCause: ${anomaly.possibleCause}`, issueType: mappedType, priority: anomaly.severity === 'High' ? 'High' : 'Medium', status: 'Open', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        try { await appendToCSV('tickets.csv', newTicket); refreshData(); window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: `Ticket ${newId} raised!`, type: 'success' } })); }
        catch { window.dispatchEvent(new CustomEvent('eco-toast', { detail: { message: 'Failed to create ticket.', type: 'error' } })); }
    };

    const downloadReport = () => {
        if (!scanResult) return;
        const doc = new jsPDF();
        doc.setFillColor(5, 9, 8); doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(0, 200, 100); doc.setFontSize(22); doc.text('EcoPower AI', 14, 25);
        doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.text('System Diagnostic Report', 14, 32);
        doc.setTextColor(0, 0, 0); doc.setFontSize(14); doc.text(`Health Score: ${scanResult.healthScore}/100 (${scanResult.overallHealth})`, 14, 50);
        doc.setFontSize(10); doc.text(doc.splitTextToSize(`Summary: ${scanResult.summary}`, 180), 14, 60);
        let y = 80;
        if (scanResult.anomalies?.length > 0) {
            doc.setFontSize(14); doc.text('Detected Anomalies:', 14, y); y += 10;
            scanResult.anomalies.forEach((a, i) => { doc.setFontSize(11); doc.text(`${i + 1}. [${a.severity.toUpperCase()}] ${a.type} (${a.date})`, 14, y); y += 8; doc.setFontSize(9); doc.setTextColor(80, 80, 80); doc.text(doc.splitTextToSize(`Detail: ${a.description}`, 175), 18, y); y += 12; doc.text(doc.splitTextToSize(`Recommendation: ${a.recommendation}`, 175), 18, y); y += 15; doc.setTextColor(0, 0, 0); });
        } else { doc.setFontSize(12); doc.setTextColor(0, 200, 100); doc.text('No anomalies detected. System is healthy.', 14, y); }
        doc.save(`EcoPower_Diagnostic_${Date.now()}.pdf`);
    };

    const healthColor = scanResult?.healthScore >= 80 ? 'text-[#00C864]' : scanResult?.healthScore >= 60 ? 'text-yellow-500' : 'text-red-500';
    const dashArray = scanResult ? `${(scanResult.healthScore / 100) * 283} 283` : "0 283";

    return (
        <div className="space-y-8 animate-fade-in pb-10 max-w-7xl mx-auto relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[#0d1512] border border-white/5 p-6 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00C864]/5 blur-[80px] rounded-full pointer-events-none"></div>
                <div className="relative z-10">
                    <h2 className="text-2xl font-syne font-bold text-white mb-2 flex items-center gap-3"><Search className="w-6 h-6 text-[#00C864]" /> AI Anomaly Detector</h2>
                    <p className="text-sm text-gray-400 mb-4">Scans 30-day telemetry for voltage dips, inverter loss, and excess grid pull. Powered by Groq · Llama 3.3 70B.</p>
                    <div className="flex items-center gap-4 text-xs">
                        <span className="px-3 py-1 bg-black/50 border border-white/10 rounded-full text-gray-400 flex items-center gap-2"><Activity className="w-3 h-3" /> Last scan: {lastScanTime || 'Never'}</span>
                        {scanResult?.anomalies && (<span className={`px-3 py-1 border rounded-full font-bold flex items-center gap-2 ${scanResult.anomalies.length > 0 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-[#00C864]/10 border-[#00C864]/30 text-[#00C864]'}`}>{scanResult.anomalies.length > 0 ? <ShieldAlert className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}{scanResult.anomalies.length} Anomalies found</span>)}
                    </div>
                </div>
                <div className="relative z-10 flex gap-3 w-full md:w-auto">
                    {scanResult && (<button onClick={downloadReport} className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold rounded-xl transition-all shadow-lg flex flex-1 md:flex-none justify-center items-center gap-2"><Download className="w-4 h-4" /> <span className="hidden sm:inline">Export</span></button>)}
                    <button onClick={runScan} disabled={isScanning} className="px-6 py-3 bg-gradient-to-r from-[#00C864] to-[#00A050] hover:from-[#00FF85] hover:to-[#00C864] text-black text-sm font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(0,200,100,0.2)] flex flex-1 md:flex-none justify-center items-center gap-2 disabled:opacity-50">
                        {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        {isScanning ? 'Deep Scanning...' : (scanResult ? 'Rescan Now' : 'Run First Scan')}
                    </button>
                </div>
                {errorText && <div className="absolute bottom-4 left-6 right-6 p-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg text-center">{errorText}</div>}
            </div>

            {isScanning ? (
                <div className="flex flex-col items-center justify-center p-20 border border-white/5 rounded-3xl bg-[#0d1512] min-h-[400px]">
                    <Cpu className="w-16 h-16 text-[#00C864] mb-6 animate-pulse" />
                    <h3 className="text-xl font-syne font-bold text-white mb-2">Analyzing 30-Day Vectors...</h3>
                    <p className="text-sm text-gray-400">Groq AI is extracting voltage variations and grid-sync correlations.</p>
                </div>
            ) : scanResult ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in items-start">
                    <div className="lg:col-span-4 bg-[#0d1512] border border-white/5 rounded-3xl p-6 lg:p-8 flex flex-col items-center justify-center text-center">
                        <h3 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-8">System Health</h3>
                        <div className="relative w-48 h-48 mb-6">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className={`${healthColor} transition-all duration-1000 ease-out`} strokeDasharray={dashArray} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-4xl font-ibm-plex font-bold ${healthColor}`}>{scanResult.healthScore}</span>
                                <span className={`text-xs font-bold uppercase tracking-widest mt-1 ${healthColor}`}>{scanResult.overallHealth}</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed bg-black/20 p-4 rounded-2xl border border-white/5">{scanResult.summary}</p>
                    </div>
                    <div className="lg:col-span-8 flex flex-col gap-4">
                        {scanResult.anomalies?.length === 0 ? (
                            <div className="bg-[#00C864]/5 border border-[#00C864]/20 rounded-3xl p-10 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                                <div className="w-20 h-20 rounded-full bg-[#00C864]/10 flex items-center justify-center mb-6"><CheckCircle2 className="w-10 h-10 text-[#00C864]" /></div>
                                <h3 className="text-2xl font-syne font-bold text-white mb-3">System looks healthy!</h3>
                                <p className="text-sm text-gray-400 max-w-sm">AI found zero anomalies in your last 30 days of data. Your system is highly efficient.</p>
                            </div>
                        ) : scanResult.anomalies.map((anomaly, idx) => (
                            <div key={idx} className="bg-[#0d1512] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${anomaly.severity === 'High' ? 'bg-red-500' : anomaly.severity === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                                <div className="flex flex-wrap md:flex-nowrap justify-between items-start gap-4 mb-4 pl-3">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">{getSeverityIcon(anomaly.severity)}<h4 className="text-base font-bold text-white capitalize">{anomaly.type.replace(/_/g, ' ')}</h4></div>
                                        <span className="text-xs text-gray-500 font-ibm-plex">Detected on: {format(new Date(anomaly.date), 'dd MMM yyyy')}</span>
                                    </div>
                                    <div className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-widest border ${getSeverityColor(anomaly.severity)}`}>{anomaly.severity} Priority</div>
                                </div>
                                <div className="pl-3 space-y-4">
                                    <p className="text-sm text-gray-200 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5 shadow-inner">{anomaly.description}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl"><span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest block mb-1">AI Hypothesis</span><span className="text-sm text-gray-300">{anomaly.possibleCause}</span></div>
                                        <div className="p-3 bg-[#00C864]/5 border border-[#00C864]/20 rounded-xl"><span className="text-[10px] uppercase font-bold text-[#00C864]/70 tracking-widest block mb-1 flex items-center gap-1">💡 Recommended Action</span><span className="text-sm text-gray-300">{anomaly.recommendation}</span></div>
                                    </div>
                                </div>
                                {anomaly.severity === 'High' && (
                                    <div className="mt-5 pl-3 pt-5 border-t border-white/5">
                                        <button onClick={() => handleCreateTicket(anomaly)} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-lg transition-colors flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Escalate & Create Support Ticket</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-20 border border-white/5 rounded-3xl bg-[#0d1512] min-h-[400px] opacity-50">
                    <Search className="w-16 h-16 text-gray-600 mb-6" />
                    <h3 className="text-lg font-syne font-bold text-gray-400 mb-2">No active scan results</h3>
                    <p className="text-sm text-gray-500">Run a deep scan to discover hidden patterns in your telemetry.</p>
                </div>
            )}
        </div>
    );
};

export default AIAnomalyPage;
