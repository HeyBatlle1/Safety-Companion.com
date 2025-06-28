// This is a Supabase Edge Function that can run database schema fixes

// Follow Supabase Edge Function format
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

interface SchemaFixRequest {
  fix: boolean; // Whether to actually apply fixes or just report issues
}

serve(async (req) => {
  try {
    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Content-Type": "application/json",
    };

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders, status: 204 });
    }
    
    // Parse request body
    const body: SchemaFixRequest = await req.json();
    const shouldFix = !!body.fix;
    
    // Get auth header for authentication
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing or invalid token' }),
        { headers: corsHeaders, status: 401 }
      );
    }

    // Initialize Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        }
      }
    );
    
    // Results will track all issues and fixes
    const results = {
      checkTime: new Date().toISOString(),
      missingTables: [],
      missingColumns: [],
      fixedTables: [],
      fixedColumns: [],
      errors: []
    };

    // Check required tables
    const requiredTables = [
      'user_profiles',
      'notification_preferences',
      'safety_reports',
      'analysis_history',
      'chat_messages',
      'risk_assessments',
      'watched_videos'
    ];
    
    // Get existing tables
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
      
    if (tablesError) {
      results.errors.push(`Error checking tables: ${tablesError.message}`);
    } else {
      const existingTables = tables.map(t => t.table_name);
      
      for (const table of requiredTables) {
        if (!existingTables.includes(table)) {
          results.missingTables.push(table);
          
          // Create missing tables if fix is enabled
          if (shouldFix) {
            try {
              // Create the table with minimal structure based on its name
              await createMissingTable(supabaseAdmin, table);
              results.fixedTables.push(table);
            } catch (error) {
              results.errors.push(`Error creating table ${table}: ${error.message}`);
            }
          }
        }
      }
    }
    
    // Check required columns for key tables
    const requiredColumns: Record<string, string[]> = {
      'user_profiles': ['id', 'role', 'created_at', 'is_active'],
      'notification_preferences': [
        'user_id', 'email_notifications', 'push_notifications',
        'certification_expiry_alerts', 'safety_alerts'
      ],
      'analysis_history': ['user_id', 'query', 'response', 'type', 'created_at']
    };
    
    // Only check columns for tables that exist
    for (const table of Object.keys(requiredColumns)) {
      // Skip if table is missing and we're not fixing
      if (results.missingTables.includes(table) && !results.fixedTables.includes(table)) {
        continue;
      }
      
      const { data: columns, error: columnsError } = await supabaseAdmin
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_schema', 'public')
        .eq('table_name', table);
        
      if (columnsError) {
        results.errors.push(`Error checking columns for ${table}: ${columnsError.message}`);
        continue;
      }
      
      const existingColumns = columns.map(c => c.column_name);
      
      for (const column of requiredColumns[table]) {
        if (!existingColumns.includes(column)) {
          results.missingColumns.push({ table, column });
          
          // Add missing columns if fix is enabled
          if (shouldFix) {
            try {
              await addMissingColumn(supabaseAdmin, table, column);
              results.fixedColumns.push({ table, column });
            } catch (error) {
              results.errors.push(`Error adding column ${column} to ${table}: ${error.message}`);
            }
          }
        }
      }
    }
    
    // Create summary message
    let message = 'Database schema check completed.';
    if (results.missingTables.length > 0 || results.missingColumns.length > 0) {
      message += ` Issues found: ${results.missingTables.length} missing tables, ${results.missingColumns.length} missing columns.`;
      
      if (shouldFix) {
        message += ` Fixed: ${results.fixedTables.length} tables, ${results.fixedColumns.length} columns.`;
      } else {
        message += ' No fixes applied (dry run).';
      }
      
      if (results.errors.length > 0) {
        message += ` Encountered ${results.errors.length} errors.`;
      }
    } else {
      message += ' No issues found.';
    }
    
    results.message = message;
    
    return new Response(
      JSON.stringify(results),
      { headers: corsHeaders, status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        stack: error.stack
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});

