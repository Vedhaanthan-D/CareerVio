import OpenAI from 'openai';

/** Calls Cerebras API. */
export async function callCerebras(prompt, apiKey, options = {}) {
  const openai = new OpenAI({
    apiKey,
    baseURL: 'https://api.cerebras.ai/v1',
  });
  const completion = await openai.chat.completions.create({
    model: process.env.CEREBRAS_MODEL || 'llama-3.3-70b',
    messages: [{ role: 'user', content: prompt }],
    response_format: options.jsonMode ? { type: 'json_object' } : undefined,
    max_tokens: options.maxTokens || 2048,
  });
  return completion.choices[0].message.content;
}
