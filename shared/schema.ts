import { pgTable, text, timestamp, boolean, integer, uuid, jsonb, decimal } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table for authentication (matching existing database schema)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull().default('field_worker'), // field_worker, supervisor, project_manager, safety_manager, admin
  firstName: text('first_name'),
  lastName: text('last_name'),
  phone: text('phone'),
  employeeId: text('employee_id'),
  department: text('department'),
  emergencyContactName: text('emergency_contact_name'),
  emergencyContactPhone: text('emergency_contact_phone'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
  lastLoginAt: timestamp('last_login_at'),
  loginCount: integer('login_count').default(0),
  failedLoginAttempts: integer('failed_login_attempts').default(0),
  accountLockedUntil: timestamp('account_locked_until'),
  passwordChangedAt: timestamp('password_changed_at'),
});

// User sessions table for session management
export const userSessions = pgTable('user_sessions', {
  sid: text('sid').primaryKey(),
  sess: jsonb('sess').notNull(),
  expire: timestamp('expire').notNull(),
});

// Safety checklists
export const safetyChecklists = pgTable('safety_checklists', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  category: text('category').notNull(), // daily, weekly, monthly, pre_task, etc.
  items: jsonb('items').notNull(), // checklist items with status
  severity: integer('severity').default(1), // 1-5 scale
  location: text('location'),
  photos: jsonb('photos').default([]), // array of photo URLs
  notes: text('notes'),
  completed: boolean('completed').default(false),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Job Hazard Analysis forms
export const jhaForms = pgTable('jha_forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  projectName: text('project_name').notNull(),
  taskDescription: text('task_description').notNull(),
  hazards: jsonb('hazards').notNull(), // identified hazards
  controls: jsonb('controls').notNull(), // control measures
  riskLevel: text('risk_level').notNull(), // low, medium, high, critical
  attachments: jsonb('attachments').default([]), // file attachments
  blueprints: jsonb('blueprints').default([]), // blueprint uploads
  aiAnalysis: jsonb('ai_analysis'), // AI-generated analysis
  status: text('status').default('draft'), // draft, submitted, approved, rejected
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Chat sessions for AI safety assistance
export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: text('title'),
  messages: jsonb('messages').default([]), // conversation history
  context: text('context'), // current context or topic
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Safety incidents and reports
export const safetyIncidents = pgTable('safety_incidents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  incidentType: text('incident_type').notNull(), // near_miss, injury, property_damage, etc.
  severity: integer('severity').notNull(), // 1-5 scale
  description: text('description').notNull(),
  location: text('location').notNull(),
  photos: jsonb('photos').default([]),
  witnesses: jsonb('witnesses').default([]),
  immediateActions: text('immediate_actions'),
  status: text('status').default('reported'), // reported, investigating, resolved
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Pattern analysis history for quarterly/monthly/annual analysis
export const analysisHistory = pgTable('analysis_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  analysisType: text('analysis_type').notNull(), // quarterly, monthly, annual
  timeframe: text('timeframe').notNull(), // e.g., "Q1 2024", "January 2024"
  dataPoints: jsonb('data_points').notNull(), // collected data for analysis
  patterns: jsonb('patterns'), // identified patterns
  recommendations: jsonb('recommendations'), // AI recommendations
  riskScore: decimal('risk_score', { precision: 5, scale: 2 }),
  complianceMetrics: jsonb('compliance_metrics'),
  executiveSummary: text('executive_summary'),
  insuranceData: jsonb('insurance_data'), // actuarial data
  checklistAssessments: jsonb('checklist_assessments'), // daily, weekly, monthly, quarterly, annual
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Training records for YouTube integration
export const trainingRecords = pgTable('training_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  videoId: text('video_id').notNull(),
  videoTitle: text('video_title').notNull(),
  watchTime: integer('watch_time').default(0), // seconds watched
  completionRate: decimal('completion_rate', { precision: 5, scale: 2 }).default('0'),
  completed: boolean('completed').default(false),
  watchedAt: timestamp('watched_at').defaultNow().notNull(),
});

// Insert schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});



export const insertSafetyChecklistSchema = createInsertSchema(safetyChecklists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJhaFormSchema = createInsertSchema(jhaForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSafetyIncidentSchema = createInsertSchema(safetyIncidents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnalysisHistorySchema = createInsertSchema(analysisHistory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrainingRecordSchema = createInsertSchema(trainingRecords).omit({
  id: true,
});

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;



export type SafetyChecklist = typeof safetyChecklists.$inferSelect;
export type InsertSafetyChecklist = z.infer<typeof insertSafetyChecklistSchema>;

export type JhaForm = typeof jhaForms.$inferSelect;
export type InsertJhaForm = z.infer<typeof insertJhaFormSchema>;

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;

export type SafetyIncident = typeof safetyIncidents.$inferSelect;
export type InsertSafetyIncident = z.infer<typeof insertSafetyIncidentSchema>;

export type AnalysisHistory = typeof analysisHistory.$inferSelect;
export type InsertAnalysisHistory = z.infer<typeof insertAnalysisHistorySchema>;

export type TrainingRecord = typeof trainingRecords.$inferSelect;
export type InsertTrainingRecord = z.infer<typeof insertTrainingRecordSchema>;