/** Lookup and store enrichment/resource results in Supabase, keyed by normalized topic title. */

import { supabaseAdmin } from './supabaseAdmin.js';

/** Converts a topic title to a stable cache key. */
export function normalizeTopicKey(title) {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
}

/** Returns cached description + resources for a topic, or null if not cached. */
export async function getCachedResource(title) {
  const key = normalizeTopicKey(title);
  const { data, error } = await supabaseAdmin
    .from('resource_cache')
    .select('description, resources')
    .eq('topic_key', key)
    .maybeSingle();

  if (error) {
    console.warn(`[ResourceCache] Lookup error for "${key}": ${error.message}`);
    return null;
  }
  return data ?? null;
}

/** Persists description + resources for a topic after fresh generation. */
export async function saveCachedResource(title, description, resources, domainSlug) {
  const key = normalizeTopicKey(title);
  const { error } = await supabaseAdmin
    .from('resource_cache')
    .upsert({
      topic_key: key,
      description,
      resources,
      source_domain: domainSlug,
    });

  if (error) {
    console.warn(`[ResourceCache] Save error for "${key}": ${error.message}`);
  }
}
