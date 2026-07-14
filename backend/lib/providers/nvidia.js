import OpenAI from 'openai';

const NVIDIA_MODEL_TIMEOUT_MS = 45_000;

const NVIDIA_MODELS = [
  {
    id: 'z-ai/glm-5.2',
    buildParams: (prompt) => ({
      model: 'z-ai/glm-5.2',
      messages: [{ role: 'user', content: prompt }],
      temperature: 1, top_p: 1, max_tokens: 16384, seed: 42, stream: true,
    }),
  },
  {
    id: 'minimaxai/minimax-m3',
    buildParams: (prompt) => ({
      model: 'minimaxai/minimax-m3',
      messages: [{ role: 'user', content: prompt }],
      temperature: 1, top_p: 1, max_tokens: 16384, stream: true,
    }),
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b',
    buildParams: (prompt) => ({
      model: 'nvidia/nemotron-3-ultra-550b-a55b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 1, top_p: 0.95, max_tokens: 16384,
      reasoning_budget: 16384,
      chat_template_kwargs: { enable_thinking: true },
      stream: true,
    }),
  },
];

/** Races promise against timeout. */
function withTimeout(promise, ms, label = 'operation') {
  const deadline = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`[Timeout] ${label} exceeded ${ms}ms`)), ms)
  );
  return Promise.race([promise, deadline]);
}

/** Calls a specific Nvidia model using streaming and a timeout. */
async function callNvidiaNimModel(prompt, apiKey, modelCfg) {
  const openai = new OpenAI({ apiKey, baseURL: 'https://integrate.api.nvidia.com/v1' });

  const responsePromise = (async () => {
    const stream = await openai.chat.completions.create(modelCfg.buildParams(prompt));
    let text = '';
    for await (const chunk of stream) {
      text += chunk.choices[0]?.delta?.content || '';
    }
    return text;
  })();

  return withTimeout(responsePromise, NVIDIA_MODEL_TIMEOUT_MS, modelCfg.id);
}

/** Calls NVIDIA NIM API, swapping models on failure or timeout. */
export async function callNvidiaNim(prompt, apiKey) {
  for (const modelCfg of NVIDIA_MODELS) {
    try {
      console.log(`[NvidiaNIM] Trying model: ${modelCfg.id} (timeout: ${NVIDIA_MODEL_TIMEOUT_MS / 1000}s)...`);
      return await callNvidiaNimModel(prompt, apiKey, modelCfg);
    } catch (err) {
      const reason = err.message.startsWith('[Timeout]') ? 'timed out' : `failed: ${err.message}`;
      console.warn(`[NvidiaNIM] ${modelCfg.id} ${reason}. Trying next model...`);
    }
  }
  throw new Error('[NvidiaNIM] All models exhausted — no response.');
}
