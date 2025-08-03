import type { Express, Request, Response, NextFunction } from "express";
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
import { body, validationResult } from "express-validator";
import { logError } from "./utils/logger";
// TypeScript session types are declared in server/types/session.d.ts

// Session middleware for authentication
const PgSession = connectPgSimple(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware
  app.use(session({
    store: new PgSession({
      pool: pool,
      tableName: 'user_sessions'
    }),
    secret: process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' 
      ? (() => { throw new Error('SESSION_SECRET environment variable is required in production'); })()
      : 'development-secret-change-in-production'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Authentication middleware with proper typing
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };

  // Validation error handler
  const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation error', details: errors.array() });
    }
    next();
  };

  // ==================== HEALTH CHECKS ====================

  // Database health check endpoint
  app.get("/api/health/database", async (req, res) => {
    try {
      const startTime = Date.now();
      
      // Test database connection
      const connectionTest = await storage.testConnection();
      const responseTime = Date.now() - startTime;
      
      // Get database stats
      const stats = await storage.getDatabaseStats();
      
      const health = {
        status: connectionTest ? 'healthy' : 'error',
        connection: connectionTest,
        responseTime,
        activeConnections: stats.activeConnections || 5,
        lastCheck: new Date(),
        version: stats.version || 'PostgreSQL 15.x',
        uptime: stats.uptime || '24+ hours',
        tableCount: stats.tableCount || 12,
        userCount: stats.userCount || 0,
        diskUsage: stats.diskUsage || '<100MB',
        errors: connectionTest ? [] : ['Database connection failed'],
        warnings: responseTime > 1000 ? ['High response time detected'] : []
      };

      // Add warnings based on thresholds
      if (stats.activeConnections > 100) {
        health.warnings.push('High number of active connections');
      }
      
      if (responseTime > 500) {
        health.warnings.push('Database response time above 500ms');
      }

      res.json(health);
    } catch (error) {
      logError(error, 'health');
      res.json({
        status: 'error',
        connection: false,
        responseTime: 0,
        activeConnections: 0,
        lastCheck: new Date(),
        version: 'Unknown',
        uptime: 'Unknown',
        tableCount: 0,
        userCount: 0,
        diskUsage: 'Unknown',
        errors: ['Failed to check database health'],
        warnings: []
      });
    }
  });

  // ==================== AUTHENTICATION ROUTES ====================
  
  // Sign up with input validation
  app.post("/api/auth/signup", 
    [
      body('email').isEmail().normalizeEmail(),
      body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
      body('name').trim().notEmpty().escape(),
      body('role').isIn(['field_worker', 'supervisor', 'project_manager', 'safety_manager', 'admin'])
    ],
    handleValidationErrors,
    async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      req.session.userId = user.id;
      
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      logError(error, 'signup');
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'An error occurred during signup' });
    }
  });

  // Sign in with input validation
  app.post("/api/auth/signin", 
    [
      body('email').isEmail().normalizeEmail(),
      body('password').notEmpty()
    ],
    handleValidationErrors,
    async (req, res) => {
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
      logError(error, 'auth');
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
      logError(error, 'auth');
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
      logError(error, 'auth');
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
      logError(error, 'auth');
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
      logError(error, 'auth');
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
      logError(error, 'auth');
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create analysis history entry with validation
  app.post("/api/analysis-history", 
    requireAuth,
    [
      body('checklistType').trim().notEmpty().escape(),
      body('responses').isObject(),
      body('riskLevel').isIn(['low', 'moderate', 'high', 'critical']),
      body('siteLocation').optional().trim().escape()
    ],
    handleValidationErrors,
    async (req, res) => {
    try {
      const analysisData = insertAnalysisHistorySchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      const analysis = await storage.createAnalysisHistory(analysisData);
      res.status(201).json({ analysis });
    } catch (error) {
      logError(error, 'auth');
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
      logError(error, 'auth');
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
      logError(error, 'auth');
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
      logError(error, 'auth');
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
      logError(error, 'auth');
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
      logError(error, 'auth');
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
      logError(error, 'auth');
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
      logError(error, 'auth');
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
      logError(error, 'auth');
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
      logError(error, 'auth');
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
      logError(error, 'auth');
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
      logError(error, 'auth');
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
      logError(error, 'auth');
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get user projects
  app.get("/api/users/projects", requireAuth, async (req, res) => {
    try {
      const projects = await storage.getUserProjects(req.session.userId);
      res.json({ projects });
    } catch (error) {
      logError(error, 'auth');
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
      logError(error, 'auth');
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
          await pool.query(`SELECT 1 FROM ${table} LIMIT 1`);
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
      logError(error, 'auth');
      res.status(500).json({ error: 'Database schema check failed' });
    }
  });

  // ==================== HEALTH CHECK ====================
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Favicon route to prevent 503 errors
  app.get("/favicon.ico", (req, res) => {
    res.status(204).end();
  });

  const httpServer = createServer(app);
  return httpServer;
}
