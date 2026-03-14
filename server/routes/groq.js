import express from 'express';

const router = express.Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const rateLimitMap = new Map(); // ip -> { count, resetAt }
const RATE_LIMIT = 30;          // requests per window
const RATE_WINDOW = 60_000;     // 1 minute

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ─── Input Guardrails ─────────────────────────────────────────────────────────
const BLOCKED_PATTERNS = [
  /ignore (previous|all|above) instructions/i,
  /you are now/i,
  /act as (a|an) (?!ecopower)/i,
  /jailbreak/i,
  /DAN mode/i,
  /forget (your|all) (instructions|rules)/i,
  /system prompt/i,
  /reveal (your|the) (prompt|instructions|system)/i,
  /\b(bomb|weapon|hack|exploit|malware|ransomware)\b/i,
];

const MAX_INPUT_LENGTH = 4000;

function sanitizeInput(text) {
  if (typeof text !== 'string') return '';
  // Trim and limit length
  let clean = text.trim().slice(0, MAX_INPUT_LENGTH);
  // Remove null bytes and control chars (except newlines/tabs)
  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return clean;
}

function isBlocked(messages) {
  for (const msg of messages) {
    const content = typeof msg.content === 'string' ? msg.content : '';
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(content)) return true;
    }
  }
  return false;
}

function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return false;
  if (messages.length > 20) return false; // max conversation depth
  for (const msg of messages) {
    if (!msg.role || !['user', 'assistant'].includes(msg.role)) return false;
    if (typeof msg.content !== 'string') return false;
  }
  return true;
}

// ─── EcoPower RAG Knowledge Base ──────────────────────────────────────────────
const ECOPOWER_KNOWLEDGE = `
EcoPower is an Energy-as-a-Service (EaaS) platform operating in India (Ahmedabad, Gujarat).

PLATFORM OVERVIEW:
- Provides solar power, battery backup, and smart energy management via subscription
- Three user roles: Admin (platform management), Enterprise (multi-site), Consumer (home/small business)
- Subscription plans: Home Starter (₹999/mo, 3kW), Home Basic (₹1,499/mo, 5kW), Home Premium (₹2,999/mo, 10kW+battery), Home Elite (₹4,999/mo, 15kW+battery), Business Standard (₹8,999/mo, 25kW), Business Pro (₹15,999/mo, 50kW+battery), Enterprise Fleet (₹25,000/mo, 100kW), Industrial Mega (₹99,000/mo, 500kW)
- Pay-as-you-go option: ₹8/kWh

TECHNICAL SPECS:
- IoT smart meters track real-time consumption via WebSocket
- Battery storage: 5-20 kWh depending on plan
- Grid synchronization with DISCOM net-metering
- Feed-in tariff: ₹12/kWh for exported solar energy
- P2P energy trading marketplace
- EV charging integration (Type 2 AC, CCS DC fast charging)
- Blockchain energy transaction ledger (Ethereum-compatible)

ADMIN CAPABILITIES:
- User management: create, suspend, activate accounts
- Device management: IoT fleet, firmware OTA updates
- Support queue: ticket assignment, resolution
- Billing: invoice generation, revenue tracking
- Analytics: platform-wide energy, revenue, user metrics
- Grid balancing: zone-wise load management
- Blockchain: energy transaction ledger
- Weather-based solar prediction (OpenWeatherMap integration)

ENERGY METRICS:
- Average solar generation: 6-8 kWh/day per 5kW system
- Carbon offset: 0.82 kg CO2 per kWh generated
- Typical monthly savings: ₹2,000-5,000 for consumers
- Platform uptime SLA: 99.9%
- Peak solar hours: 10 AM - 3 PM IST

SUPPORT CATEGORIES:
- Technical: inverter, battery, smart meter problems
- Billing: invoice disputes, payment issues
- Device: IoT sync, firmware, hardware faults
- Account: plan changes, onboarding, upgrades
- Other: general queries

GRID ZONES (Ahmedabad):
- Satellite Area, Vastrapur, Bodakdev, Navrangpura, Thaltej, GIFT City, Sanand GIDC, Vatva GIDC
- Peak load hours: 6-10 AM and 6-10 PM IST
- Solar peak: 10 AM - 3 PM IST
- Grid frequency: 50 Hz ± 0.5 Hz

DISCOM INTEGRATION:
- Net-metering approval workflow: Application → Inspection → Meter Install → Grid Sync → Certificate
- Billing sync for feed-in tariff credits
- Load management and demand response programs
- TORRENT POWER and DGVCL integration

SECURITY:
- JWT-based authentication, bcrypt password hashing
- TLS 1.3 for all API endpoints
- Blockchain immutable audit trail
- Role-based access control (RBAC)
`;

