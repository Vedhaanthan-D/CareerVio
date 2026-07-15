import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { generateSingleDomain, generateAllPending } from './lib/roadmapPipeline.js';
import { seedNewDomains } from './lib/domainSeeder.js';
import { supabaseAdmin } from './lib/supabaseAdmin.js';
import { extractText } from './lib/resumeParser.js';
import { analyzeResume } from './lib/resumeRules.js';
import { polishFeedback } from './lib/resumeFeedback.js';
import { isLikelyResume, VALIDATION_ERRORS } from './lib/resumeValidator.js';

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB cap
});

// ---------------------------------------------------------------------------
// Health check endpoint (public, lightweight for uptime monitoring)
// ---------------------------------------------------------------------------
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------------------------

/** Rejects requests that don't carry the shared admin secret. */
function requireAdminKey(req, res, next) {
  if (req.headers['x-admin-key'] !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

/** Verifies a Supabase session from the Authorization: Bearer header. */
async function requireUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }
  const token = authHeader.slice('Bearer '.length);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  req.userId = data.user.id;
  next();
}

// ---------------------------------------------------------------------------
// Admin routes — all protected by requireAdminKey
// ---------------------------------------------------------------------------

/** POST /api/admin/seed-domains — inserts missing domain rows + roadmap templates. */
app.post('/api/admin/seed-domains', requireAdminKey, async (req, res) => {
  try {
    const result = await seedNewDomains();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/generate-roadmap — kicks off generation for one domain.
 * Responds immediately (fire-and-forget) so the client doesn't time out.
 * Progress is visible via GET /api/admin/generation-status.
 */
app.post('/api/admin/generate-roadmap', requireAdminKey, (req, res) => {
  const { domainSlug } = req.body;
  if (!domainSlug) return res.status(400).json({ error: 'domainSlug required' });

  res.json({ started: true, domainSlug });
  generateSingleDomain(domainSlug).catch(err =>
    console.error(`[generate-roadmap] ${domainSlug} failed:`, err.message)
  );
});

/**
 * POST /api/admin/generate-pending — kicks off generation for every pending domain.
 * Responds immediately; runs sequentially with the existing inter-domain cooldown.
 */
app.post('/api/admin/generate-pending', requireAdminKey, (req, res) => {
  res.json({ started: true });
  generateAllPending().catch(err =>
    console.error('[generate-pending] Batch run failed:', err.message)
  );
});

/** GET /api/admin/generation-status — live snapshot of every domain's pipeline stage. */
app.get('/api/admin/generation-status', requireAdminKey, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('roadmap_templates')
    .select('domain_id, generation_stage, status, last_error, stage_updated_at, domains(name, slug)')
    .order('stage_updated_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ---------------------------------------------------------------------------
// User routes — protected by requireUser (Supabase session)
// ---------------------------------------------------------------------------

/**
 * POST /api/analyze-resume — parses an uploaded PDF/DOCX and returns an ATS
 * readiness score + polished feedback. Blocking request (2–4s typical).
 */
app.post('/api/analyze-resume', requireUser, upload.single('resume'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const text    = await extractText(req.file.buffer, req.file.mimetype);

    const validation = isLikelyResume(text);
    if (!validation.valid) {
      const errorMsg = VALIDATION_ERRORS[validation.reason] || 'Invalid resume format.';
      return res.status(400).json({ error: errorMsg });
    }

    const rules   = analyzeResume(text);
    const feedback = await polishFeedback(rules);

    const { data, error } = await supabaseAdmin
      .from('resume_analyses')
      .insert({
        profile_id:    req.userId, // always from verified token, never client-supplied
        overall_score: rules.overallScore,
        section_scores: rules.sectionScores,
        feedback,
        word_count:    rules.wordCount,
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('[analyze-resume] failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend API running on http://localhost:${PORT}`));