// Helper function to create a missing table
async function createMissingTable(supabase, tableName: string) {
  // Basic table definitions based on common application needs
  let sql = '';
  
  switch (tableName) {
    case 'user_profiles':
      sql = `
        CREATE TABLE IF NOT EXISTS user_profiles (
          id UUID REFERENCES auth.users(id) PRIMARY KEY,
          role TEXT DEFAULT 'field_worker',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
          updated_at TIMESTAMPTZ
        );
        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view their own profile" 
          ON user_profiles FOR SELECT 
          USING (auth.uid() = id);
        CREATE POLICY "Users can update their own profile" 
          ON user_profiles FOR UPDATE 
          USING (auth.uid() = id);
      `;
      break;
    
    case 'notification_preferences':
      sql = `
        CREATE TABLE IF NOT EXISTS notification_preferences (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
          email_notifications BOOLEAN DEFAULT true,
          sms_notifications BOOLEAN DEFAULT false,
          push_notifications BOOLEAN DEFAULT true,
          certification_expiry_alerts BOOLEAN DEFAULT true,
          certification_alert_days INTEGER DEFAULT 30,
          drug_screen_reminders BOOLEAN DEFAULT true,
          safety_alerts BOOLEAN DEFAULT true,
          project_updates BOOLEAN DEFAULT true,
          training_reminders BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
          updated_at TIMESTAMPTZ
        );
        ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can manage their own notification preferences" 
          ON notification_preferences FOR ALL 
          USING (user_id = auth.uid());
      `;
      break;
    
    case 'risk_assessments':
      sql = `
        CREATE TABLE IF NOT EXISTS risk_assessments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          site_id TEXT NOT NULL,
          assessment JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
          updated_at TIMESTAMPTZ
        );
        ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view risk assessments" 
          ON risk_assessments FOR SELECT 
          TO authenticated 
          USING (true);
        CREATE POLICY "Users can create risk assessments" 
          ON risk_assessments FOR INSERT 
          TO authenticated 
          WITH CHECK (true);
      `;
      break;
    
    case 'analysis_history':
      sql = `
        CREATE TABLE IF NOT EXISTS analysis_history (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          query TEXT NOT NULL,
          response TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('safety_assessment', 'risk_assessment', 'sds_analysis', 'chat_response')),
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
          updated_at TIMESTAMPTZ
        );
        ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can manage their own analysis history" 
          ON analysis_history FOR ALL 
          USING (user_id = auth.uid() OR user_id IS NULL);
        CREATE POLICY "Allow insert even when user_id is null" 
          ON analysis_history FOR INSERT 
          TO authenticated 
          WITH CHECK (true);
      `;
      break;
    
    case 'watched_videos':
      sql = `
        CREATE TABLE IF NOT EXISTS watched_videos (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) NOT NULL,
          video_id TEXT NOT NULL,
          watched_at TIMESTAMPTZ DEFAULT now() NOT NULL,
          created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
          UNIQUE(user_id, video_id)
        );
        ALTER TABLE watched_videos ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can insert their own watch records"
          ON watched_videos
          FOR INSERT
          WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can view their own watch records"
          ON watched_videos
          FOR SELECT
          USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete their own watch records"
          ON watched_videos
          FOR DELETE
          USING (auth.uid() = user_id);
      `;
      break;
    
    case 'chat_messages':
      sql = `
        CREATE TABLE IF NOT EXISTS chat_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
          user_id UUID REFERENCES auth.users(id) NOT NULL,
          text TEXT NOT NULL,
          sender TEXT NOT NULL,
          attachments JSONB
        );
        ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view their own chat messages" 
          ON chat_messages FOR SELECT 
          USING (user_id = auth.uid());
        CREATE POLICY "Users can insert chat messages" 
          ON chat_messages FOR INSERT 
          WITH CHECK (user_id = auth.uid());
      `;
      break;
    
    case 'safety_reports':
      sql = `
        CREATE TABLE IF NOT EXISTS safety_reports (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
          user_id UUID REFERENCES auth.users(id) NOT NULL,
          severity TEXT NOT NULL,
          category TEXT NOT NULL,
          description TEXT NOT NULL,
          location TEXT,
          status TEXT DEFAULT 'pending' NOT NULL,
          updated_at TIMESTAMPTZ,
          attachments JSONB
        );
        ALTER TABLE safety_reports ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view all safety reports" 
          ON safety_reports FOR SELECT 
          TO authenticated 
          USING (true);
        CREATE POLICY "Users can insert their own safety reports" 
          ON safety_reports FOR INSERT 
          WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update their own safety reports" 
          ON safety_reports FOR UPDATE 
          USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete their own safety reports" 
          ON safety_reports FOR DELETE 
          USING (auth.uid() = user_id);
      `;
      break;
    
    default:
      throw new Error(`No definition available for table: ${tableName}`);
  }
  
  // Execute the SQL
  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) throw error;
}

// Helper function to add a missing column
async function addMissingColumn(supabase, tableName: string, columnName: string) {
  // Define column types and defaults based on common patterns
  let columnDefinition = '';
  
  switch (columnName) {
    // Common ID columns
    case 'id':
      columnDefinition = 'UUID PRIMARY KEY DEFAULT gen_random_uuid()';
      break;
    
    case 'user_id':
      columnDefinition = 'UUID REFERENCES auth.users(id) ON DELETE CASCADE';
      break;
    
    // Common boolean columns
    case 'is_active':
    case 'is_archived':
    case 'is_deleted':
    case 'is_public':
    case 'email_notifications':
    case 'sms_notifications':
    case 'push_notifications':
    case 'certification_expiry_alerts':
    case 'drug_screen_reminders':
    case 'safety_alerts':
    case 'project_updates':
    case 'training_reminders':
      columnDefinition = 'BOOLEAN DEFAULT false';
      break;
    
    // Common numeric columns
    case 'certification_alert_days':
      columnDefinition = 'INTEGER DEFAULT 30';
      break;
    
    // Common text columns
    case 'role':
      columnDefinition = 'TEXT DEFAULT \'field_worker\'';
      break;
    
    case 'status':
      columnDefinition = 'TEXT DEFAULT \'pending\'';
      break;
    
    case 'query':
    case 'response':
    case 'description':
    case 'text':
      columnDefinition = 'TEXT';
      break;
    
    case 'type':
      if (tableName === 'analysis_history') {
        columnDefinition = 'TEXT CHECK (type IN (\'safety_assessment\', \'risk_assessment\', \'sds_analysis\', \'chat_response\'))';
      } else {
        columnDefinition = 'TEXT';
      }
      break;
    
    // Common JSON columns
    case 'metadata':
    case 'attachments':
    case 'assessment':
      columnDefinition = 'JSONB';
      break;
    
    // Common date columns
    case 'created_at':
    case 'updated_at':
    case 'watched_at':
    case 'last_message_at':
      columnDefinition = 'TIMESTAMPTZ' + (columnName === 'created_at' ? ' DEFAULT now() NOT NULL' : '');
      break;
    
    default:
      columnDefinition = 'TEXT'; // Default to TEXT for unknown columns
  }
  
  // SQL to add the column
  const sql = `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${columnName} ${columnDefinition};`;
  
  // Execute the SQL
  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) throw error;
}