// Analysis history service - using local storage until backend is ready

export interface AnalysisRecord {
  id?: string;
  user_id?: string;
  query: string;
  response: string;
  timestamp: string;
  type: 'safety_assessment' | 'sds_analysis' | 'risk_assessment' | 'chat_response';
  metadata?: Record<string, any>;
}

// Get history from localStorage
const getLocalAnalysisHistory = (): AnalysisRecord[] => {
  try {
    const history = localStorage.getItem('analysis_history');
    if (!history) return [];
    const records = JSON.parse(history);
    return Array.isArray(records) ? records : [];
  } catch (error) {
    console.error('Error reading analysis history:', error);
    return [];
  }
};

/**
 * Save an analysis record to history
 */
export const saveAnalysisToHistory = async (
  analysis: Omit<AnalysisRecord, 'id' | 'user_id' | 'timestamp'>
): Promise<AnalysisRecord> => {
  try {
    // Create the record object
    const record: AnalysisRecord = {
      ...analysis,
      id: `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    
    // Get existing records
    const existingRecords = getLocalAnalysisHistory();
    
    // Add new record to the beginning
    existingRecords.unshift(record);
    
    // Keep only the last 100 records to prevent localStorage overflow
    const trimmedRecords = existingRecords.slice(0, 100);
    
    // Save back to localStorage
    localStorage.setItem('analysis_history', JSON.stringify(trimmedRecords));
    
    return record;
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
 * Get analysis history
 */
export const getAnalysisHistory = async (
  type?: AnalysisRecord['type'],
  limit: number = 50
): Promise<AnalysisRecord[]> => {
  try {
    const allRecords = getLocalAnalysisHistory();
    
    // Filter by type if specified
    let filtered = type 
      ? allRecords.filter(record => record.type === type)
      : allRecords;
    
    // Apply limit
    return filtered.slice(0, limit);
  } catch (error) {
    console.error('Error getting analysis history:', error);
    return [];
  }
};

/**
 * Clear analysis history
 */
export const clearAnalysisHistory = async (type?: AnalysisRecord['type']): Promise<boolean> => {
  try {
    if (type) {
      // Clear only specific type
      const allRecords = getLocalAnalysisHistory();
      const filtered = allRecords.filter(record => record.type !== type);
      localStorage.setItem('analysis_history', JSON.stringify(filtered));
    } else {
      // Clear all history
      localStorage.removeItem('analysis_history');
    }
    return true;
  } catch (error) {
    console.error('Error clearing analysis history:', error);
    return false;
  }
};

/**
 * Get a single analysis record by ID
 */
export const getAnalysisById = async (id: string): Promise<AnalysisRecord | null> => {
  try {
    const allRecords = getLocalAnalysisHistory();
    return allRecords.find(record => record.id === id) || null;
  } catch (error) {
    console.error('Error getting analysis by ID:', error);
    return null;
  }
};

/**
 * Delete an analysis record by ID
 */
export const deleteAnalysisRecord = async (id: string): Promise<boolean> => {
  try {
    const allRecords = getLocalAnalysisHistory();
    const filtered = allRecords.filter(record => record.id !== id);
    
    if (filtered.length === allRecords.length) {
      return false; // Record not found
    }
    
    localStorage.setItem('analysis_history', JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting analysis record:', error);
    return false;
  }
};