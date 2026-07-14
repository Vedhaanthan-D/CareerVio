import { callGemini, callGeminiWithGrounding } from './providers/gemini.js';
import { callGroq } from './providers/groq.js';
import { callMistral } from './providers/mistral.js';
import { callCerebras } from './providers/cerebras.js';
import { callNvidiaNim } from './providers/nvidia.js';
import { callOpenRouter } from './providers/openrouter.js';
import { callCohere } from './providers/cohere.js';
import { callTavilySearch } from './providers/tavily.js';
import { QuotaManager, quotaManager } from './quotaManager.js';

export { QuotaManager, quotaManager };

/** Reads all API keys for a given env-var prefix (supports KEY, KEY_1, KEY_2…). */
export function getProviderKeys(prefix) {
  const keys = [];
  if (process.env[`${prefix}_API_KEY`]) keys.push(process.env[`${prefix}_API_KEY`]);
  let i = 1;
  while (process.env[`${prefix}_API_KEY_${i}`]) {
    keys.push(process.env[`${prefix}_API_KEY_${i}`]);
    i++;
  }
  if (prefix === 'TAVILY' && process.env.TAVILY_KEY) keys.push(process.env.TAVILY_KEY);
  return keys.filter(Boolean);
}

/** Returns a closure that round-robins through the supplied key list. */
export function createKeyRotator(keys) {
  let index = 0;
  return () => (keys?.length ? keys[index++ % keys.length] : null);
}

const geminiKeys     = getProviderKeys('GEMINI');
const groqKeys       = getProviderKeys('GROQ');
const openRouterKeys = getProviderKeys('OPENROUTER');
const nvidiaNimKeys  = getProviderKeys('NVIDIA_NIM');
const mistralKeys    = getProviderKeys('MISTRAL');
const cerebrasKeys   = getProviderKeys('CEREBRAS');
const cohereKeys     = getProviderKeys('COHERE');
const tavilyKeys     = getProviderKeys('TAVILY');

/** Unified provider registry: rate limits, key rotators, and call functions. */
export const providersConfig = {
  Gemini:    { keys: geminiKeys,     nextKey: createKeyRotator(geminiKeys),     rpm: parseInt(process.env.GEMINI_RPM     || 15 * geminiKeys.length     || 30),  rpd: parseInt(process.env.GEMINI_RPD     || 1500 * geminiKeys.length    || 3000),  call: callGemini },
  Mistral:   { keys: mistralKeys,    nextKey: createKeyRotator(mistralKeys),    rpm: parseInt(process.env.MISTRAL_RPM    || 30 * mistralKeys.length    || 30),  rpd: parseInt(process.env.MISTRAL_RPD    || 1000 * mistralKeys.length   || 1000),  call: callMistral },
  Cerebras:  { keys: cerebrasKeys,   nextKey: createKeyRotator(cerebrasKeys),   rpm: parseInt(process.env.CEREBRAS_RPM   || 30 * cerebrasKeys.length   || 30),  rpd: parseInt(process.env.CEREBRAS_RPD   || 14400 * cerebrasKeys.length || 14400), call: callCerebras },
  NvidiaNIM: { keys: nvidiaNimKeys,  nextKey: createKeyRotator(nvidiaNimKeys),  rpm: parseInt(process.env.NVIDIA_NIM_RPM || 40 * nvidiaNimKeys.length  || 40),  rpd: parseInt(process.env.NVIDIA_NIM_RPD || 5000 * nvidiaNimKeys.length || 5000),  call: callNvidiaNim },
  Groq:      { keys: groqKeys,       nextKey: createKeyRotator(groqKeys),       rpm: parseInt(process.env.GROQ_RPM       || 30 * groqKeys.length       || 30),  rpd: parseInt(process.env.GROQ_RPD       || 14400 * groqKeys.length     || 14400), call: callGroq },
  OpenRouter:{ keys: openRouterKeys, nextKey: createKeyRotator(openRouterKeys), rpm: parseInt(process.env.OPENROUTER_RPM || 20 * openRouterKeys.length  || 20),  rpd: parseInt(process.env.OPENROUTER_RPD || 50 * openRouterKeys.length   || 50),   call: callOpenRouter },
  Cohere:    { keys: cohereKeys,     nextKey: createKeyRotator(cohereKeys),     rpm: parseInt(process.env.COHERE_RPM     || 20 * cohereKeys.length     || 20),  rpd: parseInt(process.env.COHERE_RPD     || 1000 * cohereKeys.length    || 1000),  call: callCohere },
  Tavily:    { keys: tavilyKeys,     nextKey: createKeyRotator(tavilyKeys),     rpm: parseInt(process.env.TAVILY_RPM     || 20),                               rpd: parseInt(process.env.TAVILY_RPD     || 33),                                    call: async (q, key) => callTavilySearch(q, key) },
};

