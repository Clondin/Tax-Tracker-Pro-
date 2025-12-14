import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check API key
    if (!process.env.GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY not set');
        return res.status(500).json({
            error: 'AI service not configured. Please set GEMINI_API_KEY environment variable.',
            role: 'assistant',
            content: 'I\'m sorry, the AI service is not configured yet. Please ask your administrator to set up the GEMINI_API_KEY in Vercel.'
        });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const { messages, context } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Invalid messages format' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const systemPrompt = `
You are TaxTracker AI, an expert tax assistant helping a user with their US tax return.
You have access to the user's current tax data context:
${JSON.stringify(context, null, 2)}

Rules:
1. Answer questions based on the provided context.
2. If the user asks about their specific numbers (e.g. "total income"), calculate it from the context.
3. Provide helpful, accurate tax information but disclaim that you are an AI and this is not professional legal advice.
4. Keep answers concise and easy to understand.
5. Use markdown for formatting (bold, lists, etc.).
`;

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt }],
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I am ready to help with tax questions based on the provided context." }],
                },
                ...messages.slice(0, -1).map(m => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text: m.content }]
                }))
            ],
        });

        const lastMessage = messages[messages.length - 1];
        const result = await chat.sendMessage(lastMessage.content);
        const response = await result.response;
        const text = response.text();

        return res.status(200).json({ role: 'assistant', content: text });

    } catch (error) {
        console.error('Error generating chat response:', error);
        return res.status(500).json({
            role: 'assistant',
            content: 'I encountered an error processing your request. Please try again.',
            error: error.message
        });
    }
}
