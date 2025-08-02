import supabase, { getCurrentUser } from './supabase';

interface ChecklistResponse {
  id: string;
  templateId: string;
  title: string;
  responses: Record<string, any>;
  timestamp: string;
}

// Save checklist responses
export const saveChecklistResponse = async (
  templateId: string,
  title: string,
  responses: Record<string, any>
): Promise<ChecklistResponse> => {
  try {
    // Use anonymous user approach for demo - create a consistent demo user ID
    const demoUserId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const user = { id: demoUserId, email: 'demo@safety-companion.com' };
    
    const timestamp = new Date().toISOString();
    
    // Save to Supabase
    const { data, error } = await supabase
      .from('checklist_responses')
      .insert([
        {
          user_id: user.id,
          template_id: templateId,
          title: title,
          responses: responses,
          updated_at: timestamp
        }
      ])
      .select()
      .single();
      
    if (error) throw error;
    
    // Return formatted data
    return {
      id: data.id,
      templateId: data.template_id,
      title: data.title,
      responses: data.responses,
      timestamp: data.created_at
    };
  } catch (error) {
    console.error('Error saving checklist to Supabase:', error);
    throw error;
  }
};

// Get checklist response history
export const getChecklistResponseHistory = async (templateId: string): Promise<ChecklistResponse[]> => {
  try {
    // Use anonymous user approach for demo - create a consistent demo user ID
    const demoUserId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const user = { id: demoUserId, email: 'demo@safety-companion.com' };
    
    // Get from Supabase
    const { data, error } = await supabase
      .from('checklist_responses')
      .select('*')
      .eq('template_id', templateId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    // Return formatted data
    return data.map(item => ({
      id: item.id,
      templateId: item.template_id,
      title: item.title,
      responses: item.responses,
      timestamp: item.created_at
    }));
  } catch (error) {
    console.error('Error getting checklist history:', error);
    throw error;
  }
};

export default {
  saveChecklistResponse,
  getChecklistResponseHistory
};