/** Tracks per-provider call timestamps to enforce RPM / RPD ceilings. */
// QuotaManager and quotaManager instance are imported from quotaManager.js

/** Delays execution for a specified number of milliseconds. */
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/** Extracts and sanitizes JSON strings from raw response text. */
export function cleanJSON(str) {
  let s = str.trim();

  // Strip a markdown code fence first (```json ... ``` or plain ``` ... ```)
  const fenceMatch = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) s = fenceMatch[1].trim();

  const bi = s.indexOf('['), ci = s.indexOf('{');
  let start = -1, end = -1;
  if (bi !== -1 && (ci === -1 || bi < ci)) {
    start = bi;
    end = s.lastIndexOf(']');
  } else if (ci !== -1) {
    start = ci;
    end = s.lastIndexOf('}');
  }
  const cleaned = (start !== -1 && end > start) ? s.substring(start, end + 1) : s;

  // Defensive sanitization: replace raw newlines inside unescaped quoted strings
  let inString = false;
  let escapeActive = false;
  let result = '';
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (escapeActive) {
      result += char;
      escapeActive = false;
    } else if (char === '\\') {
      result += char;
      escapeActive = true;
    } else if (char === '"') {
      inString = !inString;
      result += char;
    } else if (char === '\n') {
      result += inString ? '\\n' : char;
    } else if (char === '\r') {
      result += inString ? '\\r' : char;
    } else {
      result += char;
    }
  }
  return result;
}

/** Races a promise against a hard timeout, rejecting with a labelled error if exceeded. */
function withTimeout(promise, ms, label) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`[Timeout] ${label} exceeded ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

/** Calls a single provider with key rotation, respecting quota. */
export async function callWithKeyRotation(provider, callFn, nextKeyFn, maxKeyRetries = 2) {
  let lastError;
  const config = providersConfig[provider];
  for (let i = 0; i < maxKeyRetries; i++) {
    if (config) {
      const check = quotaManager.checkQuota(provider, config.rpm, config.rpd);
      if (!check.ok) throw new Error(`Quota limit reached for ${provider}: ${check.reason}`);
    }
    const key = nextKeyFn();
    if (!key) throw lastError ?? new Error(`No API key available for ${provider}`);
    try {
      if (config) quotaManager.recordCall(provider);
      return await withTimeout(callFn(key), 25_000, provider);
    } catch (err) {
      lastError = err;
      console.warn(`[Key Error] ${provider} attempt ${i + 1} failed: ${err.status || err.message}`);
    }
  }
  throw lastError ?? new Error(`All attempts failed for ${provider}`);
}

/** Tries each provider in order, falling back on failure or quota exhaustion. */
export async function callWithStageFallback(stageLabel, providersList, executeFn, { maxKeyRetriesOverride } = {}) {
  let lastError;
  for (let i = 0; i < providersList.length; i++) {
    const name = providersList[i].trim();
    const config = providersConfig[name];
    if (!config) { console.warn(`[${stageLabel}] Unknown provider "${name}", skipping.`); continue; }
    const check = quotaManager.checkQuota(name, config.rpm, config.rpd);
    if (!check.ok) { console.warn(`[Quota Skip] [${stageLabel}] ${name}: ${check.reason}`); continue; }
    try {
      console.log(`[${stageLabel}] Trying ${name}…`);
      const retries = maxKeyRetriesOverride ?? (config.keys.length || 1);
      return await callWithKeyRotation(name, key => executeFn(name, key), config.nextKey, retries);
    } catch (err) {
      lastError = err;
      if (i < providersList.length - 1)
        console.warn(`[${stageLabel}] ${name} failed (${err.status || err.message}), falling back…`);
    }
  }
  throw lastError ?? new Error(`[${stageLabel}] All providers failed or were skipped.`);
}

// Re-export grounding helper so consumers don't need a direct gemini import.
export { callGeminiWithGrounding };