// ─── System Prompts by Mode ───────────────────────────────────────────────────
const SYSTEM_PROMPTS = {
  support: (ctx) => `You are EcoPower's AI Support Assistant. Help admin staff resolve customer support tickets efficiently and professionally.

${ECOPOWER_KNOWLEDGE}
${ctx ? `\nCURRENT TICKET CONTEXT:\n${ctx}\n` : ''}
INSTRUCTIONS:
- Provide specific, actionable responses
- For technical issues: give step-by-step troubleshooting
- For billing issues: explain the resolution process clearly
- Keep responses concise and professional (under 300 words)
- Always suggest escalation paths if the issue is complex
- Never make up information not in the knowledge base`,

  analytics: (ctx) => `You are EcoPower's AI Analytics Advisor. Analyze energy platform data and provide data-driven insights.

${ECOPOWER_KNOWLEDGE}
${ctx ? `\nCURRENT DATA CONTEXT:\n${ctx}\n` : ''}
INSTRUCTIONS:
- Analyze provided data and give 3-5 actionable insights
- Focus on revenue optimization, energy efficiency, user growth, and operational improvements
- Use specific numbers and percentages when available
- Highlight anomalies or concerning trends
- Suggest concrete next steps`,

  grid: (ctx) => `You are EcoPower's AI Grid Optimization Engine. Provide real-time grid balancing recommendations.

${ECOPOWER_KNOWLEDGE}
${ctx ? `\nCURRENT GRID STATE:\n${ctx}\n` : ''}
INSTRUCTIONS:
- Provide specific load balancing recommendations with estimated savings in ₹
- Consider zone-wise distribution, battery dispatch, demand response, and P2P trading
- Prioritize recommendations by impact (High/Medium/Low)
- Keep each recommendation actionable and quantified`,

  device: (ctx) => `You are EcoPower's IoT Device Diagnostics AI. Diagnose and resolve device issues.

${ECOPOWER_KNOWLEDGE}
${ctx ? `\nDEVICE CONTEXT:\n${ctx}\n` : ''}
INSTRUCTIONS:
- Diagnose device issues systematically
- Provide specific remediation steps (numbered list)
- Consider firmware versions, connectivity, hardware faults, and calibration
- Estimate resolution time and complexity`,

  admin: (ctx) => `You are EcoPower's AI Platform Assistant for admin users. You have deep knowledge of the EcoPower Energy-as-a-Service platform.

${ECOPOWER_KNOWLEDGE}
${ctx ? `\nCONTEXT:\n${ctx}\n` : ''}
INSTRUCTIONS:
- Provide helpful, accurate, and concise responses
- Focus on actionable insights and platform-specific guidance
- Only answer questions related to EcoPower platform operations
- If asked about unrelated topics, politely redirect to EcoPower topics
- Do NOT use markdown bold (**text**) or italic (*text*) — use plain text only`,

  weather: (ctx) => `You are EcoPower's AI Solar Prediction Engine. Analyze weather data and predict solar generation.

${ECOPOWER_KNOWLEDGE}
${ctx ? `\nWEATHER DATA:\n${ctx}\n` : ''}
INSTRUCTIONS:
- Predict solar generation based on weather conditions
- Provide hourly generation estimates for the day
- Suggest optimal battery charging/discharging schedules
- Highlight any weather risks (storms, heavy cloud cover)`,

  blockchain: (ctx) => `You are EcoPower's Blockchain Analytics AI. Analyze energy transaction ledger data.

${ECOPOWER_KNOWLEDGE}
${ctx ? `\nBLOCKCHAIN DATA:\n${ctx}\n` : ''}
INSTRUCTIONS:
- Analyze transaction patterns and anomalies
- Verify transaction integrity
- Identify P2P trading opportunities
- Provide carbon credit insights`,
};

