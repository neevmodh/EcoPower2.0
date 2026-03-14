'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles, Send, X, Minimize2, Maximize2, Bot, User,
  Loader, Copy, Check, Trash2, ChevronDown, Zap, RotateCcw,
  MessageSquare, TrendingUp, Settings, Sun
} from 'lucide-react';

// ─── Strip markdown bold/italic/headers, render as clean text ────────────────
function renderContent(text) {
  if (!text) return [];
  // Split into lines, process each
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Numbered list item
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/^#+\s/, ''));
        i++;
      }
      elements.push({ type: 'ol', items });
      continue;
    }

    // Bullet list item
    if (/^[-•*]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-•*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-•*]\s/, '').replace(/\*\*/g, '').replace(/\*/g, ''));
        i++;
      }
      elements.push({ type: 'ul', items });
      continue;
    }

    // Heading
    if (/^#{1,3}\s/.test(line)) {
      elements.push({ type: 'heading', text: line.replace(/^#+\s/, '').replace(/\*\*/g, '') });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      elements.push({ type: 'hr' });
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Regular paragraph — strip ** and *
    const clean = line.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^#+\s/, '');
    if (clean.trim()) elements.push({ type: 'p', text: clean });
    i++;
  }

  return elements;
}

function MessageContent({ content }) {
  const blocks = renderContent(content);
  return (
    <div style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'inherit' }}>
      {blocks.map((b, i) => {
        if (b.type === 'heading') return (
          <div key={i} style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem', marginTop: i > 0 ? '0.75rem' : 0, color: '#22C55E' }}>{b.text}</div>
        );
        if (b.type === 'hr') return (
          <div key={i} style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '0.5rem 0' }} />
        );
        if (b.type === 'ul') return (
          <ul key={i} style={{ margin: '0.35rem 0', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {b.items.map((item, j) => (
              <li key={j} style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{item}</li>
            ))}
          </ul>
        );
        if (b.type === 'ol') return (
          <ol key={i} style={{ margin: '0.35rem 0', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {b.items.map((item, j) => (
              <li key={j} style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{item}</li>
            ))}
          </ol>
        );
        return <p key={i} style={{ margin: '0.2rem 0' }}>{b.text}</p>;
      })}
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} title="Copy" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4, color: '#94A3B8', display: 'flex', alignItems: 'center', opacity: 0.7, transition: 'opacity 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
      onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}>
      {copied ? <Check size={12} color="#22C55E" /> : <Copy size={12} />}
    </button>
  );
}

// ─── RAG Knowledge Base (client-side for direct fallback) ────────────────────
const ECOPOWER_RAG = `EcoPower is an Energy-as-a-Service (EaaS) platform in Ahmedabad, India.
Plans: Home Starter ₹999/mo 3kW, Home Basic ₹1499/mo 5kW, Home Premium ₹2999/mo 10kW+battery, Home Elite ₹4999/mo 15kW+battery, Business Standard ₹8999/mo 25kW, Business Pro ₹15999/mo 50kW+battery, Enterprise Fleet ₹25000/mo 100kW, Industrial Mega ₹99000/mo 500kW. Pay-as-you-go: ₹8/kWh.
Feed-in tariff: ₹12/kWh. Carbon offset: 0.82 kg CO2/kWh. Solar peak: 10AM-3PM IST. Grid frequency: 50Hz.
Roles: Admin (platform management), Enterprise (multi-site), Consumer (home/small business).
Features: IoT smart meters, P2P energy trading, EV charging, blockchain ledger, DISCOM net-metering, weather solar prediction.
Grid zones: Satellite, Vastrapur, Bodakdev, Navrangpura, Thaltej, GIFT City, Sanand GIDC, Vatva GIDC.
Support categories: Technical, Billing, Device, Account, General.`;

