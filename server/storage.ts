import { createClient } from '@supabase/supabase-js';
import type {
  User,
  InsertUser,
  SafetyChecklist,
  InsertSafetyChecklist,
  JhaForm,
  InsertJhaForm,
  ChatSession,
  InsertChatSession,
  SafetyIncident,
  InsertSafetyIncident,
  AnalysisHistory,
  InsertAnalysisHistory,
  TrainingRecord,
  InsertTrainingRecord,
} from '@shared/schema';

// Supabase client for server-side operations
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase environment variables are required');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | null>;
  updateUserLoginAttempts(id: string, attempts: number, lockedUntil?: Date): Promise<void>;
  getAllUsers(): Promise<User[]>;

  // Safety checklist operations
  createSafetyChecklist(checklist: InsertSafetyChecklist): Promise<SafetyChecklist>;
  getSafetyChecklistById(id: string): Promise<SafetyChecklist | null>;
  getSafetyChecklistsByUser(userId: string): Promise<SafetyChecklist[]>;
  updateSafetyChecklist(id: string, updates: Partial<InsertSafetyChecklist>): Promise<SafetyChecklist | null>;
  deleteSafetyChecklist(id: string): Promise<boolean>;

  // JHA form operations
  createJhaForm(form: InsertJhaForm): Promise<JhaForm>;
  getJhaFormById(id: string): Promise<JhaForm | null>;
  getJhaFormsByUser(userId: string): Promise<JhaForm[]>;
  updateJhaForm(id: string, updates: Partial<InsertJhaForm>): Promise<JhaForm | null>;
  deleteJhaForm(id: string): Promise<boolean>;

  // Analytics and reporting
  getSafetyMetrics(): Promise<{
    totalIncidents: number;
    incidentRate: number;
    safetyScore: number;
    trainingCompliance: number;
  }>;
  
  getUserActivityStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    recentLogins: number;
  }>;
}

export class SupabaseStorage implements IStorage {
  // User operations
  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('profiles')
      .insert(user)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
    return data;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No row found
      }
      throw new Error(`Failed to get user by email: ${error.message}`);
    }
    return data;
  }

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No row found
      }
      throw new Error(`Failed to get user by id: ${error.message}`);
    }
    return data;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
    return data;
  }

  async updateUserLoginAttempts(id: string, attempts: number, lockedUntil?: Date): Promise<void> {
    const updateData: any = {
      failed_login_attempts: attempts,
      updated_at: new Date().toISOString()
    };
    
    if (lockedUntil) {
      updateData.account_locked_until = lockedUntil.toISOString();
    }
    
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to update login attempts: ${error.message}`);
    }
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to get all users: ${error.message}`);
    }
    return data || [];
  }

  // Safety checklist operations
  async createSafetyChecklist(checklist: InsertSafetyChecklist): Promise<SafetyChecklist> {
    const { data, error } = await supabase
      .from('safety_checklists')
      .insert(checklist)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create safety checklist: ${error.message}`);
    }
    return data;
  }

  async getSafetyChecklistById(id: string): Promise<SafetyChecklist | null> {
    const { data, error } = await supabase
      .from('safety_checklists')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get safety checklist: ${error.message}`);
    }
    return data;
  }

  async getSafetyChecklistsByUser(userId: string): Promise<SafetyChecklist[]> {
    const { data, error } = await supabase
      .from('safety_checklists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to get safety checklists: ${error.message}`);
    }
    return data || [];
  }

  async updateSafetyChecklist(id: string, updates: Partial<InsertSafetyChecklist>): Promise<SafetyChecklist | null> {
    const { data, error } = await supabase
      .from('safety_checklists')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update safety checklist: ${error.message}`);
    }
    return data;
  }

  async deleteSafetyChecklist(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('safety_checklists')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete safety checklist: ${error.message}`);
    }
    return true;
  }

  // JHA form operations
  async createJhaForm(form: InsertJhaForm): Promise<JhaForm> {
    const { data, error } = await supabase
      .from('jha_forms')
      .insert(form)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create JHA form: ${error.message}`);
    }
    return data;
  }

  async getJhaFormById(id: string): Promise<JhaForm | null> {
    const { data, error } = await supabase
      .from('jha_forms')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get JHA form: ${error.message}`);
    }
    return data;
  }

  async getJhaFormsByUser(userId: string): Promise<JhaForm[]> {
    const { data, error } = await supabase
      .from('jha_forms')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to get JHA forms: ${error.message}`);
    }
    return data || [];
  }

  async updateJhaForm(id: string, updates: Partial<InsertJhaForm>): Promise<JhaForm | null> {
    const { data, error } = await supabase
      .from('jha_forms')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update JHA form: ${error.message}`);
    }
    return data;
  }

  async deleteJhaForm(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('jha_forms')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete JHA form: ${error.message}`);
    }
    return true;
  }

  // Analytics and reporting
  async getSafetyMetrics(): Promise<{
    totalIncidents: number;
    incidentRate: number;
    safetyScore: number;
    trainingCompliance: number;
  }> {
    // Get safety reports count
    const { count: totalIncidents } = await supabase
      .from('safety_reports')
      .select('*', { count: 'exact', head: true });

    // Get active users count for incident rate calculation
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const incidentRate = activeUsers ? (totalIncidents || 0) / activeUsers * 100000 : 0;
    const safetyScore = Math.max(0, 100 - (incidentRate * 2)); // Simple calculation
    const trainingCompliance = 87; // Mock value - would need training completion data

    return {
      totalIncidents: totalIncidents || 0,
      incidentRate: Number(incidentRate.toFixed(1)),
      safetyScore: Number(safetyScore.toFixed(1)),
      trainingCompliance
    };
  }

  async getUserActivityStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    recentLogins: number;
  }> {
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Users who logged in within the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { count: recentLogins } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_login_at', sevenDaysAgo.toISOString());

    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      recentLogins: recentLogins || 0
    };
  }
}

export const storage = new SupabaseStorage();