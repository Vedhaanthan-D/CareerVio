import OpenAI from 'openai';

/** Calls Groq API. */
export async function callGroq(prompt, apiKey, options = {}) {
  const openai = new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });
  const completion = await openai.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    response_format: options.jsonMode ? { type: 'json_object' } : undefined,
    max_tokens: options.maxTokens || 2048,
  });
  return completion.choices[0].message.content;
}
