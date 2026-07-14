import { supabaseAdmin } from '../lib/supabaseAdmin.js';

async function checkTables() {
  console.log('Checking domains table...');
  const { data: domains, error: domainsErr } = await supabaseAdmin.from('domains').select('*').limit(5);
  if (domainsErr) {
    console.error('Domains table error:', domainsErr);
  } else {
    console.log('Domains:', domains);
  }

  console.log('Checking profiles table...');
  const { data: profiles, error: profilesErr } = await supabaseAdmin.from('profiles').select('*').limit(5);
  if (profilesErr) {
    console.error('Profiles table error:', profilesErr);
  } else {
    console.log('Profiles:', profiles);
  }

  console.log('Checking roadmap_templates table...');
  const { data: templates, error: templatesErr } = await supabaseAdmin.from('roadmap_templates').select('*').limit(5);
  if (templatesErr) {
    console.error('Roadmap templates error:', templatesErr);
  } else {
    console.log('Roadmap templates count:', templates?.length);
  }

  console.log('Checking roadmap_progress table...');
  const { data: progress, error: progressErr } = await supabaseAdmin.from('roadmap_progress').select('*').limit(5);
  if (progressErr) {
    console.error('Roadmap progress error:', progressErr);
  } else {
    console.log('Roadmap progress count:', progress?.length);
  }

  console.log('Checking resume_analyses table...');
  const { data: analyses, error: analysesErr } = await supabaseAdmin.from('resume_analyses').select('*').limit(5);
  if (analysesErr) {
    console.error('Resume analyses error:', analysesErr);
  } else {
    console.log('Resume analyses count:', analyses?.length);
  }
}

checkTables();
