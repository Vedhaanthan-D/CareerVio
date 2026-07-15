/**
 * Validation thresholds and patterns for determining if a document is a resume.
 */
const MIN_WORD_COUNT = 50;
const MAX_WORD_COUNT = 3000;
const MIN_MATCHED_SECTIONS = 2;
const MIN_LINES_FOR_STRUCTURE_CHECK = 15;
const MIN_BULLET_RATIO = 0.05;

const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]+/i;

const SECTION_CATEGORIES = {
  contact: EMAIL_PATTERN,
  education: /education|degree|university|college/i,
  experience: /experience|internship|worked at|project/i,
  skills: /skills|technologies|tech stack|proficient/i,
};

export const VALIDATION_ERRORS = {
  too_short: 'This file looks too short to be a resume. Please upload a complete resume.',
  too_long: 'This file is much longer than a typical resume. Please upload a resume, not a report or document.',
  no_contact_info: "We couldn't find an email address in this file. Please upload a resume that includes your contact details.",
  missing_sections: "This doesn't look like a resume — couldn't detect education, experience, or skills sections.",
  not_structured: "This file doesn't look like a resume — resumes are usually bullet-pointed and structured.",
};

/** Checks if the word count is within the required range. */
function validateWordCount(wordCount) {
  if (wordCount < MIN_WORD_COUNT) return 'too_short';
  if (wordCount > MAX_WORD_COUNT) return 'too_long';
  return null;
}

/** Checks if the text has sufficient section matches. */
function validateSections(text) {
  if (!EMAIL_PATTERN.test(text)) return 'no_contact_info';
  const matchCount = Object.values(SECTION_CATEGORIES).filter(regex => regex.test(text)).length;
  if (matchCount < MIN_MATCHED_SECTIONS) return 'missing_sections';
  return null;
}

/** Checks if the document structure has a reasonable ratio of bullet points. */
function validateStructure(text) {
  const nonEmptyLines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const totalLines = nonEmptyLines.length;
  if (totalLines <= MIN_LINES_FOR_STRUCTURE_CHECK) return null;

  const bulletCount = nonEmptyLines.filter(line => /^[•\-\*]/.test(line)).length;
  if (bulletCount / totalLines < MIN_BULLET_RATIO) return 'not_structured';
  return null;
}

/** Validates whether the given text exhibits standard characteristics of a resume. */
export function isLikelyResume(text) {
  const words = text ? text.trim().split(/\s+/).filter(Boolean) : [];
  const reason = validateWordCount(words.length) || validateSections(text) || validateStructure(text);
  return reason ? { valid: false, reason } : { valid: true };
}
