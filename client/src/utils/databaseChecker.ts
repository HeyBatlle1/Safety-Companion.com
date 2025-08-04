import supabase from '../services/supabase';

/**
 * Utility to check if database tables and columns expected by the application actually exist
 */
export async function checkDatabaseSchema(): Promise<{
  success: boolean;
  missingTables: string[];
  missingColumns: { table: string; column: string }[];
  message: string;
}> {
  try {
    // List of essential tables the application expects
    const requiredTables = [
      'user_profiles',
      'notification_preferences',
      'safety_reports',
      'analysis_history',
      'chat_messages',
      'risk_assessments',
      'watched_videos'
    ];
    
    // Check which tables exist
    let tableData;
    let tableError;
    
    try {
      // Try to use RPC function first (safer approach)
      const result = await supabase.rpc('get_tables');
      if (result.data && !result.error) {
        tableData = result.data.map((tableName: string) => ({ table_name: tableName }));
        tableError = null;
      } else {
        // Fall back to direct query if RPC fails
        const schemaResult = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public');
          
        tableData = schemaResult.data;
        tableError = schemaResult.error;
      }
    } catch (error) {
      
      // Try alternate approach for checking tables
      try {
        const result = await supabase.rpc('get_tables');
        tableData = result.data?.map((t: string) => ({ table_name: t }));
        tableError = result.error;
      } catch (rpcError) {
        
        tableError = rpcError;
      }
    }
    
    if (tableError) {
      
      return {
        success: false,
        missingTables: requiredTables,
        missingColumns: [],
        message: 'Unable to check database schema: ' + tableError.message
      };
    }
    
    const existingTables = tableData?.map(t => t.table_name) || [];
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    // Define required columns for key tables
    const requiredColumns: Record<string, string[]> = {
      'user_profiles': ['id', 'role', 'created_at'],
      'notification_preferences': ['user_id', 'email_notifications', 'push_notifications'],
      'analysis_history': ['user_id', 'query', 'response', 'type']
    };
    
    // Check which columns exist for tables that do exist
    const missingColumns: { table: string; column: string }[] = [];
    
    // Only check columns for tables that actually exist
    const tablesToCheck = Object.keys(requiredColumns).filter(
      table => !missingTables.includes(table)
    );
    
    for (const table of tablesToCheck) {
      try {
        const { data: columnData, error: columnError } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_schema', 'public')
          .eq('table_name', table);
          
        if (columnError) {
          
          continue;
        }
        
        const existingColumns = columnData?.map(c => c.column_name) || [];
        const tableRequiredColumns = requiredColumns[table];
        
        for (const column of tableRequiredColumns) {
          if (!existingColumns.includes(column)) {
            missingColumns.push({ table, column });
          }
        }
      } catch (error) {
        
      }
    }
    
    const success = missingTables.length === 0 && missingColumns.length === 0;
    let message = success 
      ? 'Database schema is compatible with the application'
      : 'Database schema has issues that may affect application functionality';
      
    return {
      success,
      missingTables,
      missingColumns,
      message
    };
  } catch (error) {
    
    return {
      success: false,
      missingTables: [],
      missingColumns: [],
      message: 'Failed to check database schema due to an unexpected error'
    };
  }
}

/**
 * Check database connectivity and authentication status
 */
export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  authenticated: boolean;
  message: string;
}> {
  try {
    // Check basic connectivity with a simple query
    let connectError;
    try {
      // Try to query user_profiles which should exist and have RLS
      const result = await supabase
        .from('user_profiles')
        .select('count', { count: 'exact', head: true })
        .limit(1);
      
      connectError = result.error;
      
      // If we get a "relation does not exist" error, try another approach
      if (connectError && connectError.code === '42P01') {
        // Try querying auth.users which should always exist in Supabase
        const authResult = await supabase.auth.getSession();
        connectError = authResult.error;
      }
    } catch (error) {
      connectError = error;
    }
    
    // Consider connected if no error or if error is just about permissions or missing table
    const connected = !connectError || 
                      connectError.code === '42P01' || // Table doesn't exist
                      connectError.code === '42501';   // Permission denied
    
    // Check authentication
    let authData, authError;
    try {
      const result = await supabase.auth.getUser();
      authData = result.data;
      authError = result.error;
    } catch (error) {
      authError = error;
    }

    const authenticated = !!authData?.user && !authError;
    
    let message = '';
    if (!connected) {
      message = 'Unable to connect to the database: ' + (connectError?.message || 'Unknown error');
    } else if (!authenticated) {
      message = 'Connected to database but not authenticated: ' + (authError?.message || 'No user session');
    } else {
      message = 'Successfully connected to database and authenticated as ' + authData.user.email;
    }
    
    return { connected, authenticated, message };
  } catch (error) {
    
    return {
      connected: false,
      authenticated: false,
      message: 'Failed to check database connection: ' + (error instanceof Error ? error.message : 'Unknown error')
    };
  }
}

export default {
  checkDatabaseSchema,
  checkDatabaseConnection
};