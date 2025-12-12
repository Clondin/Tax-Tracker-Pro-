import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.resolve(__dirname, 'dist');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCCn3mN9tgF4pHh9su5kbalA2ftu21HLGQ';

if (!GEMINI_API_KEY) {
  throw new Error('Gemini API key is not configured. Set GEMINI_API_KEY.');
}

const sendJson = (res, status, body) => {
  res.writeHead(status, {
    'Content-Type': 'application/json'
  });
  res.end(JSON.stringify(body));
};

const serveStatic = (req, res) => {
  const urlPath = new URL(req.url, `http://${req.headers.host}`).pathname;
  const requestedPath = urlPath === '/' ? '/index.html' : urlPath;
  const filePath = path.join(distPath, requestedPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const stream = fs.createReadStream(filePath);
    stream.on('open', () => {
      res.writeHead(200);
      stream.pipe(res);
    });
    stream.on('error', () => {
      res.writeHead(500);
      res.end('Server error');
    });
  } else {
    const fallback = path.join(distPath, 'index.html');
    if (fs.existsSync(fallback)) {
      const stream = fs.createReadStream(fallback);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      stream.pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  }
};

const server = http.createServer(async (req, res) => {
  const { method } = req;
  const urlObj = new URL(req.url, `http://${req.headers.host}`);

  if (method === 'POST' && urlObj.pathname === '/api/gemini/paystub') {
    let rawBody = '';
    req.on('data', chunk => {
      rawBody += chunk;
      if (rawBody.length > 12 * 1024 * 1024) {
        req.destroy();
      }
    });

    req.on('end', async () => {
      try {
        const body = JSON.parse(rawBody || '{}');
        const { base64Data, mimeType } = body;

        if (!base64Data || !mimeType) {
          return sendJson(res, 400, { error: 'base64Data and mimeType are required' });
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
          model: 'gemini-2.5-flash',
          contents: {
            parts: [
              { inlineData: { mimeType, data: base64Data } },
              { text: prompt }
            ]
          },
          config: {
            responseMimeType: 'application/json'
          }
        });

        const text = typeof response.text === 'function'
          ? response.text()
          : response.candidates?.[0]?.content?.parts?.map(part => part.text).join('') || '';

        if (!text?.trim()) {
          console.error('Empty response from Gemini SDK', response);
          return sendJson(res, 502, { error: 'No response from Gemini' });
        }

        try {
          return sendJson(res, 200, { data: JSON.parse(text) });
        } catch (parseError) {
          console.error('Failed to parse Gemini response', parseError, text);
          return sendJson(res, 502, { error: 'Gemini returned non-JSON output' });
        }
      } catch (error) {
        console.error('Gemini paystub processing failed', error);
        return sendJson(res, 500, { error: 'Failed to process paystub' });
      }
    });

    return;
  }

  serveStatic(req, res);
});

const port = process.env.PORT || 4173;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
