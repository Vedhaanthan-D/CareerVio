import { providersConfig, cleanJSON } from './providerFallback.js';

const FEEDBACK_MAX_TOKENS = 1500;
const FALLBACK_PROVIDERS = ['Mistral', 'Gemini', 'Groq'];

function buildFeedbackPrompt(ruleFindings) {
  return `You are reviewing a student's resume for placement readiness. Below is a rule-based analysis — do not recompute or second-guess the scores, only explain them clearly and give specific fixes.

Overall score: ${ruleFindings.overallScore}/100
Word count: ${ruleFindings.wordCount}
Category breakdown: ${JSON.stringify(ruleFindings.categoryBreakdown)}
Weak/unquantified bullets found in the resume (use these EXACT lines when writing fixes — do not invent generic examples):
${JSON.stringify(ruleFindings.cons.map(c => ({ category: c.category, evidence: c.evidence })))}

Write detailed, specific, encouraging feedback for the student. Reference their actual numbers (word count, exact scores) — no generic resume advice.

Return ONLY this JSON, nothing else:
{
  "summary": "1-2 sentence overall verdict on where this resume stands",
  "pros": ["specific strength, tied to a high-scoring category", "..."],
  "cons": [
    {
      "category": "exact category label from the breakdown above",
      "issue": "what's specifically wrong or missing, referencing their actual content",
      "pointsLost": number,
      "fix": "Rewrite ONE of the evidence bullets above, verbatim original followed by the improved version, in this exact format: Original: \"<their real bullet>\" → Improved: \"<rewritten with a real, plausible metric or stronger verb>\". If no evidence bullets exist for this category, give one specific instruction instead."
    }
  ],
  "topPriority": "which single fix from 'cons' would raise the score the most, and by roughly how much, in one sentence"
}
Order "cons" by pointsLost, highest first. Include every category scoring below 80%. Keep each fix under 25 words.`;
}

/** Calls a specific provider to polish feedback, returning the parsed JSON. */
async function callPolishProvider(provider, prompt) {
  const config = providersConfig[provider];
  if (!config) throw new Error(`Provider config not found for ${provider}`);

  const key = config.nextKey();
  if (!key) throw new Error(`No API key available for ${provider}`);

  const raw = await config.call(prompt, key, {
    maxTokens: FEEDBACK_MAX_TOKENS,
    maxOutputTokens: FEEDBACK_MAX_TOKENS,
    jsonMode: true,
  });

  if (!raw) {
    throw new Error('Empty response received from provider');
  }

  const promptTokens = Math.ceil(prompt.length / 4);
  const responseTokens = Math.ceil(raw.length / 4);
  const totalTokens = promptTokens + responseTokens;
  console.log(`[Resume Feedback] ${provider} response received successfully.`);
  console.log(`- Estimated Prompt Tokens: ${promptTokens}`);
  console.log(`- Estimated Response Tokens: ${responseTokens}`);
  console.log(`- Total Estimated Tokens: ${totalTokens}`);

  if (provider === 'Mistral') {
    console.log(`- Mistral-large-2512 Details: 250,000 TPM Limit, 0.07 RPS Limit (~14.3s between requests)`);
    console.log(`- Token consumption: ~${((totalTokens / 250000) * 100).toFixed(3)}% of minute limit`);
  }

  const parsed = JSON.parse(cleanJSON(raw));
  if (parsed.summary && Array.isArray(parsed.cons)) return parsed;
  throw new Error('Malformed feedback shape from provider');
}

/** Builds fallback feedback from raw rule findings. */
function buildFallbackFeedback(ruleFindings) {
  return {
    summary: `Score: ${ruleFindings.overallScore}/100.`,
    pros: ruleFindings.pros,
    cons: ruleFindings.cons.map(c => ({
      category: c.category,
      issue: `${c.category} scored ${c.currentScore}.`,
      pointsLost: c.pointsLost,
      fix: 'See category breakdown for details.',
    })),
    topPriority: ruleFindings.topPriority ? `Focus on: ${ruleFindings.topPriority}` : null,
  };
}

/** Polishes raw rule findings into student-friendly sentences via LLM. */
export async function polishFeedback(ruleFindings) {
  const prompt = buildFeedbackPrompt(ruleFindings);

  for (const provider of FALLBACK_PROVIDERS) {
    try {
      console.log(`[Resume Feedback] Trying ${provider}...`);
      return await callPolishProvider(provider, prompt);
    } catch (err) {
      console.warn(`[Resume Feedback] ${provider} failed: ${err.message}`);
    }
  }

  console.warn('[Resume Feedback] All providers failed, using raw rule findings.');
  return buildFallbackFeedback(ruleFindings);
}
