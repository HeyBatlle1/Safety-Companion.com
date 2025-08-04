import { Router } from 'express';
import bcrypt from 'bcrypt';
import { storage } from './storage';
import { 
  insertUserSchema,
  insertSafetyChecklistSchema,
  insertJhaFormSchema,
  insertChatSessionSchema,
  insertSafetyIncidentSchema,
  insertAnalysisHistorySchema,
  insertTrainingRecordSchema,
} from '@shared/schema';
import { z } from 'zod';

const router = Router();

// Authentication middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// User authentication routes
router.post('/auth/signup', async (req, res) => {
  try {
    const validatedData = insertUserSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);
    
    // Create user
    const user = await storage.createUser({
      ...validatedData,
      password: hashedPassword,
    });

    // Create session
    req.session.userId = user.id;
    req.session.userRole = user.role;

    res.status(201).json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        isActive: user.isActive 
      } 
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({ error: 'Invalid signup data' });
  }
});

router.post('/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      return res.status(423).json({ error: 'Account locked. Try again later.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      // Increment login attempts
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const lockUntil = attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : undefined; // 30 minutes
      
      await storage.updateUserLoginAttempts(user.id, attempts, lockUntil);
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset login attempts and update last login
    await storage.updateUserLoginAttempts(user.id, 0);
    await storage.updateUser(user.id, { 
      lastLoginAt: new Date(),
      loginCount: (user.loginCount || 0) + 1 
    });

    // Create session
    req.session.userId = user.id;
    req.session.userRole = user.role;

    res.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        isActive: user.isActive 
      } 
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/auth/signout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get('/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        isActive: user.isActive 
      } 
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User profile routes
router.post('/profiles', requireAuth, async (req, res) => {
  try {
    const validatedData = insertUserProfileSchema.parse({
      ...req.body,
      userId: req.session.userId,
    });
    
    const profile = await storage.createUserProfile(validatedData);
    res.status(201).json(profile);
  } catch (error) {
    console.error('Create profile error:', error);
    res.status(400).json({ error: 'Invalid profile data' });
  }
});

