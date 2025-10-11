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

// Agent outputs - Individual agent execution results for data harvesting
export const agentOutputs = pgTable("agent_outputs", {
  id: uuid("id").primaryKey().defaultRandom(),
  analysisId: uuid("analysis_id").references(() => analysisHistory.id, { onDelete: "cascade" }),
  agentId: text("agent_id").notNull(), // e.g., "agent_1", "agent_2_risk_assessor"
  agentName: text("agent_name").notNull(), // e.g., "Data Validator", "Risk Assessor"
  agentType: text("agent_type").notNull(), // e.g., "eap_generator", "multi_agent_safety"
  outputData: jsonb("output_data").notNull(), // The actual output from the agent
  executionMetadata: jsonb("execution_metadata"), // model, temperature, maxTokens, execution_time, etc.
  success: boolean("success").default(true).notNull(),
  errorDetails: text("error_details"), // If success = false
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  analysisIdIdx: index("agent_outputs_analysis_id_idx").on(table.analysisId),
  agentTypeIdx: index("agent_outputs_agent_type_idx").on(table.agentType),
  createdAtIdx: index("agent_outputs_created_at_idx").on(table.createdAt),
}));

// User interaction analytics - Phase 1 Silent Tracking
export const userInteractionAnalytics = pgTable("user_interaction_analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionToken: text("session_token").notNull(), // Anonymous session identifier
  sectionId: text("section_id"), // Checklist section or analysis component
  interactionType: text("interaction_type").notNull(), // 'checklist_completion', 'analysis_generation', 'section_modification'
  timeSpent: integer("time_spent"), // Seconds spent on section/component
  modificationsCount: integer("modifications_count").default(0), // Number of edits made
  completionStatus: text("completion_status"), // 'completed', 'abandoned', 'in_progress'
  contextData: jsonb("context_data"), // Anonymous context information
  performanceMetrics: jsonb("performance_metrics"), // Load times, error counts, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  sessionTokenIdx: index("user_interaction_session_token_idx").on(table.sessionToken),
  interactionTypeIdx: index("user_interaction_type_idx").on(table.interactionType),
  createdAtIdx: index("user_interaction_created_at_idx").on(table.createdAt),
  // Cleanup index for automated data retention
  cleanupIdx: index("user_interaction_cleanup_idx").on(table.createdAt),
}));

