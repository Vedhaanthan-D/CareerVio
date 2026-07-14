import { createRequire } from 'module';
import { supabaseAdmin } from './supabaseAdmin.js';

const require = createRequire(import.meta.url);

/** Domain definitions — the canonical list of tracks this platform supports. */
const DOMAIN_SEEDS = [
  // Technology — Web
  { name: 'Frontend Development',                  slug: 'frontend-development',                  description: 'Master HTML, CSS, JavaScript, React, and build beautiful interactive user interfaces.',                                                                category: 'Technology',        subcategory: 'Web Development',    icon: 'Code' },
  { name: 'Backend Development',                   slug: 'backend-development',                   description: 'Design servers, APIs, databases, authentication, and handle backend scalability.',                                                                     category: 'Technology',        subcategory: 'Web Development',    icon: 'Server' },
  { name: 'Full Stack Development',                slug: 'full-stack-development',                description: 'Learn both frontend and backend development to build and deploy complete end-to-end web apps.',                                                        category: 'Technology',        subcategory: 'Web Development',    icon: 'Layers' },
  // Technology — Mobile
  { name: 'Mobile App Development',               slug: 'mobile-app-development',                description: 'Build cross-platform mobile apps for iOS and Android using Flutter or React Native.',                                                                  category: 'Technology',        subcategory: 'Mobile Development', icon: 'Smartphone' },
  // Technology — Infrastructure
  { name: 'DevOps Engineering',                    slug: 'devops-engineering',                    description: 'Automate build pipelines, manage deployment infrastructure, and master CI/CD and containers.',                                                         category: 'Technology',        subcategory: 'Infrastructure',     icon: 'GitBranch' },
  { name: 'Cloud Computing',                       slug: 'cloud-computing',                       description: 'Architect scalable systems on AWS, Azure, or GCP, and learn cloud security and infrastructure.',                                                       category: 'Technology',        subcategory: 'Infrastructure',     icon: 'Cloud' },
  // Technology — QA / Security
  { name: 'Software Testing/QA',                  slug: 'software-testing-qa',                   description: 'Validate software quality with manual testing, automation tools, unit tests, and performance audits.',                                                 category: 'Technology',        subcategory: 'Quality Assurance',  icon: 'ShieldCheck' },
  { name: 'Cybersecurity',                         slug: 'cybersecurity',                         description: 'Secure networks, audit applications for vulnerabilities, learn penetration testing, and protect data.',                                                 category: 'Technology',        subcategory: 'Security',           icon: 'Lock' },
  // Technology — Data & AI
  { name: 'Data Science',                          slug: 'data-science',                          description: 'Clean data, perform exploratory data analysis, apply statistics, and build predictive models.',                                                        category: 'Technology',        subcategory: 'Data & AI',          icon: 'BarChart2' },
  { name: 'Machine Learning',                      slug: 'machine-learning',                      description: 'Train classification, regression, and clustering models using Scikit-Learn, Pandas, and Python.',                                                      category: 'Technology',        subcategory: 'Data & AI',          icon: 'Cpu' },
  { name: 'Artificial Intelligence / Deep Learning', slug: 'artificial-intelligence-deep-learning', description: 'Build neural networks, work with NLP/computer vision, and customize Large Language Models.',                                                       category: 'Technology',        subcategory: 'Data & AI',          icon: 'BrainCircuit' },
  { name: 'Data Engineering',                      slug: 'data-engineering',                      description: 'Design robust ETL data pipelines, manage big data warehouses, and configure orchestrators.',                                                           category: 'Technology',        subcategory: 'Data & AI',          icon: 'Database' },
  // Technology — Creative Tech
  { name: 'Game Development',                      slug: 'game-development',                      description: 'Develop immersive 2D/3D games using Unity, Unreal Engine, and C#/C++ programming.',                                                                   category: 'Technology',        subcategory: 'Creative Tech',      icon: 'Gamepad2' },
  { name: '3D Modeling & Animation',               slug: '3d-modeling-animation',                 description: 'Sculpt 3D models, create textures, rig skeletons, and render custom animations in Blender.',                                                          category: 'Technology',        subcategory: 'Creative Tech',      icon: 'Box' },
  // Technology — Web3 / Hardware
  { name: 'Blockchain Development',                slug: 'blockchain-development',                description: 'Write secure smart contracts in Solidity and build decentralized apps (dApps) on Web3.',                                                               category: 'Technology',        subcategory: 'Web3',               icon: 'Link2' },
  { name: 'Embedded Systems/IoT',                  slug: 'embedded-systems-iot',                  description: 'Program microcontrollers, design circuit boards, and write firmware to connect Internet of Things devices.',                                           category: 'Technology',        subcategory: 'Hardware',           icon: 'Workflow' },
  // Technology — CS Fundamentals
  { name: 'Data Structures & Algorithms',          slug: 'data-structures-algorithms',            description: 'Master arrays, trees, graphs, dynamic programming, and problem-solving patterns for coding interviews.',                                               category: 'Technology',        subcategory: 'CS Fundamentals',    icon: 'Network' },
  { name: 'System Design',                         slug: 'system-design',                         description: 'Design scalable, fault-tolerant distributed systems covering load balancing, caching, databases, and microservices.', category: 'Technology',        subcategory: 'CS Fundamentals',    icon: 'LayoutDashboard' },
  // Design
  { name: 'UI/UX Design',                          slug: 'ui-ux-design',                          description: 'Conduct user research, design wireframes, build high-fidelity interactive mockups in Figma.',                                                          category: 'Design',            subcategory: 'Product Design',     icon: 'Figma' },
  { name: 'Graphic Design',                        slug: 'graphic-design',                        description: 'Learn color theory, layout composition, brand typography, and master Illustrator/Photoshop.',                                                          category: 'Design',            subcategory: 'Visual Design',      icon: 'Palette' },
  { name: 'Motion Graphics & Video Editing',       slug: 'motion-graphics-video-editing',         description: 'Edit professional videos, animate motion assets, and compile digital video campaigns.',                                                                category: 'Design',            subcategory: 'Visual Design',      icon: 'Video' },
  { name: 'Product Design',                        slug: 'product-design-track',                  description: 'Structure custom design systems, model user journeys, and validate digital product heuristics.',                                                       category: 'Design',            subcategory: 'Product Design',     icon: 'Compass' },
  // Management
  { name: 'Business Analyst',                      slug: 'business-analyst',                      description: 'Map business workflows, gather functional requirements, query databases, and visualize analytics.',                                                    category: 'Management',        subcategory: 'Business & PM',      icon: 'TrendingUp' },
  { name: 'Product Management',                    slug: 'product-management',                    description: 'Define product strategy, write user stories, run A/B tests, track metrics, and lead launches.',                                                       category: 'Management',        subcategory: 'Business & PM',      icon: 'Briefcase' },
  { name: 'Digital Marketing',                     slug: 'digital-marketing',                     description: 'Optimize search engines (SEO), coordinate ad campaigns, write copy, and configure search analytics.',                                                  category: 'Management',        subcategory: 'Business & PM',      icon: 'Megaphone' },
  { name: 'Finance & Investment Banking',          slug: 'finance-investment-banking',            description: 'Analyze financial statements, build Excel DCF valuations, and learn corporate finance basics.',                                                        category: 'Management',        subcategory: 'Finance',            icon: 'DollarSign' },
  { name: 'HR Management',                         slug: 'hr-management',                         description: 'Handle corporate recruiting pipelines, employee onboarding, labor law, and performance evaluations.',                                                  category: 'Management',        subcategory: 'Operations',         icon: 'Users' },
  { name: 'Operations Management',                 slug: 'operations-management',                 description: 'Analyze supply chains, schedule logistics, reduce production waste, and optimize workflows.',                                                           category: 'Management',        subcategory: 'Operations',         icon: 'Activity' },
  { name: 'Consulting',                            slug: 'consulting',                            description: 'Master case interview frameworks, build guesstimates, structure slides, and deliver client pitches.',                                                  category: 'Management',        subcategory: 'Business & PM',      icon: 'Presentation' },
  // Core Engineering
  { name: 'Mechanical Engineering',                slug: 'mechanical-engineering',                description: 'Design structures in SolidWorks, model thermodynamics, fluid dynamics, and manufacturing setups.',                                                     category: 'Core Engineering',  subcategory: 'Engineering Tracks', icon: 'Settings' },
  { name: 'Electrical & Electronics Engineering',  slug: 'electrical-electronics-engineering',   description: 'Design analog/digital circuits, model power grids, study signals, and simulate in Matlab.',                                                            category: 'Core Engineering',  subcategory: 'Engineering Tracks', icon: 'Zap' },
  { name: 'Civil Engineering',                     slug: 'civil-engineering',                     description: 'Design buildings, compute structural loads, coordinate site surveys, and manage public works projects.',                                               category: 'Core Engineering',  subcategory: 'Engineering Tracks', icon: 'Home' },
];

