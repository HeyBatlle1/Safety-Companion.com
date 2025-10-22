import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_DATABASE_URL;

if (!supabaseUrl) {
  console.error('❌ SUPABASE_DATABASE_URL not found');
  process.exit(1);
}

const pool = new Pool({
  connectionString: supabaseUrl,
  ssl: { rejectUnauthorized: false },
});

async function checkTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking Supabase tables...\n');
    
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📋 Existing tables in Supabase:');
    result.rows.forEach((row: any) => {
      console.log(`  - ${row.table_name}`);
    });
    
    console.log(`\n✅ Found ${result.rows.length} tables`);
    
    // Check specific tables we need
    const needed = ['users', 'user_profiles', 'analysis_history', 'agent_outputs', 'jha_updates'];
    const existing = result.rows.map((r: any) => r.table_name);
    const missing = needed.filter(t => !existing.includes(t));
    
    if (missing.length > 0) {
      console.log(`\n⚠️  Missing tables: ${missing.join(', ')}`);
    } else {
      console.log('\n✅ All required tables exist!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTables();
