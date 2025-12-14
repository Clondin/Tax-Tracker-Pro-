import { GoogleGenerativeAI } from '@google/generative-ai';

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

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `You are a payroll document analyzer. Carefully examine this paystub image and extract ALL visible payroll information.

CRITICAL - Extract these fields accurately:
1. EMPLOYER NAME - The company name (look at the top/header of the paystub)
2. PAY DATE - The exact date on the check or "Pay Date" field. Format as YYYY-MM-DD (e.g., 2024-12-15)
3. PAY PERIOD START/END - Look for "Pay Period" dates to determine frequency
4. PAY FREQUENCY - Determine from the pay period length:
   - "weekly" = 7 days between pay periods
   - "biweekly" = 14 days between pay periods  
   - "semimonthly" = paid twice a month (1st & 15th, or 15th & 30th)
   - "monthly" = paid once a month
5. STATE - The state of employment (2 letter code like CA, NY, TX) - look in the employer address
6. EARNINGS - All earnings items with EXACT dollar amounts
7. TAXES - All tax withholdings with EXACT dollar amounts (Federal, SS, Medicare, State, Local)
8. DEDUCTIONS - All deductions with EXACT dollar amounts (401k, Health, Dental, Vision, HSA, etc.)

Return a JSON object with this exact structure:
{
    "employerName": "Actual Company Name",
    "payDate": "2024-12-15",
    "payFrequency": "biweekly",
    "stateOfEmployment": "CA",
    "earnings": [
        { "description": "Regular Pay", "amountCurrent": 2500.00, "amountYTD": 50000.00, "type": "regular" }
    ],
    "taxes": [
        { "description": "Federal Tax", "amountCurrent": 300.00, "amountYTD": 6000.00, "authority": "federal", "type": "fed_withholding" },
        { "description": "Social Security", "amountCurrent": 155.00, "amountYTD": 3100.00, "authority": "federal", "type": "ss" },
        { "description": "Medicare", "amountCurrent": 36.25, "amountYTD": 725.00, "authority": "federal", "type": "med" },
        { "description": "State Tax", "amountCurrent": 100.00, "amountYTD": 2000.00, "authority": "state", "type": "state_withholding" }
    ],
    "deductions": [
        { "description": "401k", "amountCurrent": 200.00, "amountYTD": 4000.00, "type": "pre_tax", "category": "401k" },
        { "description": "Health Insurance", "amountCurrent": 150.00, "amountYTD": 3000.00, "type": "pre_tax", "category": "health" }
    ]
}

IMPORTANT RULES:
- Extract the ACTUAL numbers from the paystub image, not placeholder/example values
- For payDate, use the actual date shown (format: YYYY-MM-DD)
- For payFrequency, calculate from the pay period dates if shown
- If a value is not visible, use 0 for numbers or empty string for text
- Return ONLY valid JSON, no markdown code blocks`;

        const response = await model.generateContent([
            { inlineData: { mimeType, data: base64Data } },
            { text: prompt }
        ]);

        const result = response.response;
        const text = result.text();
        if (!text) {
            return res.status(502).json({ error: 'No response from Gemini' });
        }

        return res.status(200).json({ data: JSON.parse(text) });
    } catch (error) {
        console.error('Gemini paystub processing failed', error);
        return res.status(500).json({ error: 'Failed to process paystub: ' + error.message });
    }
}
