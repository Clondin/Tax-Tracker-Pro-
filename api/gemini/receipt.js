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
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    try {
        const { image, mimeType = 'image/png' } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `Parse this receipt. Return JSON only:
{"vendor": "Store Name", "date": "2024-12-15", "total": 45.99, "category": "other", "description": "Purchase"}
Categories: charity, medical, business, other. Use null if unknown.`;

        const result = await model.generateContent([
            { inlineData: { mimeType, data: image } },
            { text: prompt }
        ]);

        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            return res.status(200).json(JSON.parse(jsonMatch[0]));
        }

        return res.status(200).json(JSON.parse(text));

    } catch (error) {
        console.error('Receipt error:', error.message);
        return res.status(500).json({ error: error.message });
    }
}
