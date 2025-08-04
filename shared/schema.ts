import { pgTable, text, serial, integer, boolean, uuid, timestamp, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";
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
  lastLoginAt: timestamp("last_login_at"),
  loginCount: integer("login_count").default(0),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  accountLockedUntil: timestamp("account_locked_until"),
  passwordChangedAt: timestamp("password_changed_at"),
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

// Analysis history for chat and assessments - Enhanced for insurance analytics
export const analysisHistory = pgTable("analysis_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  response: text("response").notNull(),
  type: text("type").notNull(), // 'safety_assessment', 'risk_assessment', 'sds_analysis', 'chat_response'
  riskScore: integer("risk_score"), // 1-100 AI-calculated risk score
  sentimentScore: integer("sentiment_score"), // -100 to 100 sentiment analysis
  urgencyLevel: text("urgency_level"), // 'low', 'medium', 'high', 'critical'
  safetyCategories: jsonb("safety_categories"), // Array of identified safety categories
  keywordTags: jsonb("keyword_tags"), // Extracted keywords for pattern analysis
  confidenceScore: integer("confidence_score"), // AI confidence in analysis (0-100)
  behaviorIndicators: jsonb("behavior_indicators"), // Risk behavior patterns detected
  complianceScore: integer("compliance_score"), // OSHA compliance score (0-100)
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
}, (table) => ({
  userIdIdx: index("analysis_history_user_id_idx").on(table.userId),
  typeIdx: index("analysis_history_type_idx").on(table.type),
  riskScoreIdx: index("analysis_history_risk_score_idx").on(table.riskScore),
  createdAtIdx: index("analysis_history_created_at_idx").on(table.createdAt),
}));

// Risk assessments
export const riskAssessments = pgTable("risk_assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: text("site_id").notNull(),
  assessment: jsonb("assessment").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

// Insurance Analytics - Behavioral Risk Patterns
export const behaviorAnalytics = pgTable("behavior_analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  companyId: text("company_id"), // For multi-tenant analytics
  department: text("department"),
  jobRole: text("job_role"),
  shiftType: text("shift_type"), // 'day', 'night', 'swing'
  experienceLevel: integer("experience_level"), // Years of experience
  totalInteractions: integer("total_interactions").default(0),
  highRiskQueries: integer("high_risk_queries").default(0),
  safetyViolationIndicators: integer("safety_violation_indicators").default(0),
  complianceScore: integer("compliance_score").default(100), // Running average
  riskTrend: text("risk_trend"), // 'improving', 'stable', 'declining'
  lastHighRiskActivity: timestamp("last_high_risk_activity"),
  incidentPredictionScore: integer("incident_prediction_score"), // 0-100 likelihood
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
}, (table) => ({
  userIdIdx: index("behavior_analytics_user_id_idx").on(table.userId),
  companyIdIdx: index("behavior_analytics_company_id_idx").on(table.companyId),
  riskTrendIdx: index("behavior_analytics_risk_trend_idx").on(table.riskTrend),
  incidentPredictionIdx: index("behavior_analytics_incident_prediction_idx").on(table.incidentPredictionScore),
}));

// Safety reports - Enhanced with predictive data
export const safetyReports = pgTable("safety_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  severity: text("severity").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  status: text("status").default("pending").notNull(),
  attachments: jsonb("attachments"),
  predictiveCostImpact: integer("predictive_cost_impact"), // Estimated dollar impact
  rootCauseAnalysis: jsonb("root_cause_analysis"), // AI-generated root cause
  similarIncidentIds: jsonb("similar_incident_ids"), // Related incidents
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
}, (table) => ({
  severityIdx: index("safety_reports_severity_idx").on(table.severity),
  statusIdx: index("safety_reports_status_idx").on(table.status),
  createdAtIdx: index("safety_reports_created_at_idx").on(table.createdAt),
}));

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
