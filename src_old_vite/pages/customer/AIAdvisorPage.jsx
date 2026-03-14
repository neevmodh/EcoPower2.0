import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
    Zap, Send, Bot, User, AlertTriangle,
    RefreshCw, MessageSquarePlus
} from 'lucide-react';
import { format } from 'date-fns';
import { groqChat } from '../../services/groqService';

const SUGGESTED_PROMPTS = [
    { icon: '☀️', text: "Why is my bill higher this month?" },
    { icon: '⚡', text: "When to run AC for max solar savings?" },
    { icon: '🌿', text: "How much CO₂ have I saved this year?" },
    { icon: '📊', text: "Analyze my energy usage pattern" },
    { icon: '💡', text: "Tips to cut my grid import charges" },
    { icon: '🔮', text: "Predict my next bill amount" }
];

const AIAdvisorPage = () => {
    const { currentUser, csvData } = useApp();

    const [conversations, setConversations] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);

    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [errorText, setErrorText] = useState(null);
    const [countdown, setCountdown] = useState(0);

    const messagesEndRef = useRef(null);

    // Initialize from Session Storage
    useEffect(() => {
        try {
            const saved = sessionStorage.getItem(`eco_chats_${currentUser.id}`);
            if (saved) {
                const parsed = JSON.parse(saved);
                setConversations(parsed);
                if (parsed.length > 0) setActiveChatId(parsed[0].id);
                else createNewChat();
            } else {
                createNewChat();
            }
        } catch (e) {
            createNewChat();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser.id]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [conversations, isTyping]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Generators / Handlers
    const createNewChat = () => {
        const newChat = {
            id: `CHAT_${Date.now()}`,
            updatedAt: new Date().toISOString(),
            messages: [{ role: 'assistant', content: `Hi ${currentUser.name}! I'm your EcoPower AI Advisor. I have analyzed your recent solar generation grids and smart device states. How can I help optimize your energy today?`, timestamp: new Date().toISOString() }]
        };
        setConversations(prev => {
            const updated = [newChat, ...prev];
            sessionStorage.setItem(`eco_chats_${currentUser.id}`, JSON.stringify(updated));
            return updated;
        });
        setActiveChatId(newChat.id);
    };

    const getActiveData = () => {
        const readings = csvData.energyReadings.filter(r => r.userId === currentUser.id).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-168);
        const invoices = csvData.invoices.filter(i => i.userId === currentUser.id).sort((a, b) => new Date(b.date) - new Date(a.date));
        const latestInvoice = invoices[0];
        const userDevices = csvData.devices.filter(d => d.userId === currentUser.id);
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const todayReadings = readings.filter(r => r.date.startsWith(todayStr));

        const todaySolar = todayReadings.reduce((s, r) => s + parseFloat(r.solarGen || 0), 0).toFixed(1);
        const todayConsumption = todayReadings.reduce((s, r) => s + parseFloat(r.consumption || 0), 0).toFixed(1);

        const tGen = readings.reduce((s, r) => s + parseFloat(r.solarGen || 0), 0).toFixed(1);
        const tCons = readings.reduce((s, r) => s + parseFloat(r.consumption || 0), 0).toFixed(1);
        const tImp = readings.reduce((s, r) => s + parseFloat(r.gridImport || 0), 0).toFixed(1);
        const tExp = readings.reduce((s, r) => s + parseFloat(r.gridExport || 0), 0).toFixed(1);

        return { readings, latestInvoice, userDevices, todaySolar, todayConsumption, tGen, tCons, tImp, tExp };
    };

    const activeChat = conversations.find(c => c.id === activeChatId) || { messages: [] };

    const handleSendMessage = async (textOverride) => {
        const text = textOverride || inputMessage;
        if (!text.trim() || isTyping) return;

        setInputMessage('');
        setErrorText(null);

        // 1. Optimistic Update UI (User Message)
        const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };

        let updatedChat = { ...activeChat, updatedAt: new Date().toISOString(), messages: [...activeChat.messages, userMsg] };

        setConversations(prev => {
            const next = prev.map(c => c.id === updatedChat.id ? updatedChat : c);
            sessionStorage.setItem(`eco_chats_${currentUser.id}`, JSON.stringify(next));
            return next;
        });

        setIsTyping(true);

        // 2. Build Context Profile
        const d = getActiveData();
        const systemPrompt = `You are EcoPower's AI Energy Advisor — a friendly, expert energy consultant for India's solar subscription platform. You analyze real user data and give personalized, actionable advice.

USER PROFILE:
Name: ${currentUser.name}
Location: ${currentUser.city || 'Gujarat'}, India
Plan: ${currentUser.plan} (${currentUser.solarKw}kW solar, ${currentUser.batteryKwh || 0}kWh battery)

TODAY'S PERFORMANCE:
Solar Generated: ${d.todaySolar} kWh
Total Consumed: ${d.todayConsumption} kWh
Self-Sufficiency: ${d.todaySolar > 0 ? ((d.todaySolar / d.todayConsumption) * 100).toFixed(0) : 0}%

LAST 7-DAY TOTALS:
Total Solar: ${d.tGen} kWh
Total Consumed: ${d.tCons} kWh
Total Grid Import: ${d.tImp} kWh
Total Grid Export: ${d.tExp} kWh

LATEST BILL:
Period: ${d.latestInvoice?.period || 'N/A'}
Amount: ₹${d.latestInvoice?.totalAmount || 0} (${d.latestInvoice?.status || 'N/A'})

CONNECTED DEVICES:
${d.userDevices.map(dv => '- ' + dv.name + ' (' + dv.powerWatts + 'W, currently ' + dv.status + ') | Auto: ' + dv.scheduleOn + '-' + dv.scheduleOff).join('\n')}

RULES:
- Respond in under 120 words. Be remarkably concise.
- Use Indian context (₹, kWh, Gujarat, DISCOM, MSEDCL).
- Give specific advice strictly based on their ACTUAL data above.
- Be warm, encouraging, practical.
- Use bullet points for action items where applicable.
- If asked to predict bill: calculate from recent usage patterns provided (Import*8 - Export*5).`;

        // 3. API Call via Groq
        try {
            // Convert chat messages to OpenAI format
            const apiMessages = updatedChat.messages.map(m => ({
                role: m.role === 'system_error' ? 'assistant' : m.role,
                content: m.content
            }));

            const aiText = await groqChat({
                systemPrompt,
                messages: apiMessages,
                maxTokens: 300
            });

            // 4. Update UI with AI Response
            const aiMsg = { role: 'assistant', content: aiText, timestamp: new Date().toISOString() };
            updatedChat = { ...updatedChat, messages: [...updatedChat.messages, aiMsg], updatedAt: new Date().toISOString() };

            setConversations(prev => {
                const next = prev.map(c => c.id === updatedChat.id ? updatedChat : c);
                sessionStorage.setItem(`eco_chats_${currentUser.id}`, JSON.stringify(next));
                return next;
            });

        } catch (err) {
            let msg = "AI temporarily unavailable. Please try again later.";
            if (err.message === 'AUTH_FAILED') {
                msg = "Invalid API key. Please contact support.";
            } else if (err.message === 'RATE_LIMIT') {
                msg = "Rate limit reached. Please wait 30 seconds.";
                setCountdown(30);
            } else if (err.message === 'Failed to fetch') {
                msg = "Network connection failed. Check your internet.";
            } else if (err.message === 'GROQ_KEY_MISSING') {
                msg = "Groq API key not configured. Contact administrator.";
            } else {
                msg = err.message || msg;
            }
            setErrorText(msg);

            // System error message inject
            const errorMsg = { role: 'system_error', content: msg, timestamp: new Date().toISOString() };
            updatedChat = { ...updatedChat, messages: [...updatedChat.messages, errorMsg] };
            setConversations(prev => prev.map(c => c.id === updatedChat.id ? updatedChat : c));
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6 animate-fade-in relative max-w-7xl mx-auto">

            {/* ─── LEFT PANEL: HISTORY ──────────────────────────────────────────── */}
            <div className="w-full md:w-[280px] bg-[#0d1512] border border-white/5 rounded-2xl flex flex-col overflow-hidden shrink-0">
                <div className="p-4 border-b border-white/5 bg-black/20">
                    <button onClick={createNewChat} className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-colors flex items-center justify-center gap-2">
                        <MessageSquarePlus className="w-4 h-4" /> New Chat
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {conversations.length === 0 && <div className="text-center text-xs text-gray-500 mt-10">No recent conversations</div>}
                    {conversations.map(chat => {
                        const firstUser = chat.messages.find(m => m.role === 'user');
                        const title = firstUser ? firstUser.content.substring(0, 30) + (firstUser.content.length > 30 ? '...' : '') : 'New Session';
                        const isActive = chat.id === activeChatId;

                        return (
                            <button
                                key={chat.id} onClick={() => setActiveChatId(chat.id)}
                                className={`w-full text-left p-3 rounded-xl transition-all ${isActive ? 'bg-[#00C864]/10 border border-[#00C864]/30 shadow-inner' : 'hover:bg-white/5 border border-transparent'}`}
                            >
                                <div className={`text-sm font-semibold truncate ${isActive ? 'text-[#00FF85]' : 'text-gray-300'}`}>{title}</div>
                                <div className="text-[10px] text-gray-500 mt-1">{format(new Date(chat.updatedAt), 'MMM dd • HH:mm')}</div>
                            </button>
                        )
                    })}
                </div>

                <div className="p-4 border-t border-white/5 bg-black/20 text-xs flex justify-between items-center">
                    <span className="text-gray-500 flex items-center gap-2"><Zap className="w-3 h-3" /> Groq AI</span>
                    <span className="w-2 h-2 rounded-full bg-[#00C864] shadow-[0_0_8px_#00c864]"></span>
                </div>
            </div>

            {/* ─── RIGHT PANEL: CHAT INTERFACE ──────────────────────────────────── */}
            <div className="flex-1 bg-[#0d1512] border border-white/5 rounded-2xl flex flex-col relative overflow-hidden">

                {/* Chat Header */}
                <div className="p-4 border-b border-white/5 bg-gradient-to-r from-black/20 to-transparent flex justify-between items-center z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-syne font-bold text-white flex items-center gap-2">EcoPower Advisor <span className="px-2 py-0.5 rounded bg-[#00C864]/20 text-[#00C864] text-[9px] uppercase tracking-widest font-bold">Live</span></h3>
                            <p className="text-[10px] text-gray-400 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#00C864] animate-pulse"></span> Powered by Groq · Llama 3.3 70B</p>
                        </div>
                    </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 blur-[100px] pointer-events-none rounded-full"></div>

                    {activeChat?.messages.map((msg, idx) => {
                        const isUser = msg.role === 'user';
                        const isError = msg.role === 'system_error';

                        return (
                            <div key={idx} className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start animate-fade-in`}>

                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isUser ? 'bg-[#00C864] text-black' : isError ? 'bg-red-500/20 text-red-500' : 'bg-[#0a0f0d] border border-purple-500/30 text-purple-400'}`}>
                                    {isUser ? <User className="w-4 h-4" /> : isError ? <AlertTriangle className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                                </div>

                                <div className={`max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${isUser ? 'bg-[#00C864]/20 border border-[#00C864]/30 text-white rounded-tr-none' : isError ? 'bg-red-500/10 border border-red-500/20 text-red-300 rounded-tl-none' : 'bg-black/40 border border-white/10 text-gray-200 rounded-tl-none shadow-lg'}`}>
                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                    <div className={`text-[10px] mt-2 ${isUser ? 'text-[#00C864]/70 text-right' : 'text-gray-500 text-left'}`}>
                                        {format(new Date(msg.timestamp), 'HH:mm')}
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                    {/* Typing Indicator */}
                    {isTyping && (
                        <div className="flex gap-4 flex-row items-center animate-fade-in">
                            <div className="w-8 h-8 rounded-lg bg-[#0a0f0d] border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-400">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="bg-black/40 border border-white/10 rounded-2xl rounded-tl-none p-4 flex gap-1.5 w-16">
                                <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Suggested Questions (only if chat is effectively empty) */}
                {activeChat?.messages.length <= 1 && (
                    <div className="px-6 pb-4 animate-fade-in">
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3 pl-1">Suggested Inquiries based on your context:</div>
                        <div className="flex flex-wrap gap-2">
                            {SUGGESTED_PROMPTS.map((p, i) => (
                                <button
                                    key={i} onClick={() => handleSendMessage(p.text)}
                                    className="px-3 py-1.5 bg-white/5 hover:bg-[#00C864]/20 border border-white/10 hover:border-[#00C864]/30 rounded-full text-xs text-gray-300 hover:text-white transition-all flex items-center gap-1.5"
                                >
                                    <span>{p.icon}</span> {p.text}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input Box */}
                <div className="p-4 border-t border-white/5 bg-[#0a0f0d]">
                    {countdown > 0 && <div className="text-center text-xs text-red-400 mb-2">Rate limit paused. Cooldown: <span className="font-ibm-plex font-bold">{countdown}s</span></div>}

                    <div className={`relative flex items-end gap-3 p-3 bg-black/60 border rounded-2xl transition-colors ${isTyping || countdown > 0 ? 'opacity-50 pointer-events-none' : ''} ${inputMessage.trim() ? 'border-[#00C864]/50 shadow-[0_0_15px_rgba(0,200,100,0.05)]' : 'border-white/10'}`}>

                        <textarea
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask me anything about your energy usage, savings, or devices..."
                            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none resize-none max-h-[120px] custom-scrollbar py-1 leading-relaxed"
                            rows={Math.min(5, inputMessage.split('\n').length || 1)}
                        />

                        <button
                            onClick={() => handleSendMessage()}
                            disabled={!inputMessage.trim() || isTyping || countdown > 0}
                            className="w-10 h-10 rounded-xl bg-[#00C864] hover:bg-[#00FF85] disabled:bg-white/10 flex items-center justify-center shrink-0 transition-all text-black disabled:text-gray-600"
                        >
                            {isTyping ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
                        </button>
                    </div>
                    <div className="text-[9px] text-center text-gray-600 font-ibm-plex mt-2">Press <span className="text-gray-400 border border-white/10 rounded px-1">Shift</span> + <span className="text-gray-400 border border-white/10 rounded px-1">Enter</span> for a new line</div>
                </div>

            </div>

        </div>
    );
};

export default AIAdvisorPage;
