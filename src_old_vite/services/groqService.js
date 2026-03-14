/**
 * Groq API Service — OpenAI-compatible chat completions
 * Uses llama-3.3-70b-versatile model via Groq's inference engine.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

/**
 * Send a chat completion request to Groq API.
 *
 * @param {Object} options
 * @param {string} options.systemPrompt - The system instruction
 * @param {Array<{role: string, content: string}>} options.messages - Chat messages in OpenAI format
 * @param {number} [options.maxTokens=500] - Max output tokens
 * @param {boolean} [options.jsonMode=false] - If true, forces JSON response format
 * @returns {Promise<string>} The assistant's reply text
 */
export async function groqChat({ systemPrompt, messages, maxTokens = 500, jsonMode = false }) {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;

    if (!apiKey) {
        throw new Error('GROQ_KEY_MISSING');
    }

    const body = {
        model: GROQ_MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            ...messages
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
    };

    if (jsonMode) {
        body.response_format = { type: 'json_object' };
        body.temperature = 0.3; // Lower temp for structured output
    }

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const msg = err.error?.message || '';

        if (response.status === 401 || msg.includes('Invalid API Key')) {
            throw new Error('AUTH_FAILED');
        }
        if (response.status === 429) {
            throw new Error('RATE_LIMIT');
        }
        throw new Error(msg || `API Error (${response.status})`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No response generated.';
}
