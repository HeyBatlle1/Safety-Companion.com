import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from '@shared/schema';
import type {
  User,
  InsertUser,
  UserProfile,
  InsertUserProfile,
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
import { eq, and, desc, gte, lte } from 'drizzle-orm';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | null>;
  updateUserLoginAttempts(id: string, attempts: number, lockedUntil?: Date): Promise<void>;

  // User profile operations
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  getUserProfile(userId: string): Promise<UserProfile | null>;
  updateUserProfile(userId: string, updates: Partial<InsertUserProfile>): Promise<UserProfile | null>;
  getAllUserProfiles(): Promise<UserProfile[]>;

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

  // Chat session operations
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSessionById(id: string): Promise<ChatSession | null>;
  getChatSessionsByUser(userId: string): Promise<ChatSession[]>;
  updateChatSession(id: string, updates: Partial<InsertChatSession>): Promise<ChatSession | null>;
  deleteChatSession(id: string): Promise<boolean>;

  // Safety incident operations
  createSafetyIncident(incident: InsertSafetyIncident): Promise<SafetyIncident>;
  getSafetyIncidentById(id: string): Promise<SafetyIncident | null>;
  getSafetyIncidentsByUser(userId: string): Promise<SafetyIncident[]>;
  getAllSafetyIncidents(): Promise<SafetyIncident[]>;
  updateSafetyIncident(id: string, updates: Partial<InsertSafetyIncident>): Promise<SafetyIncident | null>;

  // Analysis history operations
  createAnalysisHistory(analysis: InsertAnalysisHistory): Promise<AnalysisHistory>;
  getAnalysisHistoryById(id: string): Promise<AnalysisHistory | null>;
  getAnalysisHistoryByUser(userId: string): Promise<AnalysisHistory[]>;
  getAnalysisHistoryByTimeframe(timeframe: string): Promise<AnalysisHistory[]>;
  updateAnalysisHistory(id: string, updates: Partial<InsertAnalysisHistory>): Promise<AnalysisHistory | null>;

  // Training record operations
  createTrainingRecord(record: InsertTrainingRecord): Promise<TrainingRecord>;
  getTrainingRecordsByUser(userId: string): Promise<TrainingRecord[]>;
  updateTrainingRecord(id: string, updates: Partial<InsertTrainingRecord>): Promise<TrainingRecord | null>;

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

export class PostgreSQLStorage implements IStorage {
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(schema.users).values(user).returning();
    return newUser;
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return user[0] || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    return user[0] || null;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | null> {
    const [updatedUser] = await db
      .update(schema.users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return updatedUser || null;
  }

  async updateUserLoginAttempts(id: string, attempts: number, lockedUntil?: Date): Promise<void> {
    await db
      .update(schema.users)
      .set({ loginAttempts: attempts, lockedUntil, updatedAt: new Date() })
      .where(eq(schema.users.id, id));
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [newProfile] = await db.insert(schema.userProfiles).values(profile).returning();
    return newProfile;
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const profile = await db
      .select()
      .from(schema.userProfiles)
      .where(eq(schema.userProfiles.userId, userId))
      .limit(1);
    return profile[0] || null;
  }

  async updateUserProfile(userId: string, updates: Partial<InsertUserProfile>): Promise<UserProfile | null> {
    const [updatedProfile] = await db
      .update(schema.userProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.userProfiles.userId, userId))
      .returning();
    return updatedProfile || null;
  }

  async getAllUserProfiles(): Promise<UserProfile[]> {
    return await db.select().from(schema.userProfiles);
  }

  async createSafetyChecklist(checklist: InsertSafetyChecklist): Promise<SafetyChecklist> {
    const [newChecklist] = await db.insert(schema.safetyChecklists).values(checklist).returning();
    return newChecklist;
  }

  async getSafetyChecklistById(id: string): Promise<SafetyChecklist | null> {
    const checklist = await db
      .select()
      .from(schema.safetyChecklists)
      .where(eq(schema.safetyChecklists.id, id))
      .limit(1);
    return checklist[0] || null;
  }

  async getSafetyChecklistsByUser(userId: string): Promise<SafetyChecklist[]> {
    return await db
      .select()
      .from(schema.safetyChecklists)
      .where(eq(schema.safetyChecklists.userId, userId))
      .orderBy(desc(schema.safetyChecklists.createdAt));
  }

  async updateSafetyChecklist(id: string, updates: Partial<InsertSafetyChecklist>): Promise<SafetyChecklist | null> {
    const [updatedChecklist] = await db
      .update(schema.safetyChecklists)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.safetyChecklists.id, id))
      .returning();
    return updatedChecklist || null;
  }

  async deleteSafetyChecklist(id: string): Promise<boolean> {
    const result = await db.delete(schema.safetyChecklists).where(eq(schema.safetyChecklists.id, id));
    return result.rowCount > 0;
  }

  async createJhaForm(form: InsertJhaForm): Promise<JhaForm> {
    const [newForm] = await db.insert(schema.jhaForms).values(form).returning();
    return newForm;
  }

  async getJhaFormById(id: string): Promise<JhaForm | null> {
    const form = await db.select().from(schema.jhaForms).where(eq(schema.jhaForms.id, id)).limit(1);
    return form[0] || null;
  }

  async getJhaFormsByUser(userId: string): Promise<JhaForm[]> {
    return await db
      .select()
      .from(schema.jhaForms)
      .where(eq(schema.jhaForms.userId, userId))
      .orderBy(desc(schema.jhaForms.createdAt));
  }

  async updateJhaForm(id: string, updates: Partial<InsertJhaForm>): Promise<JhaForm | null> {
    const [updatedForm] = await db
      .update(schema.jhaForms)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.jhaForms.id, id))
      .returning();
    return updatedForm || null;
  }

  async deleteJhaForm(id: string): Promise<boolean> {
    const result = await db.delete(schema.jhaForms).where(eq(schema.jhaForms.id, id));
    return result.rowCount > 0;
  }

  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const [newSession] = await db.insert(schema.chatSessions).values(session).returning();
    return newSession;
  }

  async getChatSessionById(id: string): Promise<ChatSession | null> {
    const session = await db
      .select()
      .from(schema.chatSessions)
      .where(eq(schema.chatSessions.id, id))
      .limit(1);
    return session[0] || null;
  }

  async getChatSessionsByUser(userId: string): Promise<ChatSession[]> {
    return await db
      .select()
      .from(schema.chatSessions)
      .where(eq(schema.chatSessions.userId, userId))
      .orderBy(desc(schema.chatSessions.updatedAt));
  }

  async updateChatSession(id: string, updates: Partial<InsertChatSession>): Promise<ChatSession | null> {
    const [updatedSession] = await db
      .update(schema.chatSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.chatSessions.id, id))
      .returning();
    return updatedSession || null;
  }

  async deleteChatSession(id: string): Promise<boolean> {
    const result = await db.delete(schema.chatSessions).where(eq(schema.chatSessions.id, id));
    return result.rowCount > 0;
  }

  async createSafetyIncident(incident: InsertSafetyIncident): Promise<SafetyIncident> {
    const [newIncident] = await db.insert(schema.safetyIncidents).values(incident).returning();
    return newIncident;
  }

  async getSafetyIncidentById(id: string): Promise<SafetyIncident | null> {
    const incident = await db
      .select()
      .from(schema.safetyIncidents)
      .where(eq(schema.safetyIncidents.id, id))
      .limit(1);
    return incident[0] || null;
  }

  async getSafetyIncidentsByUser(userId: string): Promise<SafetyIncident[]> {
    return await db
      .select()
      .from(schema.safetyIncidents)
      .where(eq(schema.safetyIncidents.userId, userId))
      .orderBy(desc(schema.safetyIncidents.createdAt));
  }

  async getAllSafetyIncidents(): Promise<SafetyIncident[]> {
    return await db
      .select()
      .from(schema.safetyIncidents)
      .orderBy(desc(schema.safetyIncidents.createdAt));
  }

  async updateSafetyIncident(id: string, updates: Partial<InsertSafetyIncident>): Promise<SafetyIncident | null> {
    const [updatedIncident] = await db
      .update(schema.safetyIncidents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.safetyIncidents.id, id))
      .returning();
    return updatedIncident || null;
  }

  async createAnalysisHistory(analysis: InsertAnalysisHistory): Promise<AnalysisHistory> {
    const [newAnalysis] = await db.insert(schema.analysisHistory).values(analysis).returning();
    return newAnalysis;
  }

  async getAnalysisHistoryById(id: string): Promise<AnalysisHistory | null> {
    const analysis = await db
      .select()
      .from(schema.analysisHistory)
      .where(eq(schema.analysisHistory.id, id))
      .limit(1);
    return analysis[0] || null;
  }

  async getAnalysisHistoryByUser(userId: string): Promise<AnalysisHistory[]> {
    return await db
      .select()
      .from(schema.analysisHistory)
      .where(eq(schema.analysisHistory.userId, userId))
      .orderBy(desc(schema.analysisHistory.createdAt));
  }

  async getAnalysisHistoryByTimeframe(timeframe: string): Promise<AnalysisHistory[]> {
    return await db
      .select()
      .from(schema.analysisHistory)
      .where(eq(schema.analysisHistory.timeframe, timeframe))
      .orderBy(desc(schema.analysisHistory.createdAt));
  }

  async updateAnalysisHistory(id: string, updates: Partial<InsertAnalysisHistory>): Promise<AnalysisHistory | null> {
    const [updatedAnalysis] = await db
      .update(schema.analysisHistory)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.analysisHistory.id, id))
      .returning();
    return updatedAnalysis || null;
  }

  async createTrainingRecord(record: InsertTrainingRecord): Promise<TrainingRecord> {
    const [newRecord] = await db.insert(schema.trainingRecords).values(record).returning();
    return newRecord;
  }

  async getTrainingRecordsByUser(userId: string): Promise<TrainingRecord[]> {
    return await db
      .select()
      .from(schema.trainingRecords)
      .where(eq(schema.trainingRecords.userId, userId))
      .orderBy(desc(schema.trainingRecords.watchedAt));
  }

  async updateTrainingRecord(id: string, updates: Partial<InsertTrainingRecord>): Promise<TrainingRecord | null> {
    const [updatedRecord] = await db
      .update(schema.trainingRecords)
      .set(updates)
      .where(eq(schema.trainingRecords.id, id))
      .returning();
    return updatedRecord || null;
  }

  async getSafetyMetrics(): Promise<{
    totalIncidents: number;
    incidentRate: number;
    safetyScore: number;
    trainingCompliance: number;
  }> {
    // Calculate safety metrics based on recent data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalIncidents = await db
      .select()
      .from(schema.safetyIncidents)
      .where(gte(schema.safetyIncidents.createdAt, thirtyDaysAgo));

    const allUsers = await db.select().from(schema.users);
    const completedTraining = await db
      .select()
      .from(schema.trainingRecords)
      .where(eq(schema.trainingRecords.completed, true));

    const incidentRate = totalIncidents.length > 0 ? (totalIncidents.length / 100000) * 100 : 0;
    const safetyScore = Math.max(0, 100 - (incidentRate * 10));
    const trainingCompliance = allUsers.length > 0 ? (completedTraining.length / allUsers.length) * 100 : 0;

    return {
      totalIncidents: totalIncidents.length,
      incidentRate: Number(incidentRate.toFixed(2)),
      safetyScore: Number(safetyScore.toFixed(1)),
      trainingCompliance: Number(trainingCompliance.toFixed(1)),
    };
  }

  async getUserActivityStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    recentLogins: number;
  }> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const totalUsers = await db.select().from(schema.users);
    const activeUsers = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.isActive, true));
    const recentLogins = await db
      .select()
      .from(schema.users)
      .where(gte(schema.users.lastLogin, sevenDaysAgo));

    return {
      totalUsers: totalUsers.length,
      activeUsers: activeUsers.length,
      recentLogins: recentLogins.length,
    };
  }
}

// Export a singleton instance
export const storage = new PostgreSQLStorage();