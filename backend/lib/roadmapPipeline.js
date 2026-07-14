import pLimit from 'p-limit';
import { supabaseAdmin } from './supabaseAdmin.js';
import { getCachedResource, saveCachedResource, normalizeTopicKey } from './resourceCache.js';
import { resolveCanonicalKey } from './synonymMap.js';
import {
  providersConfig, quotaManager, sleep, cleanJSON,
  callWithKeyRotation, callWithStageFallback, callGeminiWithGrounding,
} from './providerFallback.js';

const STAGE_PROVIDERS = {
  stage1:        (process.env.STAGE1_PROVIDERS         || 'Gemini,Mistral,Cerebras,NvidiaNIM,Groq,OpenRouter').split(','),
  stage2:        (process.env.STAGE2_PROVIDERS         || 'Gemini,Mistral,Cerebras,NvidiaNIM,Groq,OpenRouter').split(','),
  stage3:        (process.env.STAGE3_PROVIDERS         || 'Cerebras,Groq,Mistral,NvidiaNIM,Gemini,OpenRouter').split(','),
  stage4:        (process.env.STAGE4_PROVIDERS         || 'Gemini').split(','),
  stage4Fallback:(process.env.STAGE4_FALLBACK_PROVIDERS|| 'Groq,Mistral,Cerebras,NvidiaNIM,OpenRouter').split(','),
};

// ---------------------------------------------------------------------------
// Pipeline stages
// ---------------------------------------------------------------------------

function skeletonPrompt(domainName, trendContext) {
  return `Generate ONLY the topic skeleton for a "${domainName}" learning roadmap.
${trendContext ?? ''}

Return ONLY valid JSON, no other text or explanation:
{
  "nodes": [
    { "id": "kebab-case-id", "title": "Node Title", "level": "beginner"|"intermediate"|"advanced", "order": number, "parent": "parent-id-or-null" }
  ]
}
Include exactly 20-30 nodes covering scratch to advanced. No resources or descriptions yet.`;
}

/** Flattens the node tree so every child points to its nearest top-level ancestor. */
function flattenToTwoLevels(nodes) {
  const byId = new Map(nodes.map(n => [n.id, n]));
  function topAncestor(node) {
    let cur = node;
    while (cur.parent) {
      const p = byId.get(cur.parent);
      if (!p || p.parent === null) return cur.parent;
      cur = p;
    }
    return null;
  }
  return nodes.map(n => n.parent === null ? n : { ...n, parent: topAncestor(n) });
}

/** Stage 1: generates the topic skeleton (node ids, titles, hierarchy). */
async function generateSkeleton(domainName, trendContext) {
  const prompt = skeletonPrompt(domainName, trendContext);
  const response = await callWithStageFallback('Stage 1 (Skeleton)', STAGE_PROVIDERS.stage1,
    async (provider, key) => providersConfig[provider].call(prompt, key));
  return JSON.parse(cleanJSON(response));
}

function subtopicsPrompt(nodeBatch) {
  return `For each of these roadmap topics, write 2-3 key subtopics/concepts to cover.
Return a valid JSON array matching the input order:
${JSON.stringify(nodeBatch)}

Output format:
[
  { "id": "...", "subtopics": ["...", "..."] }
]`;
}

/** Stage 2: generates subtopics for a batch of nodes. */
async function generateSubtopicsBatch(nodeBatch) {
  const prompt = subtopicsPrompt(nodeBatch);
  const response = await callWithStageFallback('Stage 2 (Subtopics)', STAGE_PROVIDERS.stage2,
    async (provider, key) => providersConfig[provider].call(prompt, key));
  return JSON.parse(cleanJSON(response));
}

/** Stage 2 (full): generates subtopics for all nodes in sequential batches. */
async function generateAllSubtopics(nodes) {
  const BATCH = 6;
  const results = [];
  for (let i = 0; i < nodes.length; i += BATCH) {
    const batch = nodes.slice(i, i + BATCH);
    console.log(`Subtopics batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(nodes.length / BATCH)}…`);
    results.push(...await generateSubtopicsBatch(batch.map(n => ({ id: n.id, title: n.title }))));
    await sleep(2500);
  }
  return results;
}

function descriptionPrompt(nodeBatch) {
  return `For each of these roadmap topics, write a 1-sentence description.
Return a valid JSON array matching the input order:
${JSON.stringify(nodeBatch)}

Output format:
[
  { "id": "...", "description": "..." }
]`;
}

