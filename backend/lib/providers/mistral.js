import OpenAI from 'openai';

/** Calls Mistral API. */
export async function callMistral(prompt, apiKey, options = {}) {
  const openai = new OpenAI({
    apiKey,
    baseURL: 'https://api.mistral.ai/v1',
  });
  const completion = await openai.chat.completions.create({
    model: process.env.MISTRAL_MODEL || 'mistral-large-latest',
    messages: [{ role: 'user', content: prompt }],
    response_format: options.jsonMode ? { type: 'json_object' } : undefined,
    max_tokens: options.maxTokens || 2048,
  });
  return completion.choices[0].message.content;
}
