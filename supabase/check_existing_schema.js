// SAFE READ-ONLY schema inspection - no data changes
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectExistingSchema() {
  console.log('🔍 Inspecting existing database schema...\n');
  
  const existingTables = ['safety_reports', 'chat_messages', 'analysis_history'];
  
  for (const tableName of existingTables) {
    try {
      console.log(`📋 Table: ${tableName}`);
      
      // Get one sample record to see the structure (safe - no sensitive data exposed)
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
      if (error) {
        console.log(`  ❌ Error: ${error.message}`);
        continue;
      }
      
      if (data && data.length > 0) {
        const sample = data[0];
        const columns = Object.keys(sample);
        console.log(`  📊 Columns found: ${columns.join(', ')}`);
        
        // Check for foreign key patterns
        const foreignKeys = columns.filter(col => 
          col.includes('user_id') || col.includes('profile_id') || col.includes('auth_')
        );
        if (foreignKeys.length > 0) {
          console.log(`  🔗 Foreign key columns: ${foreignKeys.join(', ')}`);
        }
      } else {
        console.log('  📭 Table exists but no data found');
      }
      
      console.log(''); // Empty line for readability
      
    } catch (error) {
      console.log(`  ❌ Could not inspect ${tableName}: ${error.message}\n`);
    }
  }
}

inspectExistingSchema();