/** Stage 3: enriches a batch of nodes with 1-sentence descriptions. */
async function enrichBatch(nodeBatch) {
  const prompt = descriptionPrompt(nodeBatch);
  const response = await callWithStageFallback('Stage 3 (Enrichment)', STAGE_PROVIDERS.stage3,
    async (provider, key) => providersConfig[provider].call(prompt, key));
  return JSON.parse(cleanJSON(response));
}

/** Stage 3 (full): enriches all nodes, hitting cache first. */
async function enrichAllNodes(nodes, domainSlug) {
  const BATCH = 6;
  const fromCache = [], toFetch = [];
  for (const node of nodes) {
    const key = resolveCanonicalKey(normalizeTopicKey(node.title));
    const cached = await getCachedResource(key);
    if (cached?.description) { fromCache.push({ id: node.id, description: cached.description }); }
    else                     { toFetch.push(node); }
  }
  console.log(`Enriching ${toFetch.length}/${nodes.length} nodes (${fromCache.length} from cache)…`);
  const fresh = [];
  for (let i = 0; i < toFetch.length; i += BATCH) {
    const batch = toFetch.slice(i, i + BATCH);
    console.log(`Enrichment batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(toFetch.length / BATCH)}…`);
    const enriched = await enrichBatch(batch.map(n => ({ id: n.id, title: n.title })));
    for (let j = 0; j < enriched.length; j++) {
      await saveCachedResource(batch[j].title, enriched[j].description || '', null, domainSlug);
    }
    fresh.push(...enriched);
    await sleep(2500);
  }
  return [...fromCache, ...fresh];
}

// ---------------------------------------------------------------------------
// Stage 4: resource finding
// ---------------------------------------------------------------------------

function resourceFallbackPrompt(node, searchResults) {
  return `From these search results, pick exactly 2 learning resources for "${node.title}":
1. One MUST be a YouTube video/playlist (type: "video").
2. One MUST be an article or documentation page (type: "article" or "documentation").

${JSON.stringify(searchResults)}

Return ONLY JSON array:
[{ "type": "video"|"article"|"documentation", "title": "...", "url": "..." }]
Only use URLs that appear in the search results above — do not invent any.`;
}

async function tryGeminiGrounding(node) {
  const config = providersConfig.Gemini;
  const check = quotaManager.checkQuota('Gemini', config.rpm, config.rpd);
  if (!check.ok) { console.warn(`[Stage 4] Gemini skipped: ${check.reason}`); return null; }
  try {
    console.log(`[Stage 4] Trying Gemini grounding for "${node.title}"…`);
    const result = await callWithKeyRotation('Gemini',
      key => callGeminiWithGrounding(
        `Find exactly 2 real, active learning resources for: "${node.title}".
1. One MUST be a free YouTube tutorial (type "video") — e.g. freeCodeCamp, Fireship, Traversy Media.
2. One MUST be an article or official docs (type "article"/"documentation") — e.g. MDN, GeeksforGeeks.
Return ONLY a valid JSON array:
[{ "type": "video"|"article"|"documentation", "title": "...", "url": "..." }]`, key),
      config.nextKey, config.keys.length || 1);
    const parsed = JSON.parse(cleanJSON(result));
    if (Array.isArray(parsed) && parsed.length >= 1) return parsed;
  } catch (err) {
    console.warn(`[Stage 4] Gemini grounding failed: ${err.message}`);
  }
  return null;
}

async function tryTavilyFallback(node) {
  console.log(`[Stage 4] Tavily search for "${node.title}"…`);
  const config = providersConfig.Tavily;
  const check = quotaManager.checkQuota('Tavily', config.rpm, config.rpd);
  if (!check.ok) throw new Error(`Tavily skipped: ${check.reason}`);
  const searchResults = await callWithKeyRotation('Tavily',
    key => callTavilySearch(node.title, key), config.nextKey, config.keys.length || 1);
  const prompt = resourceFallbackPrompt(node, searchResults);
  const result = await callWithStageFallback('Stage 4 (Fallback)', STAGE_PROVIDERS.stage4Fallback,
    async (provider, key) => providersConfig[provider].call(prompt, key));
  const parsed = JSON.parse(cleanJSON(result));
  return Array.isArray(parsed) && parsed.length >= 1 ? parsed : null;
}

/** Finds 2 resources for a single node, trying Gemini then Tavily. */
async function findResourcesForNode(node, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const geminiRes = await tryGeminiGrounding(node);
      if (geminiRes) return geminiRes;
      const tavilyRes = await tryTavilyFallback(node);
      if (tavilyRes) return tavilyRes;
    } catch (err) {
      console.warn(`Attempt ${attempt} failed for "${node.id}": ${err.message}`);
      if (attempt < maxAttempts) await sleep(2000);
    }
  }
  return [];
}

