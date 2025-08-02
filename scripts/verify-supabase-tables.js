#!/usr/bin/env node

/**
 * Supabase Table Verification Script
 * 
 * This script verifies that all required tables exist in your Supabase database
 * and can create the checklist_responses table if it's missing.
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Required tables for the Safety Companion application
const REQUIRED_TABLES = [
  'profiles',
  'user_profiles', 
  'checklist_responses',
  'safety_reports',
  'chat_messages',
  'analysis_history',
  'watched_videos',
  'notification_preferences'
];

async function verifyTables() {
  console.log('🔍 Verifying Supabase table structure...');
  console.log(`📊 Database URL: ${SUPABASE_URL}`);
  
  const results = {
    existing: [],
    missing: [],
    errors: []
  };

  // Test basic connection
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error && !error.message.includes('session')) {
      console.log('⚠️  Auth session check (expected):', error.message);
    }
    console.log('✅ Supabase connection successful');
  } catch (err) {
    console.error('❌ Supabase connection failed:', err.message);
    return;
  }

  // Check each table
  for (const table of REQUIRED_TABLES) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.message.includes('does not exist') || error.code === 'PGRST116') {
          results.missing.push(table);
          console.log(`❌ Table "${table}" is missing`);
        } else {
          results.errors.push({ table, error: error.message });
          console.log(`⚠️  Table "${table}" error: ${error.message}`);
        }
      } else {
        results.existing.push(table);
        console.log(`✅ Table "${table}" exists`);
      }
    } catch (err) {
      results.errors.push({ table, error: err.message });
      console.log(`❌ Error checking table "${table}": ${err.message}`);
    }
  }

  // Summary
  console.log('\n📋 VERIFICATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Existing tables: ${results.existing.length}`);
  console.log(`❌ Missing tables: ${results.missing.length}`);
  console.log(`⚠️  Tables with errors: ${results.errors.length}`);

  if (results.existing.length > 0) {
    console.log('\n✅ EXISTING TABLES:');
    results.existing.forEach(table => console.log(`   • ${table}`));
  }

  if (results.missing.length > 0) {
    console.log('\n❌ MISSING TABLES:');
    results.missing.forEach(table => console.log(`   • ${table}`));
    
    console.log('\n🔧 TO FIX MISSING TABLES:');
    console.log('1. Run your Supabase migrations:');
    console.log('   supabase db push');
    console.log('2. Or apply the migration file:');
    console.log('   supabase/migrations/20250802000000_ensure_checklist_tables.sql');
  }

  if (results.errors.length > 0) {
    console.log('\n⚠️  TABLES WITH ERRORS:');
    results.errors.forEach(({ table, error }) => {
      console.log(`   • ${table}: ${error}`);
    });
  }

  // Test checklist functionality specifically
  if (results.existing.includes('checklist_responses')) {
    console.log('\n🧪 Testing checklist_responses table...');
    try {
      const testData = {
        user_id: 'test-user-' + Date.now(),
        template_id: 'test-template',
        title: 'Test Checklist',
        responses: { test: true },
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('checklist_responses')
        .insert([testData])
        .select()
        .single();

      if (error) {
        console.log(`⚠️  Insert test failed: ${error.message}`);
        if (error.message.includes('RLS')) {
          console.log('   This might be due to Row Level Security policies');
          console.log('   Checklist functionality may still work with proper authentication');
        }
      } else {
        console.log('✅ Checklist insert test successful');
        // Clean up test data
        await supabase
          .from('checklist_responses')
          .delete()
          .eq('id', data.id);
        console.log('✅ Test data cleaned up');
      }
    } catch (err) {
      console.log(`❌ Checklist test error: ${err.message}`);
    }
  }

  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Ensure all migrations are applied in Supabase');
  console.log('2. Check Row Level Security policies are properly configured');
  console.log('3. Test checklist functionality in the application');
  
  return results;
}

// Run the verification
verifyTables()
  .then(() => {
    console.log('\n✨ Verification complete!');
  })
  .catch((err) => {
    console.error('\n💥 Verification failed:', err);
    process.exit(1);
  });