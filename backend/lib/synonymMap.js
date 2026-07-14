/**
 * Manual synonym map for cross-domain duplicate topics.
 * Maps known alternate phrasings to a single canonical topic_key.
 * Add entries here as new domains reveal more overlapping topics.
 */

const SYNONYM_MAP = {
  // Git / Version Control
  'git-basics':               'git-version-control',
  'git-and-version-control':  'git-version-control',
  'version-control-with-git': 'git-version-control',
  'git-fundamentals':         'git-version-control',
  'git-github':               'git-version-control',
  'version-control':          'git-version-control',

  // REST APIs
  'rest-api-fundamentals':     'rest-api-basics',
  'restful-apis':              'rest-api-basics',
  'restful-api-design':        'rest-api-basics',
  'api-design-rest':           'rest-api-basics',
  'building-rest-apis':        'rest-api-basics',

  // SQL / Databases
  'sql-basics':                'sql-fundamentals',
  'sql-and-databases':         'sql-fundamentals',
  'relational-databases':      'sql-fundamentals',
  'database-fundamentals':     'sql-fundamentals',
  'introduction-to-sql':       'sql-fundamentals',

  // HTTP
  'http-fundamentals':         'http-basics',
  'http-and-the-web':          'http-basics',
  'how-the-web-works':         'http-basics',
  'http-https-basics':         'http-basics',

  // Testing basics
  'testing-basics':            'software-testing-fundamentals',
  'unit-testing':              'software-testing-fundamentals',
  'introduction-to-testing':   'software-testing-fundamentals',
  'testing-fundamentals':      'software-testing-fundamentals',

  // Linux / Command Line
  'linux-basics':              'linux-command-line',
  'command-line-basics':       'linux-command-line',
  'terminal-basics':           'linux-command-line',

  // Python basics
  'python-basics':             'python-fundamentals',
  'introduction-to-python':    'python-fundamentals',
  'python-programming-basics': 'python-fundamentals',

  // JavaScript basics
  'javascript-basics':         'javascript-fundamentals',
  'introduction-to-javascript':'javascript-fundamentals',
  'js-basics':                 'javascript-fundamentals',
};

/**
 * Resolves a normalized topic key to its canonical form via the synonym map.
 * Falls back to the original key if no synonym exists.
 */
export function resolveCanonicalKey(normalizedKey) {
  return SYNONYM_MAP[normalizedKey] ?? normalizedKey;
}
