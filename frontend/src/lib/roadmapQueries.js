import { supabase } from './supabaseClient';

/**
 * Fetches all available domains
 */
export async function fetchDomains() {
  const { data, error } = await supabase
    .from('domains')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Fetches the active roadmap template for a specific domain
 */
export async function fetchRoadmapTemplate(domainId) {
  const { data, error } = await supabase
    .from('roadmap_templates')
    .select('*')
    .eq('domain_id', domainId)
    .eq('status', 'published')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No template found
    }
    throw error;
  }
  return data;
}

/**
 * Fetches all progress records for a user on a specific domain
 */
export async function fetchRoadmapProgress(userId, domainId) {
  const { data, error } = await supabase
    .from('roadmap_progress')
    .select('*')
    .eq('profile_id', userId)
    .eq('domain_id', domainId);

  if (error) throw error;
  return data || [];
}

/**
 * Updates or inserts progress for a specific node in a user's roadmap
 */
export async function updateNodeProgress(userId, domainId, nodeId, status) {
  const { error } = await supabase
    .from('roadmap_progress')
    .upsert({
      profile_id: userId,
      domain_id: domainId,
      node_id: nodeId,
      status: status,
      updated_at: new Date().toISOString()
    }, { onConflict: 'profile_id,node_id' });

  if (error) throw error;
}

/**
 * Returns an array of domain IDs that have at least one published roadmap_templates row.
 */
export async function fetchDomainsWithTemplates() {
  const { data, error } = await supabase
    .from('roadmap_templates')
    .select('domain_id')
    .eq('status', 'published');

  if (error) throw error;
  return (data || []).map(row => row.domain_id);
}

/**
 * Finds a subtopic by its ID in the flat nodes array and resolves its parent milestone title.
 */
export function findSubtopicById(roadmapJson, nodeId) {
  if (!roadmapJson?.nodes) return null;
  const found = roadmapJson.nodes.find(s => s.id === nodeId);
  if (!found) return null;

  let milestoneTitle = '';
  if (found.parent) {
    const parentNode = roadmapJson.nodes.find(n => n.id === found.parent);
    if (parentNode) {
      milestoneTitle = parentNode.title;
    }
  }
  return { ...found, milestoneTitle };
}

/**
 * Fetches the next subtopic that the user is currently studying
 */
export async function getContinueStudyingItem(profileId, domainId) {
  const { data: progress, error: progError } = await supabase
    .from('roadmap_progress')
    .select('node_id, updated_at')
    .eq('profile_id', profileId)
    .eq('domain_id', domainId)
    .eq('status', 'in_progress')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (progError || !progress) return null;

  const { data: template, error: tmplError } = await supabase
    .from('roadmap_templates')
    .select('roadmap_json')
    .eq('domain_id', domainId)
    .eq('status', 'published')
    .single();

  if (tmplError || !template) return null;

  return findSubtopicById(template.roadmap_json, progress.node_id);
}

/**
 * Logs a user's study activity (completed subtopics or viewed resources) for today.
 */
export async function logActivity(profileId, { subtopicCompleted = false, resourceViewed = false }) {
  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await supabase
    .from('study_activity')
    .select('subtopics_completed, resources_viewed')
    .eq('profile_id', profileId)
    .eq('activity_date', today)
    .maybeSingle();

  await supabase.from('study_activity').upsert({
    profile_id: profileId,
    activity_date: today,
    subtopics_completed: (existing?.subtopics_completed || 0) + (subtopicCompleted ? 1 : 0),
    resources_viewed: (existing?.resources_viewed || 0) + (resourceViewed ? 1 : 0),
  }, { onConflict: 'profile_id,activity_date' });
}

/**
 * Fetches the user's study activity logs for the past specified number of days.
 */
export async function fetchStudyActivity(profileId, days = 365) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('study_activity')
    .select('activity_date, subtopics_completed, resources_viewed')
    .eq('profile_id', profileId)
    .gte('activity_date', since.toISOString().split('T')[0])
    .order('activity_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

