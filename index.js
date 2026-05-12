const express = require('express');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Koneksi ke Neon (Vercel-optimized)
const sql = neon(process.env.DATABASE_URL);

// Routes
app.get('/api/health', async (req, res) => {
  try {
    const result = await sql`SELECT NOW() as time`;
    res.json({
      status: 'success',
      message: 'Blaz CRM API running on Vercel',
      database: 'Connected',
      time: result[0].time
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend API is working on Vercel!' });
});

// Export untuk Vercel
module.exports = app;