// System performance monitoring
export const systemPerformanceMetrics = pgTable("system_performance_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  metricType: text("metric_type").notNull(), // 'database_query', 'ai_analysis', 'user_session'
  metricName: text("metric_name").notNull(), // Specific operation name
  duration: integer("duration"), // Milliseconds
  success: boolean("success").notNull(),
  errorDetails: text("error_details"), // If success = false
  resourceUsage: jsonb("resource_usage"), // Memory, CPU, etc.
  metadata: jsonb("metadata"), // Additional context
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  metricTypeIdx: index("system_performance_metric_type_idx").on(table.metricType),
  createdAtIdx: index("system_performance_created_at_idx").on(table.createdAt),
  successIdx: index("system_performance_success_idx").on(table.success),
  // Cleanup index for automated data retention
  cleanupIdx: index("system_performance_cleanup_idx").on(table.createdAt),
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

export const insertAgentOutputSchema = createInsertSchema(agentOutputs).omit({
  id: true,
  createdAt: true,
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

// OSHA Safety Intelligence Tables - Professional Cloud Integration
export const oshaInjuryRates = pgTable("osha_injury_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  naicsCode: text("naics_code").notNull(),
  industryName: text("industry_name").notNull(),
  injuryRate: integer("injury_rate"), // Per 100 workers
  totalCases: integer("total_cases"),
  dataSource: text("data_source").notNull(), // 'BLS_Table_1_2023', 'BLS_FATALITIES_A1_2023'
  year: integer("year").notNull().default(2023),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  naicsCodeIdx: index("osha_injury_rates_naics_code_idx").on(table.naicsCode),
  dataSourceIdx: index("osha_injury_rates_data_source_idx").on(table.dataSource),
  injuryRateIdx: index("osha_injury_rates_injury_rate_idx").on(table.injuryRate),
}));

// Job Hazard Safety Assessment (JHSA) - OSHA 3071 Compliant
export const jhsaTemplates = pgTable("jhsa_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  naicsCode: text("naics_code").notNull(),
  jobTitle: text("job_title").notNull(),
  industryName: text("industry_name").notNull(),
  riskScore: integer("risk_score"), // From OSHA data
  riskCategory: text("risk_category"), // 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'
  jobSteps: jsonb("job_steps").notNull(), // Array of step objects
  hazardAnalysis: jsonb("hazard_analysis"), // Comprehensive hazard breakdown
  oshaCompliance: text("osha_compliance").default("OSHA 3071 Methodology"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
}, (table) => ({
  userIdIdx: index("jhsa_templates_user_id_idx").on(table.userId),
  naicsCodeIdx: index("jhsa_templates_naics_code_idx").on(table.naicsCode),
  riskScoreIdx: index("jhsa_templates_risk_score_idx").on(table.riskScore),
}));

// Industry Benchmarking Data
export const industryBenchmarks = pgTable("industry_benchmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  naicsCode: text("naics_code").notNull(),
  industryName: text("industry_name").notNull(),
  avgInjuryRate: integer("avg_injury_rate"),
  avgFatalityRate: integer("avg_fatality_rate"),
  riskProfile: jsonb("risk_profile"), // Industry-specific risk factors
  safetyRecommendations: jsonb("safety_recommendations"),
  benchmarkDate: timestamp("benchmark_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  naicsCodeIdx: index("industry_benchmarks_naics_code_idx").on(table.naicsCode),
  avgInjuryRateIdx: index("industry_benchmarks_avg_injury_rate_idx").on(table.avgInjuryRate),
}));

// Safety Intelligence Analytics - AI-Powered Insights
export const safetyIntelligence = pgTable("safety_intelligence", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  naicsCode: text("naics_code").notNull(),
  query: text("query").notNull(),
  aiResponse: text("ai_response").notNull(),
  riskFactors: jsonb("risk_factors"), // Identified risk factors
  recommendations: jsonb("recommendations"), // AI-generated recommendations
  confidenceScore: integer("confidence_score"), // 0-100 AI confidence
  oshaDataUsed: jsonb("osha_data_used"), // Referenced OSHA statistics
  industryComparison: jsonb("industry_comparison"), // Benchmark analysis
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("safety_intelligence_user_id_idx").on(table.userId),
  naicsCodeIdx: index("safety_intelligence_naics_code_idx").on(table.naicsCode),
  confidenceScoreIdx: index("safety_intelligence_confidence_score_idx").on(table.confidenceScore),
}));

// Create insert schemas for OSHA tables
export const insertOshaInjuryRatesSchema = createInsertSchema(oshaInjuryRates).omit({
  id: true,
  createdAt: true,
});

export const insertJhsaTemplatesSchema = createInsertSchema(jhsaTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIndustryBenchmarksSchema = createInsertSchema(industryBenchmarks).omit({
  id: true,
  createdAt: true,
});

export const insertSafetyIntelligenceSchema = createInsertSchema(safetyIntelligence).omit({
  id: true,
  createdAt: true,
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

// OSHA Safety Intelligence Types
export type InsertOshaInjuryRates = z.infer<typeof insertOshaInjuryRatesSchema>;
export type OshaInjuryRates = typeof oshaInjuryRates.$inferSelect;

export type InsertJhsaTemplates = z.infer<typeof insertJhsaTemplatesSchema>;
export type JhsaTemplates = typeof jhsaTemplates.$inferSelect;

export type InsertIndustryBenchmarks = z.infer<typeof insertIndustryBenchmarksSchema>;
export type IndustryBenchmarks = typeof industryBenchmarks.$inferSelect;

export type InsertSafetyIntelligence = z.infer<typeof insertSafetyIntelligenceSchema>;
export type SafetyIntelligence = typeof safetyIntelligence.$inferSelect;
