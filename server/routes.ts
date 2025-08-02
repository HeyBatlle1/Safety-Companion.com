import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertNotificationPreferencesSchema,
  insertAnalysisHistorySchema,
  insertRiskAssessmentSchema,
  insertSafetyReportSchema,
  insertChatMessageSchema,
  insertWatchedVideoSchema,
  insertCompanySchema,
  insertProjectSchema 
} from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

// Session middleware for authentication
const PgSession = connectPgSimple(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware
  app.use(session({
    store: new PgSession({
      pool: pool,
      tableName: 'user_sessions'
    }),
    secret: process.env.SESSION_SECRET || 'development-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };

  // ==================== AUTHENTICATION ROUTES ====================
  
  // Sign up
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      req.session.userId = user.id;
      
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Signup error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Sign in
  app.post("/api/auth/signin", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const user = await storage.verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const { password: _, ...userWithoutPassword } = user;
      req.session.userId = user.id;
      
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Signin error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Sign out
  app.post("/api/auth/signout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Could not sign out' });
      }
      res.json({ message: 'Signed out successfully' });
    });
  });

  // Get current user
  app.get("/api/auth/user", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ==================== USER MANAGEMENT ====================

  // Update user profile
  app.patch("/api/users/profile", requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      const user = await storage.updateUser(req.session.userId, updates);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ==================== NOTIFICATION PREFERENCES ====================

  // Get notification preferences
  app.get("/api/users/notification-preferences", requireAuth, async (req, res) => {
    try {
      const preferences = await storage.getUserNotificationPreferences(req.session.userId);
      res.json({ preferences });
    } catch (error) {
      console.error('Get notification preferences error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update notification preferences
  app.patch("/api/users/notification-preferences", requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      const preferences = await storage.updateNotificationPreferences(req.session.userId, updates);
      res.json({ preferences });
    } catch (error) {
      console.error('Update notification preferences error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ==================== ANALYSIS HISTORY ====================

  // Get analysis history
  app.get("/api/analysis-history", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const history = await storage.getAnalysisHistory(req.session.userId, limit);
      res.json({ history });
    } catch (error) {
      console.error('Get analysis history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create analysis history entry
  app.post("/api/analysis-history", requireAuth, async (req, res) => {
    try {
      const analysisData = insertAnalysisHistorySchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      const analysis = await storage.createAnalysisHistory(analysisData);
      res.status(201).json({ analysis });
    } catch (error) {
      console.error('Create analysis history error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ==================== RISK ASSESSMENTS ====================

  // Get risk assessments
  app.get("/api/risk-assessments", requireAuth, async (req, res) => {
    try {
      const siteId = req.query.siteId as string;
      const assessments = await storage.getRiskAssessments(siteId);
      res.json({ assessments });
    } catch (error) {
      console.error('Get risk assessments error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create risk assessment
  app.post("/api/risk-assessments", requireAuth, async (req, res) => {
    try {
      const assessmentData = insertRiskAssessmentSchema.parse(req.body);
      const assessment = await storage.createRiskAssessment(assessmentData);
      res.status(201).json({ assessment });
    } catch (error) {
      console.error('Create risk assessment error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ==================== SAFETY REPORTS ====================

  // Get safety reports
  app.get("/api/safety-reports", requireAuth, async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const reports = await storage.getSafetyReports(userId);
      res.json({ reports });
    } catch (error) {
      console.error('Get safety reports error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create safety report
  app.post("/api/safety-reports", requireAuth, async (req, res) => {
    try {
      const reportData = insertSafetyReportSchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      const report = await storage.createSafetyReport(reportData);
      res.status(201).json({ report });
    } catch (error) {
      console.error('Create safety report error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update safety report
  app.patch("/api/safety-reports/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const report = await storage.updateSafetyReport(id, updates);
      if (!report) {
        return res.status(404).json({ error: 'Safety report not found' });
      }
      res.json({ report });
    } catch (error) {
      console.error('Update safety report error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ==================== CHAT MESSAGES ====================

  // Get chat messages
  app.get("/api/chat-messages", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const messages = await storage.getChatMessages(req.session.userId, limit);
      res.json({ messages });
    } catch (error) {
      console.error('Get chat messages error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create chat message
  app.post("/api/chat-messages", requireAuth, async (req, res) => {
    try {
      const messageData = insertChatMessageSchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      const message = await storage.createChatMessage(messageData);
      res.status(201).json({ message });
    } catch (error) {
      console.error('Create chat message error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ==================== WATCHED VIDEOS ====================

  // Get watched videos
  app.get("/api/watched-videos", requireAuth, async (req, res) => {
    try {
      const watchedVideos = await storage.getWatchedVideos(req.session.userId);
      res.json({ watchedVideos });
    } catch (error) {
      console.error('Get watched videos error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Mark video as watched
  app.post("/api/watched-videos", requireAuth, async (req, res) => {
    try {
      const { videoId } = req.body;
      if (!videoId) {
        return res.status(400).json({ error: 'Video ID required' });
      }
      
      const watchedVideo = await storage.markVideoWatched(req.session.userId, videoId);
      res.status(201).json({ watchedVideo });
    } catch (error) {
      console.error('Mark video watched error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ==================== COMPANIES ====================

  // Get companies
  app.get("/api/companies", requireAuth, async (req, res) => {
    try {
      const companies = await storage.getCompanies();
      res.json({ companies });
    } catch (error) {
      console.error('Get companies error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create company
  app.post("/api/companies", requireAuth, async (req, res) => {
    try {
      const companyData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(companyData);
      res.status(201).json({ company });
    } catch (error) {
      console.error('Create company error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ==================== PROJECTS ====================

  // Get projects
  app.get("/api/projects", requireAuth, async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json({ projects });
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get user projects
  app.get("/api/users/projects", requireAuth, async (req, res) => {
    try {
      const projects = await storage.getUserProjects(req.session.userId);
      res.json({ projects });
    } catch (error) {
      console.error('Get user projects error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create project
  app.post("/api/projects", requireAuth, async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.status(201).json({ project });
    } catch (error) {
      console.error('Create project error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ==================== DATABASE SCHEMA FIX (replaces Supabase Edge Function) ====================
  app.post("/api/db-schema-fix", requireAuth, async (req, res) => {
    try {
      const { fix = false } = req.body;
      
      const results = {
        checkTime: new Date().toISOString(),
        missingTables: [],
        missingColumns: [],
        fixedTables: [],
        fixedColumns: [],
        errors: []
      };

      // Check if all required tables exist by trying to query them
      const requiredTables = [
        'users', 'notification_preferences', 'analysis_history', 
        'risk_assessments', 'safety_reports', 'chat_messages', 
        'watched_videos', 'companies', 'projects', 'user_project_assignments'
      ];

      for (const table of requiredTables) {
        try {
          await db.execute(`SELECT 1 FROM ${table} LIMIT 1`);
        } catch (error) {
          results.missingTables.push(table);
          if (fix) {
            // Tables are already created via Drizzle schema
            results.errors.push(`Table ${table} missing but would be created by schema migration`);
          }
        }
      }

      let message = 'Database schema check completed.';
      if (results.missingTables.length > 0 || results.missingColumns.length > 0) {
        message += ` Issues found: ${results.missingTables.length} missing tables, ${results.missingColumns.length} missing columns.`;
        if (fix) {
          message += ' Run `npm run db:push` to fix schema issues.';
        }
      } else {
        message += ' No issues found.';
      }

      results.message = message;
      res.json(results);
    } catch (error) {
      console.error('Database schema fix error:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  // ==================== HEALTH CHECK ====================
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
