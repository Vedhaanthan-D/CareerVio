import OpenAI from 'openai';

/** Calls OpenRouter API. */
export async function callOpenRouter(prompt, apiKey, options = {}) {
  const openai = new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
  });
  const completion = await openai.chat.completions.create({
    model: 'meta-llama/llama-3.3-70b-instruct',
    messages: [{ role: 'user', content: prompt }],
    response_format: options.jsonMode ? { type: 'json_object' } : undefined,
    max_tokens: options.maxTokens || 2048,
  });
  return completion.choices[0].message.content;
}
