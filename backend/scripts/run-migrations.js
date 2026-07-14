import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbPassword = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabaseUrl = process.env.SUPABASE_URL;

// Extract project reference from URL
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
const host = 'aws-0-ap-south-1.pooler.supabase.com';
const username = `postgres.${projectRef}`;

console.log(`Connecting to Postgres Pooler host: ${host} as ${username}...`);

const sql = postgres({
  host,
  port: 6543,
  database: 'postgres',
  username: username,
  password: dbPassword,
  ssl: 'require'
});

/** Runs the database migration queries. */
async function runMigrations() {
  try {
    console.log('Adding weekly_goal to profiles...');
    await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weekly_goal INT DEFAULT 5;`;
    
    console.log('Adding target_completion_date to profiles...');
    await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_completion_date DATE;`;

    console.log('Creating resume_analyses table...');
    await sql`
      CREATE TABLE IF NOT EXISTS resume_analyses (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
        overall_score int,
        section_scores jsonb,
        feedback jsonb,
        word_count int,
        created_at timestamp DEFAULT now()
      );
    `;

    console.log('Enabling Row Level Security on resume_analyses...');
    await sql`ALTER TABLE resume_analyses ENABLE ROW LEVEL SECURITY;`;

    console.log('Creating policy for Users manage own analyses...');
    await sql`
      DROP POLICY IF EXISTS "Users manage own analyses" ON resume_analyses;
      CREATE POLICY "Users manage own analyses"
        ON resume_analyses FOR ALL
        USING (auth.uid() = profile_id)
        WITH CHECK (auth.uid() = profile_id);
    `;

    console.log('Granting privileges on resume_analyses...');
    await sql`GRANT SELECT, INSERT ON public.resume_analyses TO authenticated;`;
    await sql`GRANT ALL ON public.resume_analyses TO service_role;`;
    
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await sql.end();
  }
}

runMigrations();
