const express = require('express');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Neon connection
const sql = neon(process.env.DATABASE_URL);

// Test connection
app.get('/api/test', async (req, res) => {
  try {
    const result = await sql`SELECT NOW()`;
    res.json({ success: true, timestamp: result[0].now, message: 'Database connected!' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ CONTACTS CRUD ============
// Get all contacts
app.get('/api/contacts', async (req, res) => {
  try {
    const contacts = await sql`SELECT * FROM contacts ORDER BY id DESC`;
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single contact
app.get('/api/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await sql`SELECT * FROM contacts WHERE id = ${id}`;
    res.json(contact[0]);
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create contact
app.post('/api/contacts', async (req, res) => {
  try {
    const { name, phone, city, group, status } = req.body;
    const result = await sql`
      INSERT INTO contacts (name, phone, city, "group", status) 
      VALUES (${name}, ${phone}, ${city}, ${group}, ${status || 'active'}) 
      RETURNING *
    `;
    res.json(result[0]);
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update contact
app.put('/api/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, city, group, status } = req.body;
    const result = await sql`
      UPDATE contacts 
      SET name=${name}, phone=${phone}, city=${city}, "group"=${group}, status=${status} 
      WHERE id=${id} 
      RETURNING *
    `;
    res.json(result[0]);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete contact
app.delete('/api/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await sql`DELETE FROM contacts WHERE id=${id}`;
    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ DEALS CRUD ============
// Get all deals
app.get('/api/deals', async (req, res) => {
  try {
    const deals = await sql`SELECT * FROM deals ORDER BY created_at DESC`;
    res.json(deals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create deal
app.post('/api/deals', async (req, res) => {
  try {
    const { company_name, pic_name, pic_phone, value, stage } = req.body;
    const result = await sql`
      INSERT INTO deals (company_name, pic_name, pic_phone, value, stage) 
      VALUES (${company_name}, ${pic_name}, ${pic_phone}, ${value}, ${stage || 'Prospek Baru'}) 
      RETURNING *
    `;
    res.json(result[0]);
  } catch (error) {
    console.error('Error creating deal:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update deal
app.put('/api/deals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, value } = req.body;
    const result = await sql`
      UPDATE deals 
      SET stage=${stage}, value=${value} 
      WHERE id=${id} 
      RETURNING *
    `;
    res.json(result[0]);
  } catch (error) {
    console.error('Error updating deal:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete deal
app.delete('/api/deals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await sql`DELETE FROM deals WHERE id=${id}`;
    res.json({ success: true, message: 'Deal deleted' });
  } catch (error) {
    console.error('Error deleting deal:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ BLAST HISTORY ============
// Get all blast history
app.get('/api/blasts', async (req, res) => {
  try {
    const blasts = await sql`SELECT * FROM blast_history ORDER BY created_at DESC`;
    res.json(blasts);
  } catch (error) {
    console.error('Error fetching blasts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create blast history
app.post('/api/blasts', async (req, res) => {
  try {
    const { name, target_count, sent_count, status, open_rate } = req.body;
    const result = await sql`
      INSERT INTO blast_history (name, target_count, sent_count, status, open_rate) 
      VALUES (${name}, ${target_count}, ${sent_count}, ${status}, ${open_rate}) 
      RETURNING *
    `;
    res.json(result[0]);
  } catch (error) {
    console.error('Error creating blast:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ DASHBOARD STATS ============
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const revenueResult = await sql`SELECT COALESCE(SUM(value), 0) as total FROM deals WHERE stage = 'Closing'`;
    const dealsResult = await sql`SELECT COUNT(*) as count FROM deals WHERE stage NOT IN ('Closing', 'Lost')`;
    const blastResult = await sql`SELECT COALESCE(SUM(sent_count), 0) as total FROM blast_history`;
    const openRateResult = await sql`SELECT COALESCE(AVG(open_rate), 0) as avg FROM blast_history WHERE open_rate IS NOT NULL`;
    
    res.json({
      revenue: revenueResult[0].total,
      activeDeals: dealsResult[0].count,
      totalBlastSent: blastResult[0].total,
      avgOpenRate: parseFloat(openRateResult[0].avg).toFixed(1)
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ RECENT DEALS ============
app.get('/api/recent-deals', async (req, res) => {
  try {
    const deals = await sql`SELECT * FROM deals ORDER BY created_at DESC LIMIT 5`;
    res.json(deals);
  } catch (error) {
    console.error('Error fetching recent deals:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ DEALS BY STAGE (for pipeline) ============
app.get('/api/deals/by-stage', async (req, res) => {
  try {
    const stages = ['Prospek Baru', 'Kualifikasi', 'Presentasi', 'Negosiasi', 'Closing'];
    const result = {};
    
    for (const stage of stages) {
      const deals = await sql`SELECT * FROM deals WHERE stage = ${stage}`;
      result[stage] = deals;
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching deals by stage:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ CONTACTS STATS ============
app.get('/api/contacts/stats', async (req, res) => {
  try {
    const total = await sql`SELECT COUNT(*) as count FROM contacts`;
    const active = await sql`SELECT COUNT(*) as count FROM contacts WHERE status = 'active'`;
    const byGroup = await sql`SELECT "group", COUNT(*) as count FROM contacts GROUP BY "group"`;
    
    res.json({
      total: total[0].count,
      active: active[0].count,
      byGroup: byGroup
    });
  } catch (error) {
    console.error('Error fetching contacts stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Test database: http://localhost:${PORT}/api/test`);
  console.log(`📋 Contacts: http://localhost:${PORT}/api/contacts`);
  console.log(`💼 Deals: http://localhost:${PORT}/api/deals`);
  console.log(`📈 Dashboard: http://localhost:${PORT}/api/dashboard/stats`);
});