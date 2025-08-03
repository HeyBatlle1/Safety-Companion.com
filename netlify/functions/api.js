// Netlify Functions handler for API routes
const express = require('express');
const serverless = require('serverless-http');

// Import your existing server routes
const app = express();

// Import and setup your existing routes from server/routes.ts
// Note: You'll need to transpile TypeScript or convert to JS for Netlify
try {
  const routes = require('../../server/routes.js');
  app.use('/api', routes);
} catch (error) {
  console.error('Error loading routes:', error);
  app.use('/api', (req, res) => {
    res.status(500).json({ error: 'Server configuration error' });
  });
}

// Export the serverless function
exports.handler = serverless(app);