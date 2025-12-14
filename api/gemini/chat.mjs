import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({
            role: 'assistant',
            content: 'AI not configured. Ask admin to set GEMINI_API_KEY in Vercel.'
        });
    }

    try {
        const { messages, context } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Invalid messages' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-002' });

        const systemPrompt = `You are TaxTracker AI, a helpful tax assistant.
User's data: ${JSON.stringify(context || {})}
Rules: Be concise. Use markdown. Disclaim you're AI, not legal advice.`;

        const chat = model.startChat({
            history: [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'model', parts: [{ text: 'Ready to help with your taxes!' }] },
                ...messages.slice(0, -1).map(m => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text: m.content }]
                }))
            ],
        });

        const lastMsg = messages[messages.length - 1];
        const result = await chat.sendMessage(lastMsg.content);
        const text = result.response.text();

        return res.status(200).json({ role: 'assistant', content: text });

    } catch (error) {
        console.error('Chat error:', error.message);
        return res.status(500).json({
            role: 'assistant',
            content: `Error: ${error.message}`
        });
    }
}
