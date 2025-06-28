import supabase from '../../services/supabase';
import { RiskAssessment } from '../../types/safety';
import { showToast } from '../../components/common/ToastContainer';

export class DatabaseHandler {
  async saveRiskAssessment(siteId: string, assessment: RiskAssessment): Promise<void> {
    try {
      // Validate inputs
      if (!siteId || !assessment) {
        console.error('Invalid inputs for saveRiskAssessment');
        throw new Error('Invalid risk assessment data');
      }

      // Convert to string if not already
      const site_id = typeof siteId === 'string' ? siteId : String(siteId);
      
      // Make sure assessment is serializable
      const sanitizedAssessment = JSON.parse(JSON.stringify(assessment));
      
      try {
        // Check if the risk_assessments table exists
        const { count, error: countError } = await supabase
          .from('risk_assessments')
          .select('*', { count: 'exact', head: true });
        
        if (countError && countError.code === '42P01') {
          console.error('risk_assessments table does not exist:', countError);
          showToast('Database table missing, using local storage instead', 'warning');
          this.saveToLocalStorage(site_id, assessment);
          return;
        }
        
        // Proceed with insertion
        const { error } = await supabase
          .from('risk_assessments')
          .insert({
            site_id,
            assessment: sanitizedAssessment,
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error('Database error saving assessment:', error);
          showToast('Error saving to database, using local storage instead', 'warning');
          this.saveToLocalStorage(site_id, assessment);
        } else {
          console.log('Risk assessment saved to database successfully');
        }
      } catch (dbError) {
        console.error('Exception saving risk assessment to DB:', dbError);
        this.saveToLocalStorage(site_id, assessment);
      }
    } catch (error) {
      console.error('Error saving risk assessment:', error);
      
      // Use localStorage as fallback
      if (siteId) {
        this.saveToLocalStorage(siteId, assessment);
      }
    }
  }

  async getRecentAssessments(siteId: string): Promise<RiskAssessment[]> {
    try {
      // Validate input
      if (!siteId) {
        console.error('Invalid siteId for getRecentAssessments');
        return this.getFromLocalStorage(siteId);
      }

      // Convert to string if not already
      const site_id = typeof siteId === 'string' ? siteId : String(siteId);
      
      try {
        // Check if the risk_assessments table exists
        const { count, error: countError } = await supabase
          .from('risk_assessments')
          .select('*', { count: 'exact', head: true });
        
        if (countError && countError.code === '42P01') {
          console.error('risk_assessments table does not exist:', countError);
          return this.getFromLocalStorage(site_id);
        }
        
        // Proceed with query
        const { data, error } = await supabase
          .from('risk_assessments')
          .select('*')
          .eq('site_id', site_id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Database error fetching assessments:', error);
          return this.getFromLocalStorage(site_id);
        }

        if (!data || data.length === 0) {
          return this.getFromLocalStorage(site_id);
        }

        // Parse assessments from JSON data
        const assessments = data.map(row => {
          try {
            // If assessment is already an object, use it
            if (typeof row.assessment === 'object' && row.assessment !== null) {
              return row.assessment as RiskAssessment;
            }
            // Otherwise parse from string
            return JSON.parse(row.assessment) as RiskAssessment;
          } catch (e) {
            console.error('Error parsing assessment:', e);
            return null;
          }
        }).filter(Boolean) as RiskAssessment[];
        
        return assessments;
      } catch (dbError) {
        console.error('Exception fetching assessments from DB:', dbError);
        return this.getFromLocalStorage(site_id);
      }
    } catch (error) {
      console.error('Error fetching recent assessments:', error);
      return this.getFromLocalStorage(siteId);
    }
  }

  // Helper methods for localStorage fallback
  private saveToLocalStorage(siteId: string, assessment: RiskAssessment): void {
    try {
      const key = `risk_assessment_${siteId}_${Date.now()}`;
      localStorage.setItem(key, JSON.stringify({
        assessment,
        createdAt: new Date().toISOString()
      }));
      
      // Keep track of keys for this site ID
      const keysForSiteKey = `risk_assessment_keys_${siteId}`;
      const existingKeys = JSON.parse(localStorage.getItem(keysForSiteKey) || '[]');
      existingKeys.push(key);
      
      // Keep only the 10 most recent keys
      const recentKeys = existingKeys.slice(-10);
      localStorage.setItem(keysForSiteKey, JSON.stringify(recentKeys));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  private getFromLocalStorage(siteId: string): RiskAssessment[] {
    try {
      const keysForSiteKey = `risk_assessment_keys_${siteId}`;
      const keys = JSON.parse(localStorage.getItem(keysForSiteKey) || '[]');
      
      return keys
        .map(key => {
          try {
            const item = localStorage.getItem(key);
            if (!item) return null;
            const data = JSON.parse(item);
            return data.assessment;
          } catch (e) {
            console.error(`Error parsing localStorage item for key ${key}:`, e);
            return null;
          }
        })
        .filter(Boolean)
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
    } catch (e) {
      console.error('Failed to retrieve from localStorage:', e);
      return [];
    }
  }

  // Method to clear all risk assessments (for testing/admin purposes)
  async clearAllAssessments(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('risk_assessments')
        .delete()
        .gte('created_at', '2000-01-01');
        
      if (error) {
        console.error('Error clearing DB assessments:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error clearing assessments:', error);
      return false;
    }
  }
}