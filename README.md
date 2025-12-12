<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1QWzE6u4tg920j_UoXhi6gDRiaClGZ06_

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set `VITE_GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key (Vite only exposes variables prefixed with `VITE_` to the browser)
3. Run the app:
   `npm run dev`

## Future improvements

- **Persist return data locally** so taxpayers do not lose their progress on refresh (e.g., sync `taxPayer`, `incomes`, and `deductions` state to `localStorage`).
- **Add validation and guidance in setup and data-entry flows** (format checks for SSNs, required fields by filing status, inline hints for income/deduction types).
- **Surface calculation status and results health** with badges for missing inputs, warnings from the tax engine, and a “last calculated” timestamp.
- **Improve accessibility** by ensuring all interactive elements have clear focus states, proper ARIA labels, and higher contrast in dark mode.
