/** Calls Tavily Search API. */
export async function callTavilySearch(query, apiKey) {
  if (!apiKey) throw new Error("Missing Tavily API Key for fallback search");
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query: `${query} youtube video tutorial or documentation guide`,
      max_results: 6
    })
  });
  const data = await res.json();
  return data.results || [];
}