router.get('/profiles/me', requireAuth, async (req, res) => {
  try {
    const profile = await storage.getUserProfile(req.session.userId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/profiles/me', requireAuth, async (req, res) => {
  try {
    const updates = req.body;
    const profile = await storage.updateUserProfile(req.session.userId, updates);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin-only route to get all profiles
router.get('/profiles', requireAuth, async (req, res) => {
  try {
    if (req.session.userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const profiles = await storage.getAllUserProfiles();
    res.json(profiles);
  } catch (error) {
    console.error('Get all profiles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Safety checklist routes
router.post('/checklists', requireAuth, async (req, res) => {
  try {
    const validatedData = insertSafetyChecklistSchema.parse({
      ...req.body,
      userId: req.session.userId,
    });
    
    const checklist = await storage.createSafetyChecklist(validatedData);
    res.status(201).json(checklist);
  } catch (error) {
    console.error('Create checklist error:', error);
    res.status(400).json({ error: 'Invalid checklist data' });
  }
});

router.get('/checklists', requireAuth, async (req, res) => {
  try {
    const checklists = await storage.getSafetyChecklistsByUser(req.session.userId);
    res.json(checklists);
  } catch (error) {
    console.error('Get checklists error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/checklists/:id', requireAuth, async (req, res) => {
  try {
    const checklist = await storage.getSafetyChecklistById(req.params.id);
    if (!checklist) {
      return res.status(404).json({ error: 'Checklist not found' });
    }
    
    // Check ownership
    if (checklist.userId !== req.session.userId && req.session.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(checklist);
  } catch (error) {
    console.error('Get checklist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/checklists/:id', requireAuth, async (req, res) => {
  try {
    const checklist = await storage.getSafetyChecklistById(req.params.id);
    if (!checklist) {
      return res.status(404).json({ error: 'Checklist not found' });
    }
    
    // Check ownership
    if (checklist.userId !== req.session.userId && req.session.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updates = req.body;
    const updatedChecklist = await storage.updateSafetyChecklist(req.params.id, updates);
    res.json(updatedChecklist);
  } catch (error) {
    console.error('Update checklist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/checklists/:id', requireAuth, async (req, res) => {
  try {
    const checklist = await storage.getSafetyChecklistById(req.params.id);
    if (!checklist) {
      return res.status(404).json({ error: 'Checklist not found' });
    }
    
    // Check ownership
    if (checklist.userId !== req.session.userId && req.session.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const deleted = await storage.deleteSafetyChecklist(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Checklist not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete checklist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// JHA form routes
router.post('/jha-forms', requireAuth, async (req, res) => {
  try {
    const validatedData = insertJhaFormSchema.parse({
      ...req.body,
      userId: req.session.userId,
    });
    
    const form = await storage.createJhaForm(validatedData);
    res.status(201).json(form);
  } catch (error) {
    console.error('Create JHA form error:', error);
    res.status(400).json({ error: 'Invalid JHA form data' });
  }
});

router.get('/jha-forms', requireAuth, async (req, res) => {
  try {
    const forms = await storage.getJhaFormsByUser(req.session.userId);
    res.json(forms);
  } catch (error) {
    console.error('Get JHA forms error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/jha-forms/:id', requireAuth, async (req, res) => {
  try {
    const form = await storage.getJhaFormById(req.params.id);
    if (!form) {
      return res.status(404).json({ error: 'JHA form not found' });
    }
    
    // Check ownership
    if (form.userId !== req.session.userId && req.session.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(form);
  } catch (error) {
    console.error('Get JHA form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/jha-forms/:id', requireAuth, async (req, res) => {
  try {
    const form = await storage.getJhaFormById(req.params.id);
    if (!form) {
      return res.status(404).json({ error: 'JHA form not found' });
    }
    
    // Check ownership
    if (form.userId !== req.session.userId && req.session.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updates = req.body;
    const updatedForm = await storage.updateJhaForm(req.params.id, updates);
    res.json(updatedForm);
  } catch (error) {
    console.error('Update JHA form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Chat session routes
router.post('/chat-sessions', requireAuth, async (req, res) => {
  try {
    const validatedData = insertChatSessionSchema.parse({
      ...req.body,
      userId: req.session.userId,
    });
    
    const session = await storage.createChatSession(validatedData);
    res.status(201).json(session);
  } catch (error) {
    console.error('Create chat session error:', error);
    res.status(400).json({ error: 'Invalid chat session data' });
  }
});

router.get('/chat-sessions', requireAuth, async (req, res) => {
  try {
    const sessions = await storage.getChatSessionsByUser(req.session.userId);
    res.json(sessions);
  } catch (error) {
    console.error('Get chat sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/chat-sessions/:id', requireAuth, async (req, res) => {
  try {
    const session = await storage.getChatSessionById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    
    // Check ownership
    if (session.userId !== req.session.userId && req.session.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Get chat session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/chat-sessions/:id', requireAuth, async (req, res) => {
  try {
    const session = await storage.getChatSessionById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    
    // Check ownership
    if (session.userId !== req.session.userId && req.session.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updates = req.body;
    const updatedSession = await storage.updateChatSession(req.params.id, updates);
    res.json(updatedSession);
  } catch (error) {
    console.error('Update chat session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Safety incident routes
router.post('/incidents', requireAuth, async (req, res) => {
  try {
    const validatedData = insertSafetyIncidentSchema.parse({
      ...req.body,
      userId: req.session.userId,
    });
    
    const incident = await storage.createSafetyIncident(validatedData);
    res.status(201).json(incident);
  } catch (error) {
    console.error('Create incident error:', error);
    res.status(400).json({ error: 'Invalid incident data' });
  }
});

router.get('/incidents', requireAuth, async (req, res) => {
  try {
    let incidents;
    if (req.session.userRole === 'admin' || req.session.userRole === 'safety_manager') {
      incidents = await storage.getAllSafetyIncidents();
    } else {
      incidents = await storage.getSafetyIncidentsByUser(req.session.userId);
    }
    res.json(incidents);
  } catch (error) {
    console.error('Get incidents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Analysis history routes
router.post('/analysis', requireAuth, async (req, res) => {
  try {
    const validatedData = insertAnalysisHistorySchema.parse({
      ...req.body,
      userId: req.session.userId,
    });
    
    const analysis = await storage.createAnalysisHistory(validatedData);
    res.status(201).json(analysis);
  } catch (error) {
    console.error('Create analysis error:', error);
    res.status(400).json({ error: 'Invalid analysis data' });
  }
});

router.get('/analysis', requireAuth, async (req, res) => {
  try {
    const analysis = await storage.getAnalysisHistoryByUser(req.session.userId);
    res.json(analysis);
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Training record routes
router.post('/training', requireAuth, async (req, res) => {
  try {
    const validatedData = insertTrainingRecordSchema.parse({
      ...req.body,
      userId: req.session.userId,
    });
    
    const record = await storage.createTrainingRecord(validatedData);
    res.status(201).json(record);
  } catch (error) {
    console.error('Create training record error:', error);
    res.status(400).json({ error: 'Invalid training record data' });
  }
});

router.get('/training', requireAuth, async (req, res) => {
  try {
    const records = await storage.getTrainingRecordsByUser(req.session.userId);
    res.json(records);
  } catch (error) {
    console.error('Get training records error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Analytics and metrics routes (admin only)
router.get('/metrics/safety', requireAuth, async (req, res) => {
  try {
    if (req.session.userRole !== 'admin' && req.session.userRole !== 'safety_manager') {
      return res.status(403).json({ error: 'Admin or safety manager access required' });
    }
    
    const metrics = await storage.getSafetyMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Get safety metrics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/metrics/users', requireAuth, async (req, res) => {
  try {
    if (req.session.userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const stats = await storage.getUserActivityStats();
    res.json(stats);
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;