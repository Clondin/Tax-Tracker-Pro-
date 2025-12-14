const { GoogleGenAI } = require('@google/genai');

module.exports = async function handler(req, res) {
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
            return res.status(500).json({ error: 'Gemini API key not configured. Add GEMINI_API_KEY to Vercel environment variables.' });
        }

        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const prompt = `
      Analyze this paystub image and extract payroll data into a JSON structure matching this schema:
      {
          "employerName": "string",
          "payDate": "YYYY-MM-DD",
          "payFrequency": "weekly" | "biweekly" | "semimonthly" | "monthly",
          "stateOfEmployment": "string (2 letter code)",
          "earnings": [
              { "description": "string", "amountCurrent": number, "amountYTD": number, "type": "regular" | "overtime" | "bonus" | "other" }
          ],
          "taxes": [
              { "description": "string", "amountCurrent": number, "amountYTD": number, "authority": "federal" | "state", "type": "fed_withholding" | "ss" | "med" | "state_withholding" | "sdi" | "other" }
          ],
          "deductions": [
              { "description": "string", "amountCurrent": number, "amountYTD": number, "type": "pre_tax" | "after_tax", "category": "health" | "401k" | "hsa" | "other" }
          ]
      }
      Return ONLY valid JSON. If values are missing, use 0 or empty string.
    `;

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
};

module.exports.config = {
    api: {
        bodyParser: {
            sizeLimit: '12mb',
        },
    },
};
