// backend/apiRoutes.js
const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
//const pool = require('./server'); // Adjust the path as necessary

// Create a new PostgreSQL pool using the connection string from the .env file
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Example route: Get data from your database
router.get("/tokens", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT * FROM token_prices_minute"); // Adjust the query as needed
    client.release();
    res.json(result.rows);
  } catch (err) {
    console.error("Database query error:", err); // Log the full error
    res.status(500).send("Server error");
  }
});

router.get("/token-data", async (req, res) => {
  try {
    const client = await pool.connect();
    const query = `
    SELECT 
    t.*,
    pm.price as current_price,
    pm.market_cap as current_market_cap,
    CASE WHEN pm.price IS NOT NULL THEN ph1h.last_price ELSE NULL END as price_1h_ago,
    CASE WHEN pm.price IS NOT NULL THEN ph1h.market_cap ELSE NULL END as market_cap_1h_ago,
    CASE WHEN pm.price IS NOT NULL THEN ph24h.last_price ELSE NULL END as price_24h_ago,
    CASE WHEN pm.price IS NOT NULL THEN ph24h.market_cap ELSE NULL END as market_cap_24h_ago,
    CASE WHEN pm.price IS NOT NULL THEN pd7d.last_price ELSE NULL END as price_7d_ago,
    CASE WHEN pm.price IS NOT NULL THEN pd7d.market_cap ELSE NULL END as market_cap_7d_ago,
    CASE WHEN pm.price IS NOT NULL THEN pd30d.last_price ELSE NULL END as price_30d_ago,
    CASE WHEN pm.price IS NOT NULL THEN pd30d.market_cap ELSE NULL END as market_cap_30d_ago,
    CASE WHEN pm.price IS NOT NULL THEN pd60d.last_price ELSE NULL END as price_60d_ago,
    CASE WHEN pm.price IS NOT NULL THEN pd60d.market_cap ELSE NULL END as market_cap_60d_ago,
    CASE WHEN pm.price IS NOT NULL THEN pd90d.last_price ELSE NULL END as price_90d_ago,
    CASE WHEN pm.price IS NOT NULL THEN pd90d.market_cap ELSE NULL END as market_cap_90d_ago,
    CASE WHEN pm.price IS NOT NULL THEN pdYTD.last_price ELSE NULL END as price_ytd_ago,
    CASE WHEN pm.price IS NOT NULL THEN pdYTD.market_cap ELSE NULL END as market_cap_ytd_ago
FROM 
    tokens t
LEFT JOIN 
    (SELECT DISTINCT ON (token_id) * FROM token_prices_minute ORDER BY token_id, timestamp DESC) pm ON t.id = pm.token_id
LEFT JOIN 
    token_prices_hourly ph1h ON t.id = ph1h.token_id AND ph1h.timestamp = (SELECT MAX(timestamp) FROM token_prices_hourly WHERE token_id = ph1h.token_id AND timestamp <= NOW() - INTERVAL '1 hour')
LEFT JOIN 
    token_prices_hourly ph24h ON t.id = ph24h.token_id AND ph24h.timestamp = (SELECT MAX(timestamp) FROM token_prices_hourly WHERE token_id = ph24h.token_id AND timestamp <= NOW() - INTERVAL '24 hours')
LEFT JOIN 
    token_prices_daily pd7d ON t.id = pd7d.token_id AND pd7d.timestamp = (SELECT MAX(timestamp) FROM token_prices_daily WHERE token_id = pd7d.token_id AND timestamp <= NOW() - INTERVAL '7 days')
LEFT JOIN 
    token_prices_daily pd30d ON t.id = pd30d.token_id AND pd30d.timestamp = (SELECT MAX(timestamp) FROM token_prices_daily WHERE token_id = pd30d.token_id AND timestamp <= NOW() - INTERVAL '30 days')
LEFT JOIN 
    token_prices_daily pd60d ON t.id = pd60d.token_id AND pd60d.timestamp = (SELECT MAX(timestamp) FROM token_prices_daily WHERE token_id = pd60d.token_id AND timestamp <= NOW() - INTERVAL '60 days')
LEFT JOIN 
    token_prices_daily pd90d ON t.id = pd90d.token_id AND pd90d.timestamp = (SELECT MAX(timestamp) FROM token_prices_daily WHERE token_id = pd90d.token_id AND timestamp <= NOW() - INTERVAL '90 days')
LEFT JOIN 
    token_prices_daily pdYTD ON t.id = pdYTD.token_id AND pdYTD.timestamp = (SELECT MAX(timestamp) FROM token_prices_daily WHERE token_id = pdYTD.token_id AND timestamp <= NOW() - INTERVAL '1 year')
    WHERE 
    t.identifier NOT IN (SELECT identifier FROM token_blacklist)
    AND (
        t.website IS NOT NULL AND t.website <> ''
        OR NULLIF(t.social_links->>'blog', '') IS NOT NULL 
        OR NULLIF(t.social_links->>'twitter', '') IS NOT NULL 
        OR NULLIF(t.social_links->>'telegram', '') IS NOT NULL 
        OR NULLIF(t.social_links->>'whitepaper', '') IS NOT NULL
    )
    AND NOT (t.name LIKE '%LP')
    
    AND NOT (t.ticker LIKE 'LP%'); 
      `;
    const result = await client.query(query);
    client.release();
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching token data:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
