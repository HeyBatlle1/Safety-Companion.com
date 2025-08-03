import { db } from "./db";
import { 
  users, 
  notificationPreferences,
  analysisHistory,
  riskAssessments,
  safetyReports,
  chatMessages,
  watchedVideos,
  companies,
  projects,
  userProjectAssignments,
  type User, 
  type InsertUser,
  type NotificationPreferences,
  type InsertNotificationPreferences,
  type AnalysisHistory,
  type InsertAnalysisHistory,
  type RiskAssessment,
  type InsertRiskAssessment,
  type SafetyReport,
  type InsertSafetyReport,
  type ChatMessage,
  type InsertChatMessage,
  type WatchedVideo,
  type InsertWatchedVideo,
  type Company,
  type InsertCompany,
  type Project,
  type InsertProject
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  verifyPassword(email: string, password: string): Promise<User | null>;
  
  // Notification preferences
  getUserNotificationPreferences(userId: string): Promise<NotificationPreferences | undefined>;
  createNotificationPreferences(prefs: InsertNotificationPreferences): Promise<NotificationPreferences>;
  updateNotificationPreferences(userId: string, updates: Partial<InsertNotificationPreferences>): Promise<NotificationPreferences | undefined>;
  
  // Analysis history
  getAnalysisHistory(userId: string, limit?: number): Promise<AnalysisHistory[]>;
  createAnalysisHistory(analysis: InsertAnalysisHistory): Promise<AnalysisHistory>;
  
  // Risk assessments
  getRiskAssessments(siteId?: string): Promise<RiskAssessment[]>;
  createRiskAssessment(assessment: InsertRiskAssessment): Promise<RiskAssessment>;
  
  // Safety reports
  getSafetyReports(userId?: string): Promise<SafetyReport[]>;
  createSafetyReport(report: InsertSafetyReport): Promise<SafetyReport>;
  updateSafetyReport(id: string, updates: Partial<InsertSafetyReport>): Promise<SafetyReport | undefined>;
  
  // Chat messages
  getChatMessages(userId: string, limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Watched videos
  getWatchedVideos(userId: string): Promise<WatchedVideo[]>;
  markVideoWatched(userId: string, videoId: string): Promise<WatchedVideo>;
  
  // Companies
  getCompanies(): Promise<Company[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  
  // Projects
  getProjects(): Promise<Project[]>;
  getUserProjects(userId: string): Promise<Project[]>;
  
  // Health checks
  testConnection(): Promise<boolean>;
  getDatabaseStats(): Promise<any>;
  
  createProject(project: InsertProject): Promise<Project>;
}

export class DatabaseStorage implements IStorage {
  // User management
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(user.password, 12);
    const userWithHashedPassword = { ...user, password: hashedPassword };
    
    const result = await db.insert(users).values(userWithHashedPassword).returning();
    const newUser = result[0];
    
    // Create default notification preferences for new user
    await this.createNotificationPreferences({
      userId: newUser.id,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      certificationExpiryAlerts: true,
      certificationAlertDays: 30,
      drugScreenReminders: true,
      safetyAlerts: true,
      projectUpdates: true,
      trainingReminders: true,
    });
    
    return newUser;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    // If password is being updated, hash it
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 12);
    }
    
    const result = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  // Notification preferences
  async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences | undefined> {
    const result = await db.select().from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId)).limit(1);
    return result[0];
  }

  async createNotificationPreferences(prefs: InsertNotificationPreferences): Promise<NotificationPreferences> {
    const result = await db.insert(notificationPreferences).values(prefs).returning();
    return result[0];
  }

  async updateNotificationPreferences(userId: string, updates: Partial<InsertNotificationPreferences>): Promise<NotificationPreferences | undefined> {
    const result = await db.update(notificationPreferences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(notificationPreferences.userId, userId))
      .returning();
    return result[0];
  }

  // Analysis history
  async getAnalysisHistory(userId: string, limit: number = 50): Promise<AnalysisHistory[]> {
    return db.select().from(analysisHistory)
      .where(eq(analysisHistory.userId, userId))
      .orderBy(desc(analysisHistory.createdAt))
      .limit(limit);
  }

  async createAnalysisHistory(analysis: InsertAnalysisHistory): Promise<AnalysisHistory> {
    const result = await db.insert(analysisHistory).values(analysis).returning();
    return result[0];
  }

  // Risk assessments
  async getRiskAssessments(siteId?: string): Promise<RiskAssessment[]> {
    if (siteId) {
      return db.select().from(riskAssessments)
        .where(eq(riskAssessments.siteId, siteId))
        .orderBy(desc(riskAssessments.createdAt));
    }
    return db.select().from(riskAssessments).orderBy(desc(riskAssessments.createdAt));
  }

  async createRiskAssessment(assessment: InsertRiskAssessment): Promise<RiskAssessment> {
    const result = await db.insert(riskAssessments).values(assessment).returning();
    return result[0];
  }

  // Safety reports
  async getSafetyReports(userId?: string): Promise<SafetyReport[]> {
    if (userId) {
      return db.select().from(safetyReports)
        .where(eq(safetyReports.userId, userId))
        .orderBy(desc(safetyReports.createdAt));
    }
    return db.select().from(safetyReports).orderBy(desc(safetyReports.createdAt));
  }

  async createSafetyReport(report: InsertSafetyReport): Promise<SafetyReport> {
    const result = await db.insert(safetyReports).values(report).returning();
    return result[0];
  }

  async updateSafetyReport(id: string, updates: Partial<InsertSafetyReport>): Promise<SafetyReport | undefined> {
    const result = await db.update(safetyReports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(safetyReports.id, id))
      .returning();
    return result[0];
  }

  // Chat messages
  async getChatMessages(userId: string, limit: number = 100): Promise<ChatMessage[]> {
    return db.select().from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const result = await db.insert(chatMessages).values(message).returning();
    return result[0];
  }

  // Watched videos
  async getWatchedVideos(userId: string): Promise<WatchedVideo[]> {
    return db.select().from(watchedVideos)
      .where(eq(watchedVideos.userId, userId))
      .orderBy(desc(watchedVideos.watchedAt));
  }

  async markVideoWatched(userId: string, videoId: string): Promise<WatchedVideo> {
    // Use ON CONFLICT to handle duplicates
    const result = await db.insert(watchedVideos)
      .values({ userId, videoId })
      .onConflictDoUpdate({
        target: [watchedVideos.userId, watchedVideos.videoId],
        set: { watchedAt: new Date() }
      })
      .returning();
    return result[0];
  }

  // Companies
  async getCompanies(): Promise<Company[]> {
    return db.select().from(companies).orderBy(companies.name);
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const result = await db.insert(companies).values(company).returning();
    return result[0];
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    const result = await db.select({ 
      id: projects.id,
      name: projects.name,
      description: projects.description,
      status: projects.status,
      startDate: projects.startDate,
      endDate: projects.endDate,
      companyId: projects.companyId,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
    .from(userProjectAssignments)
    .innerJoin(projects, eq(userProjectAssignments.projectId, projects.id))
    .where(eq(userProjectAssignments.userId, userId));
    
    return result;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const result = await db.insert(projects).values(project).returning();
    return result[0];
  }

  // Health checks
  async testConnection(): Promise<boolean> {
    try {
      await db.execute('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }

  async getDatabaseStats(): Promise<any> {
    try {
      // Get user count
      const userCountResult = await db.execute('SELECT COUNT(*) FROM users');
      const userCount = parseInt(userCountResult.rows[0][0] as string);

      // Get table count from information_schema
      const tableCountResult = await db.execute(`
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      const tableCount = parseInt(tableCountResult.rows[0][0] as string);

      // Get active connections
      const connectionsResult = await db.execute(`
        SELECT COUNT(*) 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `);
      const activeConnections = parseInt(connectionsResult.rows[0][0] as string);

      // Get database version
      const versionResult = await db.execute('SELECT version()');
      const version = (versionResult.rows[0][0] as string).split(' ')[1];

      // Get uptime
      const uptimeResult = await db.execute(`
        SELECT EXTRACT(EPOCH FROM (now() - pg_postmaster_start_time())) / 3600 as uptime_hours
      `);
      const uptimeHours = Math.floor(parseFloat(uptimeResult.rows[0][0] as string));

      // Get database size
      const sizeResult = await db.execute(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `);
      const diskUsage = sizeResult.rows[0][0] as string;

      return {
        userCount,
        tableCount,
        activeConnections,
        version: `PostgreSQL ${version}`,
        uptime: `${uptimeHours} hours`,
        diskUsage
      };
    } catch (error) {
      return {
        userCount: 0,
        tableCount: 0,
        activeConnections: 0,
        version: 'Unknown',
        uptime: 'Unknown',
        diskUsage: 'Unknown'
      };
    }
  }
}

// For backward compatibility, we'll start with DatabaseStorage but could switch to MemStorage for testing
export const storage = new DatabaseStorage();
