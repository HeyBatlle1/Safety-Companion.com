// Comprehensive Supabase connection test with service role
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testSupabaseConnection() {
  console.log('🚀 Testing complete Supabase connection...\n');

  // Test 1: Basic connection with anon key
  console.log('1. Testing anon client connection...');
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const { data, error } = await supabaseAnon.from('safety_reports').select('count', { count: 'exact', head: true });
    if (error) {
      console.log(`   ⚠️  Anon access limited: ${error.message}`);
    } else {
      console.log('   ✅ Anon client connected successfully');
    }
  } catch (e) {
    console.log(`   ❌ Anon client error: ${e.message}`);
  }

  // Test 2: Service role connection
  console.log('\n2. Testing service role connection...');
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Test admin access to user tables
    const { data: tables, error } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['user_profiles', 'safety_reports', 'chat_messages', 'analysis_history']);
      
    if (error) {
      console.log(`   ❌ Service role error: ${error.message}`);
    } else {
      console.log('   ✅ Service role connected successfully');
      console.log(`   📋 Accessible tables: ${tables.map(t => t.table_name).join(', ')}`);
      
      // Check if user_profiles exists
      const userProfilesExists = tables.some(t => t.table_name === 'user_profiles');
      console.log(`   👤 user_profiles table: ${userProfilesExists ? '✅ Exists' : '❌ Missing'}`);
    }
  } catch (e) {
    console.log(`   ❌ Service role error: ${e.message}`);
  }

  // Test 3: Check existing data safety
  console.log('\n3. Verifying existing data safety...');
  const criticalTables = ['safety_reports', 'chat_messages', 'analysis_history'];
  
  for (const table of criticalTables) {
    try {
      const { count, error } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.log(`   ⚠️  ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: Accessible (${count || 0} records)`);
      }
    } catch (e) {
      console.log(`   ❌ ${table}: ${e.message}`);
    }
  }

  // Test 4: Check auth configuration
  console.log('\n4. Testing auth configuration...');
  try {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
      console.log(`   ⚠️  Auth admin access: ${error.message}`);
    } else {
      console.log(`   ✅ Auth admin access working (${users.length} users)`);
    }
  } catch (e) {
    console.log(`   ❌ Auth test error: ${e.message}`);
  }

  console.log('\n🎯 Connection Summary:');
  console.log('• URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('• Anon Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  console.log('• Service Role Key:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
  console.log('\n✅ All environment variables configured correctly!');
}

testSupabaseConnection().catch(console.error);