/** Inserts only domain rows that don't yet exist, then upserts their roadmap templates. */
export async function seedNewDomains() {
  const { data: existing, error } = await supabaseAdmin.from('domains').select('slug');
  if (error) throw new Error(`Failed to query existing slugs: ${error.message}`);

  const existingSlugs = new Set(existing.map(d => d.slug));
  const newDomains    = DOMAIN_SEEDS.filter(d => !existingSlugs.has(d.slug));

  if (newDomains.length === 0) return { seeded: 0, slugs: [] };

  let seeds = [];
  try {
    seeds = require('../roadmap_seeds.json');
  } catch {
    console.warn('[Seeder] roadmap_seeds.json not found — domains will be inserted without roadmap templates.');
  }

  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from('domains')
    .insert(newDomains)
    .select('id, slug, name');
  if (insertErr) throw new Error(`Batch domain insert failed: ${insertErr.message}`);

  for (const domain of inserted) {
    const seedMatch = seeds.find(s => s.domainName?.toLowerCase() === domain.name.toLowerCase());
    if (!seedMatch) { console.warn(`[Seeder] No seed found for "${domain.name}" — skipping template.`); continue; }
    const { error: tplErr } = await supabaseAdmin
      .from('roadmap_templates')
      .upsert({ domain_id: domain.id, roadmap_json: seedMatch.roadmap, version: 1, status: 'published' },
              { onConflict: 'domain_id' });
    if (tplErr) console.error(`[Seeder] Template upsert failed for "${domain.name}": ${tplErr.message}`);
    else        console.log(`[Seeder] Seeded template for "${domain.name}"`);
  }

  return { seeded: newDomains.length, slugs: newDomains.map(d => d.slug) };
}
