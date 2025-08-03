// Netlify serverless function for backend API
export const handler = async (event, context) => {
  // Simple API responses for demo
  const path = event.path.replace('/.netlify/functions/server', '');
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Demo user for authentication
  const DEMO_USER = {
    id: '3c04326a-83df-47a5-aef3-e5021bc4b9c7',
    email: 'demo@safecomp.com',
    name: 'Demo User',
    role: 'admin'
  };

  try {
    // Auth endpoints
    if (path === '/api/auth/signin' && event.httpMethod === 'POST') {
      const { email, password } = JSON.parse(event.body || '{}');
      
      if (email === DEMO_USER.email && password === 'demo123') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            user: DEMO_USER 
          })
        };
      }
      
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }

    if (path === '/api/auth/user' && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ user: DEMO_USER })
      };
    }

    if (path === '/api/auth/signout' && event.httpMethod === 'POST') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    // Admin endpoints
    if (path === '/api/admin/users' && event.httpMethod === 'GET') {
      const users = [{
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
      }];
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ users })
      };
    }

    // Default response
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};