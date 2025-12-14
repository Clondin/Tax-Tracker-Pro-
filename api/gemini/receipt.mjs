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
            error: 'AI service not configured',
            vendor: 'Unknown',
            total: 0,
            category: 'other',
            description: 'Could not scan - API key missing'
        });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const { image, mimeType = 'image/png' } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
You are an expert receipt parser. Analyze this receipt image and extract the following information.
Return a JSON object with these fields:
{
    "vendor": "Name of the store/business",
    "date": "YYYY-MM-DD format",
    "total": 0.00,
    "category": "one of: charity, medical, business, other",
    "description": "Brief description of purchase",
    "confidence": 0.0-1.0
}

If you cannot determine a field, use null. Be conservative with the category - only use specific categories if you're confident.
`;

        const result = await model.generateContent([
            { inlineData: { mimeType, data: image } },
            { text: prompt }
        ]);

        const response = result.response;
        const text = response.text();

        // Parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return res.status(200).json(parsed);
        } else {
            return res.status(200).json({ error: 'Could not parse receipt', raw: text });
        }

    } catch (error) {
        console.error('Error parsing receipt:', error);
        return res.status(500).json({ error: 'Failed to parse receipt', message: error.message });
    }
}