const concurrencyLimit = pLimit(1);

/** Stage 4 (full): attaches resources to every node, hitting cache first. */
async function attachResourcesToAllNodes(nodes, domainSlug) {
  console.log(`Finding resources for ${nodes.length} nodes…`);
  return Promise.all(nodes.map(node => concurrencyLimit(async () => {
    const key = resolveCanonicalKey(normalizeTopicKey(node.title));
    const cached = await getCachedResource(key);
    if (cached?.resources?.length > 0) {
      console.log(`[Cache HIT] Resources for "${node.title}"`);
      return { ...node, resources: cached.resources };
    }
    const resources = await findResourcesForNode(node);
    await saveCachedResource(node.title, node.description || '', resources, domainSlug);
    return { ...node, resources };
  })));
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Returns a list of validation errors found in a completed roadmap. */
function validateRoadmap(roadmap) {
  const ids = new Set(roadmap.nodes.map(n => n.id));
  return roadmap.nodes.flatMap(n => {
    const errors = [];
    if (n.parent && !ids.has(n.parent))
      errors.push(`Node "${n.id}" references missing parent "${n.parent}"`);
    if (!n.resources?.length)
      errors.push(`Node "${n.id}" (${n.title}) has no resources`);
    return errors;
  });
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

/**
 * Writes a completed-stage label plus whatever partial roadmap_json exists
 * so far to the roadmap_templates row, creating it if absent.
 */
async function saveCheckpoint(domainId, stage, partialRoadmap) {
  const { error } = await supabaseAdmin
    .from('roadmap_templates')
    .upsert(
      {
        domain_id:        domainId,
        generation_stage: stage,
        roadmap_json:     partialRoadmap,
        stage_updated_at: new Date().toISOString(),
      },
      { onConflict: 'domain_id' }
    );
  if (error) console.error(`[Checkpoint] Failed to write "${stage}": ${error.message}`);
}

/** Returns domains that have no published roadmap_template yet. */
async function getPendingDomains() {
  const { data: published } = await supabaseAdmin
    .from('roadmap_templates')
    .select('domain_id')
    .eq('status', 'published');
  const publishedIds = new Set((published || []).map(r => r.domain_id));
  const { data: all } = await supabaseAdmin.from('domains').select('*');
  return (all || []).filter(d => !publishedIds.has(d.id));
}

// Ordered list used by resume logic — each entry means that stage is fully done.
const STAGE_ORDER = ['skeleton_done', 'subtopics_done', 'enrichment_done', 'resources_done', 'done'];

/** Returns true if the stored checkpoint is at or past the given stage label. */
function isAtOrPast(currentStage, targetStage) {
  return STAGE_ORDER.indexOf(currentStage) >= STAGE_ORDER.indexOf(targetStage);
}

/**
 * Runs the full 4-stage pipeline for a single domain row.
 * On restart, reads the existing checkpoint and skips already-completed stages,
 * reusing the partial roadmap_json already saved in the DB.
 */
async function runPipelineForDomain(domain) {
  const slug = domain.slug;
  console.log(`\n=== Generating: ${domain.name} (${slug}) ===`);

  // --- Read existing checkpoint ---
  const { data: existing } = await supabaseAdmin
    .from('roadmap_templates')
    .select('generation_stage, roadmap_json')
    .eq('domain_id', domain.id)
    .maybeSingle();

  const savedStage   = existing?.generation_stage ?? null;
  const savedRoadmap = existing?.roadmap_json     ?? null;

  if (savedStage) {
    console.log(`[${slug}] Resuming from checkpoint: "${savedStage}"`);
  } else {
    console.log(`[${slug}] No checkpoint found — starting fresh.`);
  }

  // ---------------------------------------------------------------------------
  // Stage 1 — Skeleton
  // ---------------------------------------------------------------------------
  let nodes;

  if (savedStage && isAtOrPast(savedStage, 'skeleton_done')) {
    console.log(`[${slug}] Skipping skeleton — already completed.`);
    nodes = savedRoadmap.nodes;
  } else {
    const skeleton = await generateSkeleton(domain.name, domain.trend_context);
    nodes = flattenToTwoLevels(skeleton.nodes);

    // Save checkpoint AFTER stage completes successfully.
    const partialRoadmap = { title: `${domain.name} Roadmap`, nodes };
    await saveCheckpoint(domain.id, 'skeleton_done', partialRoadmap);
    console.log(`[${slug}] ✓ skeleton_done`);
  }

  // ---------------------------------------------------------------------------
  // Stage 2 — Subtopics
  // ---------------------------------------------------------------------------
  let nodesWithSubtopics;

  if (savedStage && isAtOrPast(savedStage, 'subtopics_done')) {
    console.log(`[${slug}] Skipping subtopics — already completed.`);
    // subtopics are merged into the nodes already saved in DB
    nodesWithSubtopics = savedRoadmap.nodes;
  } else {
    const subtopicsList = await generateAllSubtopics(nodes);
    const subtopicsMap  = new Map(subtopicsList.map(s => [s.id, s.subtopics || []]));

    nodesWithSubtopics = nodes.map(node => ({
      ...node,
      subtopics: subtopicsMap.get(node.id) || [],
    }));

    const partialRoadmap = { title: `${domain.name} Roadmap`, nodes: nodesWithSubtopics };
    await saveCheckpoint(domain.id, 'subtopics_done', partialRoadmap);
    console.log(`[${slug}] ✓ subtopics_done`);
  }

  // ---------------------------------------------------------------------------
  // Stage 3 — Enrichment
  // ---------------------------------------------------------------------------
  let enrichedNodes;

  if (savedStage && isAtOrPast(savedStage, 'enrichment_done')) {
    console.log(`[${slug}] Skipping enrichment — already completed.`);
    enrichedNodes = savedRoadmap.nodes;
  } else {
    const enriched    = await enrichAllNodes(nodesWithSubtopics, domain.name);
    const enrichedMap = new Map(enriched.map(e => [e.id, e]));

    enrichedNodes = nodesWithSubtopics.map(node => ({
      ...node,
      description: enrichedMap.get(node.id)?.description || '',
    }));

    const partialRoadmap = { title: `${domain.name} Roadmap`, nodes: enrichedNodes };
    await saveCheckpoint(domain.id, 'enrichment_done', partialRoadmap);
    console.log(`[${slug}] ✓ enrichment_done`);
  }

  // ---------------------------------------------------------------------------
  // Stage 4 — Resources
  // ---------------------------------------------------------------------------
  let nodesWithResources;

  if (savedStage && isAtOrPast(savedStage, 'resources_done')) {
    console.log(`[${slug}] Skipping resources — already completed.`);
    nodesWithResources = savedRoadmap.nodes;
  } else {
    nodesWithResources = await attachResourcesToAllNodes(enrichedNodes, domain.name);

    const partialRoadmap = { title: `${domain.name} Roadmap`, nodes: nodesWithResources };
    await saveCheckpoint(domain.id, 'resources_done', partialRoadmap);
    console.log(`[${slug}] ✓ resources_done`);
  }

  // ---------------------------------------------------------------------------
  // Final validation + publish
  // ---------------------------------------------------------------------------
  const roadmap = { title: `${domain.name} Roadmap`, nodes: nodesWithResources };
  const errors  = validateRoadmap(roadmap);

  if (errors.length > 0) console.warn(`[${slug}] Validation errors:`, errors);
  else                   console.log(`[${slug}] Roadmap valid!`);

  const { error } = await supabaseAdmin
    .from('roadmap_templates')
    .upsert(
      {
        domain_id:        domain.id,
        roadmap_json:     roadmap,
        version:          1,
        status:           'published',
        generation_stage: 'done',
        last_error:       null,
        stage_updated_at: new Date().toISOString(),
      },
      { onConflict: 'domain_id' }
    );

  if (error) throw new Error(`DB publish failed for ${domain.name}: ${error.message}`);
  console.log(`=== Done: ${domain.name} ===\n`);
}

// ---------------------------------------------------------------------------
// Public API — used by server.js
// ---------------------------------------------------------------------------

/** Runs the full pipeline for a single domain identified by its slug. */
export async function generateSingleDomain(domainSlug) {
  const { data: domain, error } = await supabaseAdmin
    .from('domains')
    .select('*')
    .eq('slug', domainSlug)
    .single();
  if (error || !domain) throw new Error(`Domain not found: ${domainSlug}`);
  return runPipelineForDomain(domain);
}

/** Runs the full pipeline for every domain that has no published template yet. */
export async function generateAllPending() {
  const pending = await getPendingDomains();
  for (const domain of pending) {
    await runPipelineForDomain(domain);
    if (pending.indexOf(domain) < pending.length - 1) await sleep(30_000);
  }
  return { processed: pending.length, slugs: pending.map(d => d.slug) };
}
