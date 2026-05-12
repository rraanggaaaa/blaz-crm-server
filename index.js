const express = require('express');
const cors = require('cors');

const app = express();

// Middleware minimal
app.use(cors());
app.use(express.json());

// Health check tanpa database dulu
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Server is running on Vercel',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend API is working!',
    endpoints: ['/api/health', '/api/test']
  });
});

// Root endpoint untuk cek
app.get('/', (req, res) => {
  res.json({ 
    message: 'Blaz CRM Backend API',
    status: 'active',
    documentation: '/api/health'
  });
});

// Export untuk Vercel
module.exports = app;