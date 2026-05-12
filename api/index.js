const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    // GET /api/test - Test database connection
    if (req.method === "GET" && path === "/api/test") {
      const result = await sql`SELECT NOW()`;
      return res.json({
        success: true,
        timestamp: result[0].now,
        message: "Database connected!",
      });
    }

    // GET /api/contacts
    if (req.method === "GET" && path === "/api/contacts") {
      const contacts = await sql`SELECT * FROM contacts ORDER BY id DESC`;
      return res.json(contacts);
    }

    // GET /api/contacts/:id
    if (req.method === "GET" && path.match(/^\/api\/contacts\/\d+$/)) {
      const id = path.split("/").pop();
      const contact = await sql`SELECT * FROM contacts WHERE id = ${id}`;
      return res.json(contact[0] || null);
    }

    // POST /api/contacts
    if (req.method === "POST" && path === "/api/contacts") {
      const { name, phone, city, group, status } = req.body;
      const result = await sql`
        INSERT INTO contacts (name, phone, city, "group", status) 
        VALUES (${name}, ${phone}, ${city}, ${group}, ${status || "active"}) 
        RETURNING *
      `;
      return res.json(result[0]);
    }

    // PUT /api/contacts/:id
    if (req.method === "PUT" && path.match(/^\/api\/contacts\/\d+$/)) {
      const id = path.split("/").pop();
      const { name, phone, city, group, status } = req.body;
      const result = await sql`
        UPDATE contacts 
        SET name=${name}, phone=${phone}, city=${city}, "group"=${group}, status=${status} 
        WHERE id=${id} 
        RETURNING *
      `;
      return res.json(result[0]);
    }

    // DELETE /api/contacts/:id
    if (req.method === "DELETE" && path.match(/^\/api\/contacts\/\d+$/)) {
      const id = path.split("/").pop();
      await sql`DELETE FROM contacts WHERE id=${id}`;
      return res.json({ success: true, message: "Contact deleted" });
    }

    // GET /api/deals
    if (req.method === "GET" && path === "/api/deals") {
      const deals = await sql`SELECT * FROM deals ORDER BY created_at DESC`;
      return res.json(deals);
    }

    // POST /api/deals
    if (req.method === "POST" && path === "/api/deals") {
      const { company_name, pic_name, pic_phone, value, stage } = req.body;
      const result = await sql`
        INSERT INTO deals (company_name, pic_name, pic_phone, value, stage) 
        VALUES (${company_name}, ${pic_name}, ${pic_phone}, ${value}, ${stage || "Prospek Baru"}) 
        RETURNING *
      `;
      return res.json(result[0]);
    }

    // PUT /api/deals/:id
    if (req.method === "PUT" && path.match(/^\/api\/deals\/\d+$/)) {
      const id = path.split("/").pop();
      const { stage, value } = req.body;
      const result = await sql`
        UPDATE deals 
        SET stage=${stage}, value=${value} 
        WHERE id=${id} 
        RETURNING *
      `;
      return res.json(result[0]);
    }

    // DELETE /api/deals/:id
    if (req.method === "DELETE" && path.match(/^\/api\/deals\/\d+$/)) {
      const id = path.split("/").pop();
      await sql`DELETE FROM deals WHERE id=${id}`;
      return res.json({ success: true, message: "Deal deleted" });
    }

    // GET /api/blasts
    if (req.method === "GET" && path === "/api/blasts") {
      const blasts =
        await sql`SELECT * FROM blast_history ORDER BY created_at DESC`;
      return res.json(blasts);
    }

    // POST /api/blasts
    if (req.method === "POST" && path === "/api/blasts") {
      const { name, target_count, sent_count, status, open_rate } = req.body;
      const result = await sql`
        INSERT INTO blast_history (name, target_count, sent_count, status, open_rate) 
        VALUES (${name}, ${target_count}, ${sent_count}, ${status}, ${open_rate}) 
        RETURNING *
      `;
      return res.json(result[0]);
    }

    // GET /api/dashboard/stats
    if (req.method === "GET" && path === "/api/dashboard/stats") {
      const revenueResult =
        await sql`SELECT COALESCE(SUM(value), 0) as total FROM deals WHERE stage = 'Closing'`;
      const dealsResult =
        await sql`SELECT COUNT(*) as count FROM deals WHERE stage NOT IN ('Closing', 'Lost')`;
      const blastResult =
        await sql`SELECT COALESCE(SUM(sent_count), 0) as total FROM blast_history`;
      const openRateResult =
        await sql`SELECT COALESCE(AVG(open_rate), 0) as avg FROM blast_history WHERE open_rate IS NOT NULL`;

      return res.json({
        revenue: revenueResult[0].total,
        activeDeals: dealsResult[0].count,
        totalBlastSent: blastResult[0].total,
        avgOpenRate: parseFloat(openRateResult[0].avg).toFixed(1),
      });
    }

    // GET /api/recent-deals
    if (req.method === "GET" && path === "/api/recent-deals") {
      const deals =
        await sql`SELECT * FROM deals ORDER BY created_at DESC LIMIT 5`;
      return res.json(deals);
    }

    // GET /api/deals/by-stage
    if (req.method === "GET" && path === "/api/deals/by-stage") {
      const stages = [
        "Prospek Baru",
        "Kualifikasi",
        "Presentasi",
        "Negosiasi",
        "Closing",
      ];
      const result = {};

      for (const stage of stages) {
        const deals = await sql`SELECT * FROM deals WHERE stage = ${stage}`;
        result[stage] = deals;
      }

      return res.json(result);
    }

    // GET /api/health
    if (req.method === "GET" && path === "/api/health") {
      return res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: process.env.DATABASE_URL ? "configured" : "missing",
      });
    }

    // Root endpoint
    if (req.method === "GET" && path === "/") {
      return res.json({
        message: "Blaz CRM Backend API",
        status: "active",
        endpoints: [
          "/api/health",
          "/api/test",
          "/api/contacts",
          "/api/deals",
          "/api/blasts",
          "/api/dashboard/stats",
          "/api/recent-deals",
          "/api/deals/by-stage",
        ],
      });
    }

    // 404 - Not found
    return res.status(404).json({ error: "Endpoint not found" });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
};
