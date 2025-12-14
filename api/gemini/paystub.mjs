import { GoogleGenAI } from '@google/genai';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '12mb',
        },
    },
};

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { base64Data, mimeType } = req.body;

        if (!base64Data || !mimeType) {
            return res.status(400).json({ error: 'base64Data and mimeType are required' });
        }

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: 'GEMINI_API_KEY environment variable not set' });
        }

        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const prompt = `You are a payroll document analyzer. Carefully examine this paystub image and extract ALL visible payroll information.

Look for and extract:
1. EMPLOYER NAME - The company name at the top
2. PAY DATE - The check date or pay date
3. PAY FREQUENCY - weekly, biweekly, semimonthly, or monthly
4. STATE - The state of employment (2 letter code like CA, NY, TX)
5. EARNINGS - All earnings items (Regular, Overtime, Bonus, etc.) with their current period and YTD amounts
6. TAXES - All tax withholdings (Federal, Social Security, Medicare, State, etc.) with current and YTD amounts
7. DEDUCTIONS - All deductions (401k, Health Insurance, HSA, etc.) with current and YTD amounts

Return a JSON object with this exact structure:
{
    "employerName": "Company Name Here",
    "payDate": "2024-01-15",
    "payFrequency": "biweekly",
    "stateOfEmployment": "CA",
    "earnings": [
        { "description": "Regular Pay", "amountCurrent": 2500.00, "amountYTD": 5000.00, "type": "regular" }
    ],
    "taxes": [
        { "description": "Federal Tax", "amountCurrent": 300.00, "amountYTD": 600.00, "authority": "federal", "type": "fed_withholding" },
        { "description": "Social Security", "amountCurrent": 155.00, "amountYTD": 310.00, "authority": "federal", "type": "ss" },
        { "description": "Medicare", "amountCurrent": 36.25, "amountYTD": 72.50, "authority": "federal", "type": "med" }
    ],
    "deductions": [
        { "description": "401k", "amountCurrent": 200.00, "amountYTD": 400.00, "type": "pre_tax", "category": "401k" }
    ]
}

IMPORTANT: Extract the ACTUAL numbers from the paystub image. Do not use placeholder values.
Return ONLY valid JSON, no markdown code blocks.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { inlineData: { mimeType, data: base64Data } },
                        { text: prompt }
                    ]
                }
            ],
            config: {
                responseMimeType: 'application/json'
            }
        });

        const text = response.text;
        if (!text) {
            return res.status(502).json({ error: 'No response from Gemini' });
        }

        return res.status(200).json({ data: JSON.parse(text) });
    } catch (error) {
        console.error('Gemini paystub processing failed', error);
        return res.status(500).json({ error: 'Failed to process paystub: ' + error.message });
    }
}
