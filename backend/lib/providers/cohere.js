/** Calls Cohere v2 chat API. */
export async function callCohere(prompt, apiKey, options = {}) {
  const body = {
    model: 'command-r-plus',
    messages: [{ role: 'user', content: prompt }],
  };
  if (options.maxTokens) body.max_tokens = options.maxTokens;

  const res = await fetch('https://api.cohere.com/v2/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Cohere error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.message.content[0].text;
}
