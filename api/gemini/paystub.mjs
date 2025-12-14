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
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured in Vercel' });
    }

    try {
        const { base64Data, mimeType } = req.body;

        if (!base64Data || !mimeType) {
            return res.status(400).json({ error: 'Missing base64Data or mimeType' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-002' });

        const prompt = `Analyze this paystub image. Extract and return JSON only:
{
  "employerName": "Company Name",
  "payDate": "2024-12-15",
  "payFrequency": "biweekly",
  "stateOfEmployment": "CA",
  "earnings": [{"description": "Regular", "amountCurrent": 2500, "amountYTD": 50000, "type": "regular"}],
  "taxes": [{"description": "Federal", "amountCurrent": 300, "amountYTD": 6000, "authority": "federal", "type": "fed_withholding"}],
  "deductions": [{"description": "401k", "amountCurrent": 200, "amountYTD": 4000, "type": "pre_tax", "category": "401k"}]
}
Use ACTUAL values from the image. Return ONLY valid JSON, no markdown.`;

        const result = await model.generateContent([
            { inlineData: { mimeType, data: base64Data } },
            { text: prompt }
        ]);

        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            return res.status(200).json({ data: JSON.parse(jsonMatch[0]) });
        }

        return res.status(200).json({ data: JSON.parse(text) });

    } catch (error) {
        console.error('Paystub error:', error.message);
        return res.status(500).json({ error: error.message });
    }
}
