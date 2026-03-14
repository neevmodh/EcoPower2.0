'use client';

// Uses NEXT_PUBLIC_ prefix so it's available in the browser bundle.
// Set NEXT_PUBLIC_GROQ_API_KEY in Vercel environment variables.
const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Calls /api/groq/chat (backend proxy) with automatic fallback to direct Groq API.
 * This ensures AI features work even if the Express backend is temporarily unreachable.
 */
export async function groqChat({ messages, mode = 'admin', context = '' }) {
  // Try backend proxy first
  try {
    const res = await fetch('/api/groq/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, mode, context })
    });
    if (res.ok) {
      const data = await res.json();
      return data.reply || '';
    }
  } catch {
    // fall through to direct call
  }

  // Direct Groq fallback
  const systemPrompts = {
    support: 'You are EcoPower AI Support Assistant. Help resolve customer support tickets efficiently.',
    analytics: 'You are EcoPower AI Analytics Advisor. Analyze energy platform data and provide actionable insights.',
    grid: 'You are EcoPower AI Grid Optimization Engine. Provide real-time grid balancing recommendations.',
    device: 'You are EcoPower IoT Device Diagnostics AI. Diagnose and resolve device issues.',
    admin: 'You are EcoPower AI Platform Assistant. Provide helpful, accurate, concise responses about the EcoPower Energy-as-a-Service platform.',
  };

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: (systemPrompts[mode] || systemPrompts.admin) + (context ? `\n\nCONTEXT:\n${context}` : '') },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1024
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Calls /api/groq/grid-recommendation with direct fallback.
 */
export async function groqGridRec(gridState) {
  try {
    const res = await fetch('/api/groq/grid-recommendation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gridState })
    });
    if (res.ok) {
      const data = await res.json();
      return data.recommendations || '';
    }
  } catch {
    // fall through
  }

  // Direct fallback
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are EcoPower Grid AI. Provide load balancing recommendations.' },
        { role: 'user', content: `Provide 3 specific load balancing actions with estimated savings. Grid State: ${JSON.stringify(gridState)}` }
      ],
      temperature: 0.6,
      max_tokens: 512
    })
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'No recommendations.';
}
