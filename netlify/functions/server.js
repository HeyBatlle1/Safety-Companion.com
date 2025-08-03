// Netlify serverless function for backend API
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const { neon } = require('@neondatabase/serverless');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.API_RATE_LIMIT) || 100,
  message: { error: 'Too many requests' }
});
app.use('/api', limiter);

// Database connection
const sql = neon(process.env.DATABASE_URL);

// Demo user for authentication
const DEMO_USER = {
  id: '3c04326a-83df-47a5-aef3-e5021bc4b9c7',
  email: 'demo@safecomp.com',
  name: 'Demo User',
  role: 'admin',
  passwordHash: '$2b$10$rYvCm.w8hX9qB5zN3gO.eeK8mF7vQ2nS4tG1wJ6pL8xR9zV3mN5cC' // demo123
};

// Session storage (in production, use Redis or database)
const sessions = new Map();

// Auth endpoints
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (email === DEMO_USER.email) {
      const isValid = await bcrypt.compare(password, DEMO_USER.passwordHash);
      
      if (isValid) {
        const sessionId = `session_${Date.now()}_${Math.random()}`;
        sessions.set(sessionId, {
          userId: DEMO_USER.id,
          user: DEMO_USER,
          createdAt: new Date()
        });
        
        res.cookie('sessionId', sessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        
        return res.json({ 
          success: true, 
          user: { 
            id: DEMO_USER.id, 
            email: DEMO_USER.email, 
            name: DEMO_USER.name, 
            role: DEMO_USER.role 
          } 
        });
      }
    }
    
    res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/user', (req, res) => {
  try {
    const sessionId = req.cookies?.sessionId || req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionId || !sessions.has(sessionId)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const session = sessions.get(sessionId);
    res.json({ user: session.user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/signout', (req, res) => {
  try {
    const sessionId = req.cookies?.sessionId;
    
    if (sessionId) {
      sessions.delete(sessionId);
    }
    
    res.clearCookie('sessionId');
    res.json({ success: true });
  } catch (error) {
    console.error('Signout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoints
app.get('/api/admin/users', (req, res) => {
  try {
    // Return demo users for admin panel
    const users = [
      {
        id: DEMO_USER.id,
        name: DEMO_USER.name,
        email: DEMO_USER.email,
        role: DEMO_USER.role,
        department: 'Administration',
        employeeId: 'EMP001',
        phone: '555-0123',
        emergencyContact: 'Jane Doe - 555-0124',
        lastLogin: new Date().toISOString(),
        certifications: ['OSHA 30', 'First Aid'],
        safetyScore: 94.2
      }
    ];
    
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export for Netlify
exports.handler = async (event, context) => {
  // Convert Netlify event to Express request
  const express = require('serverless-http')(app);
  return await express(event, context);
};