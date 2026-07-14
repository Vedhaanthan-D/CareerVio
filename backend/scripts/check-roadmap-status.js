import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { DOMAINS_TO_GENERATE } from './domains-to-generate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve .env path relative to this script to support execution from any directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/** Fetches template statuses from the database. */
async function fetchTemplateStatuses() {
  const { data, error } = await supabase
    .from('roadmap_templates')
    .select('status, domains(name)');

  if (error) {
    console.error('Error fetching template statuses:', error);
    process.exit(1);
  }
  return data || [];
}

/** Categorizes db templates by their publication status. */
function categorizeTemplates(dbTemplates) {
  const statusMaps = { published: new Set(), drafts: new Set() };
  for (const template of dbTemplates) {
    const name = template.domains?.name?.toLowerCase();
    if (name) {
      if (template.status === 'published') {
        statusMaps.published.add(name);
      } else {
        statusMaps.drafts.add(name);
      }
    }
  }
  return statusMaps;
}

/** Prints the categorizations to stdout. */
function printReport(published, drafts, missing) {
  console.log('\n=== PUBLISHED ROADMAPS ===');
  published.length > 0 ? published.forEach(name => console.log(`[✔] ${name}`)) : console.log('(None)');

  console.log('\n=== DRAFT ROADMAPS ===');
  drafts.length > 0 ? drafts.forEach(name => console.log(`[?] ${name}`)) : console.log('(None)');

  console.log('\n=== MISSING / GENERATION REQUIRED ===');
  missing.length > 0 ? missing.forEach(name => console.log(`[✖] ${name}`)) : console.log('(All roadmaps generated!)');
}

/** Analyzes which roadmaps are present in the DB and which still need generation. */
async function checkStatus() {
  console.log('Fetching roadmap templates from the database...');
  const dbTemplates = await fetchTemplateStatuses();
  const statusMaps = categorizeTemplates(dbTemplates);

  const missing = [];
  const published = [];
  const drafts = [];

  for (const domain of DOMAINS_TO_GENERATE) {
    const lowerName = domain.name.toLowerCase();
    if (statusMaps.published.has(lowerName)) {
      published.push(domain.name);
    } else if (statusMaps.drafts.has(lowerName)) {
      drafts.push(domain.name);
    } else {
      missing.push(domain.name);
    }
  }

  console.log('\n--- ROADMAP STATUS REPORT ---');
  console.log(`Target domains to generate: ${DOMAINS_TO_GENERATE.length}`);
  console.log(`Published roadmaps in DB:  ${published.length}`);
  console.log(`Draft roadmaps in DB:      ${drafts.length}`);
  console.log(`Missing roadmaps:          ${missing.length}`);

  printReport(published, drafts, missing);
}

checkStatus();
