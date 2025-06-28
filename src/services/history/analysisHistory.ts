import { getCurrentUser } from '../supabase';
import { supabase } from '../supabase';

export interface AnalysisRecord {
  id?: string;
  user_id?: string;
  query: string;
  response: string;
  timestamp: string;
  type: 'safety_assessment' | 'sds_analysis' | 'risk_assessment' | 'chat_response';
  metadata?: Record<string, any>;
}

/**
 * Save an analysis record to history
 */
export const saveAnalysisToHistory = async (
  analysis: Omit<AnalysisRecord, 'id' | 'user_id' | 'timestamp'>
): Promise<AnalysisRecord> => {
  try {
    const user = await getCurrentUser();
    
    // Create the record object
    const record: AnalysisRecord = {
      ...analysis,
      user_id: user?.id,
      timestamp: new Date().toISOString()
    };
    
    // Try to save to Supabase if user is authenticated
    if (user) {
      try {
        const { data, error } = await supabase
          .from('analysis_history')
          .insert([{
            user_id: user.id,
            query: record.query,
            response: record.response,
            type: record.type,
            metadata: record.metadata || {}
          }])
          .select();
          
        if (error) {
          console.error('Supabase error saving history:', error);
          // Fall back to localStorage below
        } else if (data && data.length > 0) {
          return {
            id: data[0].id,
            user_id: data[0].user_id,
            query: data[0].query,
            response: data[0].response,
            timestamp: data[0].created_at,
            type: data[0].type as AnalysisRecord['type'],
            metadata: data[0].metadata
          };
        }
      } catch (error) {
        console.error('Error saving analysis to Supabase:', error);
        // Fall back to localStorage
      }
    }
    
    // Save to localStorage as fallback
    const localId = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const localRecord = { ...record, id: localId };
    
    // Get existing records
    const existingRecords = getLocalAnalysisHistory();
    
    // Add new record to the beginning
    existingRecords.unshift(localRecord);
    
    // Keep only the last 100 records to prevent localStorage overflow
    const trimmedRecords = existingRecords.slice(0, 100);
    
    // Save back to localStorage
    localStorage.setItem('analysis_history', JSON.stringify(trimmedRecords));
    
    return localRecord;
  } catch (error) {
    console.error('Error saving analysis to history:', error);
    // Return the original record instead of throwing to prevent breaking the app flow
    return {
      id: `local_fallback_${Date.now()}`,
      query: analysis.query,
      response: analysis.response,
      type: analysis.type,
      timestamp: new Date().toISOString(),
      metadata: analysis.metadata
    };
  }
};

/**
 * Get analysis history from localStorage
 */
const getLocalAnalysisHistory = (): AnalysisRecord[] => {
  try {
    const historyJson = localStorage.getItem('analysis_history');
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error('Error reading analysis history from localStorage:', error);
    return [];
  }
};

/**
 * Get analysis history for the current user
 */
export const getAnalysisHistory = async (
  type?: AnalysisRecord['type'],
  limit = 50
): Promise<AnalysisRecord[]> => {
  try {
    const user = await getCurrentUser();
    
    if (user) {
      try {
        let query = supabase
          .from('analysis_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit);
          
        if (type) {
          query = query.eq('type', type);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Supabase error fetching history:', error);
          // Fall back to localStorage below
        } else if (data) {
          return data.map(item => ({
            id: item.id,
            user_id: item.user_id,
            query: item.query,
            response: item.response,
            timestamp: item.created_at,
            type: item.type as AnalysisRecord['type'],
            metadata: item.metadata
          }));
        }
      } catch (error) {
        console.error('Error fetching analysis history from Supabase:', error);
        // Fall back to localStorage
      }
    }
    
    // Get from localStorage
    let records = getLocalAnalysisHistory();
    
    // Filter by type if specified
    if (type) {
      records = records.filter(record => record.type === type);
    }
    
    // Apply limit
    return records.slice(0, limit);
  } catch (error) {
    console.error('Error getting analysis history:', error);
    return [];
  }
};

/**
 * Delete an analysis record
 */
export const deleteAnalysisRecord = async (id: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    
    if (user) {
      try {
        const { error } = await supabase
          .from('analysis_history')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
          
        if (error) {
          console.error('Supabase error deleting record:', error);
          // Fall back to localStorage below
        } else {
          // Also remove from localStorage if exists
          removeLocalRecord(id);
          return true;
        }
      } catch (error) {
        console.error('Error deleting analysis record from Supabase:', error);
        // Fall back to localStorage
      }
    }
    
    // Delete from localStorage
    return removeLocalRecord(id);
  } catch (error) {
    console.error('Error deleting analysis record:', error);
    return false;
  }
};

// Helper to remove record from localStorage
const removeLocalRecord = (id: string): boolean => {
  try {
    const records = getLocalAnalysisHistory();
    const filteredRecords = records.filter(record => record.id !== id);
    
    if (records.length === filteredRecords.length) {
      return false; // Record not found
    }
    
    localStorage.setItem('analysis_history', JSON.stringify(filteredRecords));
    return true;
  } catch (error) {
    console.error('Error removing record from localStorage:', error);
    return false;
  }
};

/**
 * Clear all analysis history
 */
export const clearAnalysisHistory = async (type?: AnalysisRecord['type']): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    
    if (user) {
      try {
        let query = supabase
          .from('analysis_history')
          .delete()
          .eq('user_id', user.id);
          
        if (type) {
          query = query.eq('type', type);
        }
        
        const { error } = await query;
        
        if (error) {
          console.error('Supabase error clearing history:', error);
          // Continue to clear localStorage even if Supabase fails
        }
      } catch (error) {
        console.error('Error clearing analysis history from Supabase:', error);
        // Continue to clear localStorage even if Supabase fails
      }
    }
    
    // Clear from localStorage
    if (type) {
      const records = getLocalAnalysisHistory();
      const filteredRecords = records.filter(record => record.type !== type);
      localStorage.setItem('analysis_history', JSON.stringify(filteredRecords));
    } else {
      localStorage.removeItem('analysis_history');
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing analysis history:', error);
    return false;
  }
};