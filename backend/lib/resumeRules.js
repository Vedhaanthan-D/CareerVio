// Patterns that signal each required resume section is present.
const SECTION_PATTERNS = {
  contact:    /[\w.+-]+@[\w-]+\.[\w.-]+/i,
  education:  /education|degree|university|college|b\.?tech|b\.?e\.?/i,
  experience: /experience|internship|worked at|project/i,
  skills:     /skills|technologies|tech stack|proficient/i,
};

const ACTION_VERBS = [
  'built', 'developed', 'led', 'designed', 'implemented', 'created',
  'managed', 'launched', 'improved', 'automated',
];

/** Pure rule-based resume analysis — returns score + feedback with no LLM call. */
export function analyzeResume(text) {
  const wordCount = text.trim().split(/\s+/).length;
  const lines = text.split('\n').filter(Boolean);
  const feedback = [];
  const sectionScores = {};

  // --- Section completeness (30 pts) ---
  let sectionPoints = 0;
  for (const [section, pattern] of Object.entries(SECTION_PATTERNS)) {
    const found = pattern.test(text);
    sectionScores[section] = found ? 1 : 0;
    if (found) sectionPoints += 7.5;
    else feedback.push(`Missing or unclear ${section} section — make sure it's clearly labeled.`);
  }

  // --- Quantified metrics (25 pts) ---
  const bulletLines = lines.filter(l => /^[•\-\*]/.test(l.trim()));
  const quantifiedBullets = bulletLines.filter(l => /\d+%|\d+\+|\$\d+|\d+x\b/.test(l));
  const unquantifiedSamples = bulletLines
    .filter(l => !/\d+%|\d+\+|\$\d+|\d+x\b/.test(l))
    .slice(0, 3)
    .map(l => l.replace(/^[•\-\*]\s*/, '').trim());
  const metricsRatio = bulletLines.length > 0 ? quantifiedBullets.length / bulletLines.length : 0;
  const metricsPoints = Math.round(metricsRatio * 25);
  if (metricsRatio < 0.3) {
    feedback.push('Few bullet points include quantified results — add specifics like "reduced load time by 40%" instead of vague claims.');
  }

  // --- Action verb variety (15 pts) ---
  const openingWords = bulletLines.map(l => l.replace(/^[•\-\*]\s*/, '').split(' ')[0].toLowerCase());
  const uniqueVerbs = new Set(openingWords.filter(w => ACTION_VERBS.includes(w)));
  const weakVerbSamples = bulletLines
    .filter(l => {
      const firstWord = l.replace(/^[•\-\*]\s*/, '').split(' ')[0].toLowerCase();
      return ACTION_VERBS.includes(firstWord);
    })
    .slice(0, 3)
    .map(l => l.replace(/^[•\-\*]\s*/, '').trim());
  const verbPoints = Math.min(15, uniqueVerbs.size * 3);
  if (uniqueVerbs.size < 3 && bulletLines.length > 3) {
    feedback.push("Bullet points repeat the same action verbs — vary your language (e.g. don't start every line with \"Developed\").");
  }

  // --- Length appropriateness (15 pts) ---
  let lengthPoints = 15;
  if (wordCount < 200) {
    lengthPoints = 5;
    feedback.push('Resume seems too short — add more detail to your experience and projects.');
  } else if (wordCount > 900) {
    lengthPoints = 8;
    feedback.push('Resume seems long — consider trimming to fit 1–2 pages for most roles.');
  }

  // --- Contact info completeness (15 pts) ---
  const hasEmail = SECTION_PATTERNS.contact.test(text);
  const hasPhone = /\+?\d[\d\s-]{8,}\d/.test(text);
  const contactPoints = (hasEmail ? 8 : 0) + (hasPhone ? 7 : 0);
  if (!hasPhone) {
    feedback.push("No phone number detected — make sure it's included and not embedded in an image/header.");
  }

  const overallScore = Math.round(sectionPoints + metricsPoints + verbPoints + lengthPoints + contactPoints);

  const categoryBreakdown = [
    { key: 'sections',  label: 'Section Completeness', score: sectionPoints, max: 30, evidence: [] },
    { key: 'metrics',   label: 'Quantified Impact',    score: metricsPoints, max: 25, evidence: unquantifiedSamples },
    { key: 'verbs',     label: 'Action Verb Variety',  score: verbPoints,    max: 15, evidence: weakVerbSamples },
    { key: 'length',    label: 'Resume Length',        score: lengthPoints,  max: 15, evidence: [] },
    { key: 'contact',   label: 'Contact Info',         score: contactPoints, max: 15, evidence: [] },
  ].map(c => ({ ...c, pct: Math.round((c.score / c.max) * 100) }));

  const pros = categoryBreakdown
    .filter(c => c.pct >= 80)
    .map(c => `${c.label} is strong (${c.score}/${c.max})`);

  const cons = categoryBreakdown
    .filter(c => c.pct < 80)
    .sort((a, b) => (b.max - b.score) - (a.max - a.score)) // sort by points lost descending
    .map(c => ({
      category: c.label,
      pointsLost: c.max - c.score,
      currentScore: `${c.score}/${c.max}`,
      evidence: c.evidence,
    }));

  const topPriority = cons[0]?.category ?? null;

  return {
    overallScore,
    categoryBreakdown,
    pros,
    cons,
    topPriority,
    sectionScores: { ...sectionScores, metricsRatio, uniqueVerbCount: uniqueVerbs.size },
    feedback: feedback.slice(0, 5),
    wordCount,
  };
}
