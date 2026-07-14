import { GoogleGenAI } from '@google/genai';

// Ordered by actual free-tier daily quota depth (RPD), not release order.
// Gemma 4 models share the same hosted Gemini API but have far higher free
// allocations (~1,500 RPD) than the Gemini Flash line (~20 RPD each) — see
// AI Studio's Rate Limit dashboard for current per-model numbers.
// IDs verified against Google's official Gemma-on-Gemini-API docs — the
// 26B model's real ID includes '-a4b-' (MoE variant), not just '-26b-'.
const GEMINI_MODELS = [
  'gemma-4-26b-a4b-it',    // ~1,500 RPD
  'gemma-4-31b-it',        // ~1,500 RPD
  'gemini-3.1-flash-lite', // ~500 RPD
  'gemini-2.5-flash-lite', // ~20 RPD
  'gemini-3-flash',        // ~20 RPD
  'gemini-3.5-flash',      // ~20 RPD
  'gemini-2.5-flash',      // ~20 RPD — last: already the most likely to be exhausted
];

/** Calls the Gemini API, cascading through models by quota depth on failure. */
export async function callGemini(prompt, apiKey, options = {}) {
  const ai = new GoogleGenAI({ apiKey });
  let lastErr;
  for (const model of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: options.jsonMode ? 'application/json' : undefined,
          maxOutputTokens: options.maxOutputTokens || 2048,
        },
      });
      return response.text;
    } catch (err) {
      lastErr = err;
      console.warn(`[Gemini] ${model} failed (${err.status || err.message}), trying next model...`);
    }
  }
  throw lastErr;
}

/** Calls Gemini with Search Grounding enabled, same model cascade as callGemini. */
export async function callGeminiWithGrounding(prompt, apiKey) {
  const ai = new GoogleGenAI({ apiKey });
  let lastErr;
  for (const model of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      return response.text;
    } catch (err) {
      lastErr = err;
      console.warn(`[Gemini Grounding] ${model} failed (${err.status || err.message}), trying next model...`);
    }
  }
  throw lastErr;
}