// ─── Groq API Call Helper ─────────────────────────────────────────────────────
async function callGroq(systemPrompt, messages, maxTokens = 1024, temperature = 0.7) {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature,
      max_tokens: maxTokens,
      stream: false,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  return {
    reply: data.choices?.[0]?.message?.content || 'No response generated.',
    model: data.model,
    usage: data.usage,
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// @route POST /api/groq/chat
router.post('/chat', async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment.' });
    }

    const { messages, context, mode } = req.body;

    if (!validateMessages(messages)) {
      return res.status(400).json({ error: 'Invalid messages format. Provide an array of {role, content} objects.' });
    }

    // Sanitize all message content
    const sanitized = messages.map(m => ({ role: m.role, content: sanitizeInput(m.content) }));

    if (isBlocked(sanitized)) {
      return res.status(400).json({ error: 'Request blocked by content policy. Please ask EcoPower-related questions only.' });
    }

    const sanitizedContext = sanitizeInput(context || '');
    const promptFn = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.admin;
    const systemPrompt = promptFn(sanitizedContext);

    const result = await callGroq(systemPrompt, sanitized);
    // Strip markdown bold/italic from reply
    result.reply = result.reply.replace(/\*\*/g, '').replace(/\*/g, '');
    res.json(result);
  } catch (err) {
    console.error('Groq /chat error:', err.message);
    res.status(500).json({ error: 'AI service error', message: err.message });
  }
});

// @route POST /api/groq/analyze-ticket
router.post('/analyze-ticket', async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Rate limit exceeded.' });
    }

    const { ticket } = req.body;
    if (!ticket) return res.status(400).json({ error: 'ticket object required' });

    const ticketStr = sanitizeInput(JSON.stringify(ticket));
    const prompt = `Analyze this EcoPower support ticket and provide:
1. Root cause analysis (2-3 sentences)
2. Recommended resolution steps (numbered list, max 5 steps)
3. Estimated resolution time
4. Priority justification
5. Preventive measures for future

Ticket: ${ticketStr}`;

    const result = await callGroq(
      `You are EcoPower's AI Support Analyzer. ${ECOPOWER_KNOWLEDGE}`,
      [{ role: 'user', content: prompt }],
      600,
      0.5
    );
    res.json({ analysis: result.reply });
  } catch (err) {
    console.error('Groq /analyze-ticket error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// @route POST /api/groq/grid-recommendation
router.post('/grid-recommendation', async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Rate limit exceeded.' });
    }

    const { gridState } = req.body;
    if (!gridState) return res.status(400).json({ error: 'gridState required' });

    const gridStr = sanitizeInput(JSON.stringify(gridState));
    const prompt = `Based on this EcoPower grid state, provide exactly 3 specific load balancing actions:

Grid State: ${gridStr}

For each recommendation use this format:
ACTION: [specific action]
IMPACT: [quantified impact]
SAVINGS: [₹ per hour estimate]
PRIORITY: [High/Medium/Low]
---`;

    const result = await callGroq(
      `You are EcoPower's Grid AI Optimization Engine. ${ECOPOWER_KNOWLEDGE}`,
      [{ role: 'user', content: prompt }],
      600,
      0.6
    );
    res.json({ recommendations: result.reply });
  } catch (err) {
    console.error('Groq /grid-recommendation error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// @route POST /api/groq/solar-prediction
router.post('/solar-prediction', async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Rate limit exceeded.' });
    }

    const { weatherData, location } = req.body;
    const weatherStr = sanitizeInput(JSON.stringify(weatherData || {}));
    const locationStr = sanitizeInput(location || 'Ahmedabad, Gujarat');

    const prompt = `Predict solar generation for EcoPower installations at ${locationStr} based on this weather data:
${weatherStr}

Provide:
1. Expected generation today (kWh per 5kW system)
2. Hourly generation curve (6 AM to 6 PM, in kW)
3. Battery charging recommendation
4. Grid export opportunity (yes/no and timing)
5. Any weather risks to flag`;

    const result = await callGroq(
      SYSTEM_PROMPTS.weather(''),
      [{ role: 'user', content: prompt }],
      600,
      0.5
    );
    res.json({ prediction: result.reply });
  } catch (err) {
    console.error('Groq /solar-prediction error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
