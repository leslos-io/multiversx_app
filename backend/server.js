// server.js
//
// This server application fetches token data from the MultiversX API every minute,
// processes the data, and stores it in a PostgreSQL database. It maintains real-time
// tables with minute-level, hourly, and daily data. Only tokens with available prices
// are stored and aggregated.

// Import required modules
require("dotenv").config(); // Loads environment variables from a .env file
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const axios = require("axios");
const { Pool } = require("pg");
const apiRoutes = require("./apiRoutes");

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware setup
app.use(cors()); // Enable CORS for all routes
app.use("/api", apiRoutes); // Use the API routes

// PostgreSQL Database connection setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
module.exports = pool; // Export the pool for use in other modules

// Function Declarations

// Test database connection
async function testConnection() {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("Database connection test result:", res.rows);
  } catch (error) {
    console.error("Database connection test failed:", error);
  }
}
testConnection(); // Immediately test the database connection

// Process and upsert token data into the database
async function processTokenData(token) {
  // Prepare data, ensuring that undefined properties don't cause errors
  const assets = token.assets || {};
  const website = assets.website || "";
  const description = assets.description || "";
  const logoUrl = assets.svgUrl || assets.pngUrl || "";
  const socialLinks = JSON.stringify({
    blog: assets.social?.blog || "",
    telegram: assets.social?.telegram || "",
    twitter: assets.social?.twitter || "",
    whitepaper: assets.social?.whitepaper || "",
  });

  // Upsert (insert or update) token data into the tokens table
  await pool.query(
    `INSERT INTO tokens (identifier, name, ticker, owner, decimals, website, description, logo_url, social_links)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (identifier) DO UPDATE
      SET name = EXCLUDED.name, 
          ticker = EXCLUDED.ticker, 
          owner = EXCLUDED.owner, 
          decimals = EXCLUDED.decimals, 
          website = EXCLUDED.website, 
          description = EXCLUDED.description, 
          logo_url = EXCLUDED.logo_url, 
          social_links = EXCLUDED.social_links`,
    [
      token.identifier,
      token.name,
      token.ticker,
      token.owner,
      token.decimals,
      website,
      description,
      logoUrl,
      socialLinks,
    ]
  );

  // Retrieve the token's ID
  const tokenRes = await pool.query(
    "SELECT id FROM tokens WHERE identifier = $1",
    [token.identifier]
  );
  const tokenId = tokenRes.rows[0].id;

  // Check if the price is valid (not null and not undefined) before inserting into token_prices_minute
  if (token.price !== null && token.price !== undefined) {
    // Insert price data into the token_prices_minute table
    await pool.query(
      "INSERT INTO token_prices_minute (token_id, price, market_cap, supply, circulating_supply) VALUES ($1, $2, $3, $4, $5)",
      [
        tokenId,
        token.price,
        token.marketCap,
        token.supply,
        token.circulatingSupply,
      ]
    );
  }
}

// Aggregate data into hourly summaries
async function aggregateHourlyData() {
  try {
    const aggQuery = `
                INSERT INTO token_prices_hourly (token_id, last_price, market_cap, supply, circulating_supply, timestamp)
                SELECT DISTINCT ON (token_id)
                    token_id, 
                    price as last_price, 
                    market_cap, 
                    supply, 
                    circulating_supply, 
                    DATE_TRUNC('hour', timestamp) as timestamp
                FROM token_prices_minute
                WHERE timestamp < DATE_TRUNC('hour', NOW())
                ORDER BY token_id, timestamp DESC
                ON CONFLICT DO NOTHING;
            `;

    await pool.query(aggQuery);
    console.log("Hourly data aggregation complete");
  } catch (error) {
    console.error("Error in hourly data aggregation:", error);
  }
}

// Aggregate data into daily summaries
async function aggregateDailyData() {
  try {
    const aggQuery = `
                INSERT INTO token_prices_daily (token_id, last_price, market_cap, supply, circulating_supply, timestamp)
                SELECT DISTINCT ON (token_id)
                    token_id, 
                    price as last_price, 
                    market_cap, 
                    supply, 
                    circulating_supply, 
                    DATE_TRUNC('day', timestamp) as timestamp
                FROM token_prices_minute
                WHERE timestamp < DATE_TRUNC('day', NOW())
                ORDER BY token_id, timestamp DESC
                ON CONFLICT DO NOTHING;
            `;

    await pool.query(aggQuery);
    console.log("Daily data aggregation complete");
  } catch (error) {
    console.error("Error in daily data aggregation:", error);
  }
}

// Delete old data from token_prices_minute table
async function deleteOldMinuteData() {
  try {
    await pool.query(
      "DELETE FROM token_prices_minute WHERE timestamp < NOW() - INTERVAL '7 days'"
    );
    console.log("Old minute-level data deleted");
  } catch (error) {
    console.error("Error deleting old minute-level data:", error);
  }
}

// Delete old data from token_prices_hourly table
async function deleteOldHourlyData() {
  try {
    await pool.query(
      "DELETE FROM token_prices_hourly WHERE timestamp < NOW() - INTERVAL '1 year'"
    );
    console.log("Old hourly-level data deleted");
  } catch (error) {
    console.error("Error deleting old hourly-level data:", error);
  }
}

// Delete old data from token_prices_daily table
async function deleteOldDailyData() {
  try {
    await pool.query(
      "DELETE FROM token_prices_daily WHERE timestamp < NOW() - INTERVAL '2 years'"
    );
    console.log("Old daily-level data deleted");
  } catch (error) {
    console.error("Error deleting old daily-level data:", error);
  }
}

// Cron Job Scheduling

// Fetch and process token data every minute
cron.schedule("* * * * *", async () => {
  try {
    const response = await axios.get(
      "https://api.multiversx.com/tokens?type=FungibleESDT&size=10000&sort=marketCap&order=desc"
    );
    const tokens = response.data;

    for (const token of tokens) {
      await processTokenData(token);
    }
  } catch (error) {
    console.error("Error fetching or saving data: ", error);
  }
});

// Schedule hourly and daily data aggregation
cron.schedule("0 * * * *", aggregateHourlyData); // Every hour
cron.schedule("0 0 * * *", aggregateDailyData); // Every day at midnight

// Schedule data deletion jobs
cron.schedule("0 0 * * *", deleteOldMinuteData); // Delete minute-level data every day at midnight
cron.schedule("0 1 * * *", deleteOldHourlyData); // Delete hourly data every day at 1:00 AM
cron.schedule("0 2 * * *", deleteOldDailyData); // Delete daily data every day at 2:00 AM

// Start the Express server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