const SYSTEM_PROMPTS = {
  admin: `You are EcoPower's AI Platform Assistant for admin users. You have deep knowledge of the EcoPower Energy-as-a-Service platform.\n\n${ECOPOWER_RAG}\n\nProvide helpful, accurate, concise responses. Focus on actionable insights. Do NOT use markdown bold (**text**) or italic (*text*) formatting. Use plain text, numbered lists, or bullet points only.`,
  consumer: `You are EcoPower's AI Energy Advisor for home/small business customers. Help them understand their energy usage, savings, and plans.\n\n${ECOPOWER_RAG}\n\nBe friendly, clear, and helpful. Explain technical concepts simply. Do NOT use markdown bold (**text**) or italic (*text*) formatting. Use plain text, numbered lists, or bullet points only.`,
  support: `You are EcoPower's AI Support Assistant. Help resolve customer support tickets efficiently.\n\n${ECOPOWER_RAG}\n\nProvide step-by-step troubleshooting. Be professional and concise. Do NOT use markdown bold (**text**) or italic (*text*) formatting.`,
  analytics: `You are EcoPower's AI Analytics Advisor. Analyze energy platform data and provide data-driven insights.\n\n${ECOPOWER_RAG}\n\nGive 3-5 actionable insights with specific numbers. Do NOT use markdown bold (**text**) or italic (*text*) formatting.`,
  grid: `You are EcoPower's AI Grid Optimization Engine. Provide real-time grid balancing recommendations.\n\n${ECOPOWER_RAG}\n\nPrioritize recommendations by impact. Quantify savings in ₹. Do NOT use markdown bold (**text**) or italic (*text*) formatting.`,
  device: `You are EcoPower's IoT Device Diagnostics AI. Diagnose and resolve device issues.\n\n${ECOPOWER_RAG}\n\nProvide numbered troubleshooting steps. Estimate resolution time. Do NOT use markdown bold (**text**) or italic (*text*) formatting.`,
  enterprise: `You are EcoPower's AI Enterprise Advisor. Help enterprise clients optimize multi-site energy management.\n\n${ECOPOWER_RAG}\n\nFocus on ROI, sustainability metrics, and operational efficiency. Do NOT use markdown bold (**text**) or italic (*text*) formatting.`,
};

const SUGGESTIONS = {
  admin: ['Platform health overview', 'How to onboard a new user?', 'Revenue optimization tips', 'Explain grid balancing zones', 'Device firmware update process'],
  consumer: ['How much am I saving monthly?', 'What is feed-in tariff?', 'How does net-metering work?', 'Upgrade my plan options', 'Why is my battery at low charge?'],
  support: ['Inverter fault troubleshooting', 'Billing dispute resolution', 'Smart meter not syncing', 'Escalation procedure', 'Net-metering approval steps'],
  analytics: ['Analyze revenue trends', 'User growth insights', 'Energy efficiency tips', 'Peak usage patterns', 'Carbon offset calculation'],
  grid: ['Optimize zone load balance', 'Battery dispatch strategy', 'Peak demand response', 'P2P trading opportunity', 'Grid frequency deviation fix'],
  device: ['Diagnose offline device', 'Firmware OTA update guide', 'Meter calibration steps', 'Battery health check', 'Inverter error codes'],
  enterprise: ['Multi-site energy report', 'Sustainability KPIs', 'Team energy targets', 'ROI calculation', 'DISCOM compliance status'],
};

const TITLES = {
  admin: 'EcoPower AI Admin', consumer: 'AI Energy Advisor', support: 'AI Support Agent',
  analytics: 'AI Analytics', grid: 'Grid AI Engine', device: 'Device Diagnostics AI',
  enterprise: 'Enterprise AI Advisor',
};

const GROQ_KEY = 'process.env.NEXT_PUBLIC_GROQ_API_KEY || ''';

