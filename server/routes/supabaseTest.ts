import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabaseDb } from '../db';

const router = Router();

// Create Supabase client for auth testing
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const supabaseServiceClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

/**
 * Comprehensive Supabase connection diagnostics
 * Tests: environment variables, database connectivity, auth service, table access
 */
router.get('/api/supabase/test', async (req, res) => {
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: {
      supabaseUrl: !!supabaseUrl,
      supabaseUrlValue: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING',
      anonKey: !!supabaseAnonKey,
      serviceKey: !!supabaseServiceKey,
      databaseUrl: !!process.env.SUPABASE_DATABASE_URL
    },
    tests: {}
  };

  // Test 1: Database connection via Drizzle
  try {
    const dbTest = await supabaseDb.execute('SELECT 1 as test');
    results.tests.drizzleConnection = {
      success: true,
      message: 'Drizzle database connection working',
      result: dbTest
    };
  } catch (error: any) {
    results.tests.drizzleConnection = {
      success: false,
      error: error.message
    };
  }

  // Test 2: Auth service health check
  try {
    const { data, error } = await supabaseClient.auth.getSession();
    results.tests.authService = {
      success: !error,
      message: error ? error.message : 'Auth service responding',
      hasSession: !!data.session
    };
  } catch (error: any) {
    results.tests.authService = {
      success: false,
      error: error.message
    };
  }

  // Test 3: Table access with anon key
  try {
    const { data, error, count } = await supabaseClient
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });
    
    results.tests.tableAccessAnon = {
      success: !error,
      message: error ? error.message : 'Table accessible with anon key',
      count: count
    };
  } catch (error: any) {
    results.tests.tableAccessAnon = {
      success: false,
      error: error.message
    };
  }

  // Test 4: Table access with service key
  try {
    const { data, error, count } = await supabaseServiceClient
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });
    
    results.tests.tableAccessService = {
      success: !error,
      message: error ? error.message : 'Table accessible with service key',
      count: count
    };
  } catch (error: any) {
    results.tests.tableAccessService = {
      success: false,
      error: error.message
    };
  }

  // Test 5: Check specific tables exist
  const tablesToCheck = ['user_profiles', 'jha_updates', 'analysis_history', 'agent_outputs'];
  results.tests.tablesExist = {};
  
  for (const table of tablesToCheck) {
    try {
      const { error } = await supabaseServiceClient
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      results.tests.tablesExist[table] = !error;
    } catch (error: any) {
      results.tests.tablesExist[table] = false;
    }
  }

  // Overall health
  results.overallHealth = {
    healthy: results.tests.drizzleConnection?.success && 
             results.tests.authService?.success &&
             results.tests.tableAccessService?.success,
    summary: `${Object.values(results.tests).filter((t: any) => t.success).length} of ${Object.keys(results.tests).length} tests passed`
  };

  res.json(results);
});

/**
 * Test authentication endpoint
 * Attempts to sign in with provided credentials
 */
router.post('/api/supabase/test-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password required',
        received: { email: !!email, password: !!password }
      });
    }

    console.log('🔐 Testing login for:', email);

    // Test with anon key (client-side simulation)
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Login failed:', error);
      return res.status(401).json({
        success: false,
        error: error.message,
        details: error
      });
    }

    if (data.user) {
      console.log('✅ Login successful for:', data.user.email);
      
      // Try to fetch user profile
      const { data: profile, error: profileError } = await supabaseServiceClient
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      return res.json({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          hasSession: !!data.session
        },
        profile: profile,
        profileError: profileError?.message || null
      });
    }

    res.json({ success: false, error: 'No user returned' });
  } catch (error: any) {
    console.error('❌ Login test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

export default router;
