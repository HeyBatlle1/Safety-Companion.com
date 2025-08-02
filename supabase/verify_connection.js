// Safe verification script - READ ONLY operations
// This script only checks connection and existing schema - NO DATA CHANGES

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyConnection() {
  console.log('🔍 Verifying Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('user_profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('⚠️  Could not access user_profiles table:', error.message);
    } else {
      console.log('✅ Connection successful - user_profiles table accessible');
      console.log(`📊 Found ${data.length} user profiles (approximate)`);
    }

    // Try to check a few core tables safely
    const tablesToCheck = ['user_profiles', 'safety_reports', 'chat_messages', 'analysis_history'];
    const existingTables = [];
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (!error) {
          existingTables.push(table);
        }
      } catch (e) {
        // Table might not exist, which is fine
      }
    }

    console.log('📋 Existing tables found:', existingTables.length > 0 ? existingTables.join(', ') : 'None accessible with current permissions');

    // Test auth status
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.log('ℹ️  Auth check: No active session (normal for server environment)');
    }

    console.log('\n🎯 Supabase Configuration Status:');
    console.log('• URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('• Anon Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
    console.log('• Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '⚠️  Missing (needed for admin operations)');
    
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

verifyConnection();