async function callAI(messages, mode, context) {
  const systemContent = (SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.admin) + (context ? `\n\nPAGE CONTEXT:\n${context}` : '');

  // Try backend proxy first
  try {
    const res = await fetch('/api/groq/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, mode, context }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.reply) return data.reply;
    }
  } catch { /* fall through */ }

  // Direct Groq fallback
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: systemContent }, ...messages],
      temperature: 0.65,
      max_tokens: 1500,
    }),
  });
  if (!res.ok) throw new Error(`Groq API ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'No response generated.';
}

export default function AIAdvisor({ mode = 'admin', context = '' }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const title = TITLES[mode] || TITLES.admin;
  const suggestions = SUGGESTIONS[mode] || SUGGESTIONS.admin;

  useEffect(() => {
    if (open && messages.length === 0) {
      const welcomes = {
        admin: "Hello! I'm your EcoPower AI Platform Assistant. I have full knowledge of the platform — users, devices, billing, grid zones, and more. What can I help you with?",
        consumer: "Hi! I'm your personal AI Energy Advisor. I can help you understand your solar savings, plan options, net-metering, and more. What would you like to know?",
        support: "Support AI ready. Describe a ticket or issue and I'll provide step-by-step resolution guidance.",
        analytics: "Analytics AI online. Ask me to interpret your energy data, identify trends, or suggest optimizations.",
        grid: "Grid Optimization AI active. Share your current load data and I'll provide real-time balancing recommendations.",
        device: "Device Diagnostics AI ready. Describe a device issue and I'll help diagnose and resolve it.",
        enterprise: "Enterprise AI Advisor here. I can help with multi-site management, sustainability reporting, and ROI analysis.",
      };
      setMessages([{ role: 'assistant', content: welcomes[mode] || welcomes.admin, ts: Date.now() }]);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open && !loading) inputRef.current?.focus();
  }, [open, loading]);

  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setShowSuggestions(false);
    const userMsg = { role: 'user', content: msg, ts: Date.now() };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);
    try {
      const apiMessages = history.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }));
      const reply = await callAI(apiMessages, mode, context);
      setMessages(prev => [...prev, { role: 'assistant', content: reply, ts: Date.now() }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I encountered an error: ${err.message}. Please try again.`, ts: Date.now(), error: true }]);
    } finally {
      setLoading(false);
    }
  }, [input, messages, loading, mode, context]);

  const clearChat = () => {
    setMessages([]);
    setShowSuggestions(true);
    setTimeout(() => {
      const welcomes = {
        admin: "Chat cleared. How can I help you with the EcoPower platform?",
        consumer: "Chat cleared. What would you like to know about your energy system?",
        support: "Chat cleared. Describe a new issue and I'll help resolve it.",
        analytics: "Chat cleared. What data would you like me to analyze?",
        grid: "Chat cleared. Share your grid state for new recommendations.",
        device: "Chat cleared. Describe a device issue to diagnose.",
        enterprise: "Chat cleared. What enterprise insights do you need?",
      };
      setMessages([{ role: 'assistant', content: welcomes[mode] || welcomes.admin, ts: Date.now() }]);
    }, 100);
  };

  const panelW = expanded ? 720 : 480;
  const panelH = expanded ? '85vh' : '600px';

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        style={{ position: 'fixed', bottom: '2rem', right: '2rem', width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg,#22C55E,#16A34A)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(34,197,94,0.5)', zIndex: 1000, transition: 'all 0.25s' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(34,197,94,0.65)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(34,197,94,0.5)'; }}
        title="Open AI Advisor">
        <Sparkles size={26} />
      </button>
    );
  }

  return (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', width: panelW, maxWidth: 'calc(100vw - 2rem)', height: panelH, zIndex: 1000, fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', borderRadius: 20, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.08)', transition: 'width 0.3s ease, height 0.3s ease' }}>

      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(135deg,#0A0F1E,#0F172A)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#22C55E,#16A34A)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(34,197,94,0.4)' }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#F1F5F9', fontSize: '0.9375rem', letterSpacing: '-0.01em' }}>{title}</div>
            <div style={{ fontSize: '0.7rem', color: '#4ADE80', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'pulse-dot 2s infinite' }} />
              Groq LLaMA 3.3 · RAG Enhanced · {messages.filter(m => m.role === 'user').length} messages
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={clearChat} title="Clear chat" style={{ background: 'rgba(255,255,255,0.07)', border: 'none', color: '#94A3B8', cursor: 'pointer', borderRadius: 8, padding: '6px 8px', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#F87171'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#94A3B8'; }}>
            <Trash2 size={14} />
          </button>
          <button onClick={() => setExpanded(!expanded)} title={expanded ? 'Shrink' : 'Expand'} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', color: '#94A3B8', cursor: 'pointer', borderRadius: 8, padding: '6px 8px', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#F1F5F9'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#94A3B8'; }}>
            {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button onClick={() => setOpen(false)} title="Close" style={{ background: 'rgba(255,255,255,0.07)', border: 'none', color: '#94A3B8', cursor: 'pointer', borderRadius: 8, padding: '6px 8px', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#F87171'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#94A3B8'; }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#0D1117', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', scrollbarWidth: 'thin', scrollbarColor: '#1E293B transparent' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
            {/* Avatar */}
            <div style={{ width: 32, height: 32, borderRadius: 10, background: msg.role === 'user' ? 'linear-gradient(135deg,#22C55E,#16A34A)' : 'linear-gradient(135deg,#1E293B,#334155)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: msg.role === 'user' ? '0 2px 8px rgba(34,197,94,0.3)' : '0 2px 8px rgba(0,0,0,0.3)' }}>
              {msg.role === 'user' ? <User size={15} color="#fff" /> : <Bot size={15} color="#4ADE80" />}
            </div>

            {/* Bubble */}
            <div style={{ maxWidth: expanded ? '75%' : '82%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ padding: '0.875rem 1.1rem', borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px', background: msg.role === 'user' ? 'linear-gradient(135deg,#22C55E,#16A34A)' : msg.error ? 'rgba(239,68,68,0.1)' : '#1A2332', color: msg.role === 'user' ? '#fff' : msg.error ? '#F87171' : '#E2E8F0', border: msg.role === 'user' ? 'none' : msg.error ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
                {msg.role === 'user'
                  ? <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.6 }}>{msg.content}</p>
                  : <MessageContent content={msg.content} />
                }
              </div>
              {/* Timestamp + copy */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: msg.role === 'user' ? 0 : 4, paddingRight: msg.role === 'user' ? 4 : 0 }}>
                <span style={{ fontSize: '0.65rem', color: '#475569' }}>
                  {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.role === 'assistant' && <CopyButton text={msg.content} />}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#1E293B,#334155)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot size={15} color="#4ADE80" />
            </div>
            <div style={{ padding: '0.875rem 1.1rem', borderRadius: '4px 16px 16px 16px', background: '#1A2332', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(j => (
                  <div key={j} style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', animation: `bounce-dot 1.2s ease-in-out ${j * 0.2}s infinite` }} />
                ))}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Thinking with RAG...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Suggestions ── */}
      {showSuggestions && messages.length <= 1 && (
        <div style={{ background: '#0D1117', padding: '0 1.25rem 0.875rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suggested questions</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => sendMessage(s)}
                style={{ padding: '0.4rem 0.875rem', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '2rem', fontSize: '0.75rem', color: '#4ADE80', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.18)'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.08)'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.2)'; }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input ── */}
      <div style={{ background: '#0A0F1E', padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask anything about EcoPower... (Enter to send, Shift+Enter for new line)"
              disabled={loading}
              rows={2}
              style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: '0.875rem', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#E2E8F0', background: '#1A2332', transition: 'border-color 0.2s', resize: 'none', lineHeight: 1.5, boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = 'rgba(34,197,94,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
            style={{ width: 44, height: 44, borderRadius: 12, background: input.trim() && !loading ? 'linear-gradient(135deg,#22C55E,#16A34A)' : 'rgba(255,255,255,0.06)', border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0, boxShadow: input.trim() && !loading ? '0 4px 14px rgba(34,197,94,0.35)' : 'none' }}>
            {loading ? <Loader size={18} color="#4ADE80" style={{ animation: 'spin-slow 1s linear infinite' }} /> : <Send size={18} color={input.trim() ? '#fff' : '#475569'} />}
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
          <span style={{ fontSize: '0.65rem', color: '#334155' }}>RAG · EcoPower Knowledge Base · LLaMA 3.3 70B</span>
          <span style={{ fontSize: '0.65rem', color: '#334155' }}>Enter to send · Shift+Enter for new line</span>
        </div>
      </div>

      <style>{`
        @keyframes bounce-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
