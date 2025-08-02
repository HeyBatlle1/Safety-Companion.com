import { pgTable, text, serial, integer, boolean, uuid, timestamp, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User profiles table (equivalent to Supabase auth.users + user_profiles)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("field_worker").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  employeeId: text("employee_id"),
  department: text("department"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

// Notification preferences
export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  emailNotifications: boolean("email_notifications").default(true),
  smsNotifications: boolean("sms_notifications").default(false),
  pushNotifications: boolean("push_notifications").default(true),
  certificationExpiryAlerts: boolean("certification_expiry_alerts").default(true),
  certificationAlertDays: integer("certification_alert_days").default(30),
  drugScreenReminders: boolean("drug_screen_reminders").default(true),
  safetyAlerts: boolean("safety_alerts").default(true),
  projectUpdates: boolean("project_updates").default(true),
  trainingReminders: boolean("training_reminders").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

// Analysis history for chat and assessments
export const analysisHistory = pgTable("analysis_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  response: text("response").notNull(),
  type: text("type").notNull(), // 'safety_assessment', 'risk_assessment', 'sds_analysis', 'chat_response'
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

// Risk assessments
export const riskAssessments = pgTable("risk_assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: text("site_id").notNull(),
  assessment: jsonb("assessment").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

// Safety reports
export const safetyReports = pgTable("safety_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  severity: text("severity").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  status: text("status").default("pending").notNull(),
  attachments: jsonb("attachments"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

// Chat messages
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  text: text("text").notNull(),
  sender: text("sender").notNull(),
  attachments: jsonb("attachments"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Watched videos tracking
export const watchedVideos = pgTable("watched_videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  videoId: text("video_id").notNull(),
  watchedAt: timestamp("watched_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint on userId and videoId combination
  userVideoUnique: uniqueIndex().on(table.userId, table.videoId),
}));

// Companies (if referenced in the project)
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

// Projects
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("active").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  companyId: uuid("company_id").references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

// User project assignments
export const userProjectAssignments = pgTable("user_project_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  role: text("role").default("member"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnalysisHistorySchema = createInsertSchema(analysisHistory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRiskAssessmentSchema = createInsertSchema(riskAssessments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSafetyReportSchema = createInsertSchema(safetyReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertWatchedVideoSchema = createInsertSchema(watchedVideos).omit({
  id: true,
  createdAt: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;

export type InsertAnalysisHistory = z.infer<typeof insertAnalysisHistorySchema>;
export type AnalysisHistory = typeof analysisHistory.$inferSelect;

export type InsertRiskAssessment = z.infer<typeof insertRiskAssessmentSchema>;
export type RiskAssessment = typeof riskAssessments.$inferSelect;

export type InsertSafetyReport = z.infer<typeof insertSafetyReportSchema>;
export type SafetyReport = typeof safetyReports.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type InsertWatchedVideo = z.infer<typeof insertWatchedVideoSchema>;
export type WatchedVideo = typeof watchedVideos.$inferSelect;

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
