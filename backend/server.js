// server.js
//
// This server application fetches token data from the MultiversX API every minute,
// processes the data, and stores it in a PostgreSQL database. It maintains a real-time
// table with minute-level data and also aggregates this data into hourly and daily
// summaries for efficient storage and analysis. Only tokens with available prices
// are stored and aggregated.
require("dotenv").config(); // Loads environment variables from a .env file
const express = require("express");
const cors = require('cors');

// ... other require statements ...
const apiRoutes = require("./apiRoutes");
const cron = require("node-cron");
const axios = require("axios");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 3000;


// Enable CORS for all routes
app.use(cors());

// Use the API routes
app.use("/api", apiRoutes);


// Set up a connection pool to the PostgreSQL database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
module.exports = pool;

// Function to test the database connection
async function testConnection() {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("Database connection test result:", res.rows);
  } catch (error) {
    console.error("Database connection test failed:", error);
  }
}

// Immediately test the database connection
testConnection();

// Function to process and insert/update token data in the database
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

// Schedule a cron job to run every minute to fetch and process token data
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

// Function for hourly aggregation of data
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

// Function for daily aggregation of data
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

// Schedule hourly and daily data aggregation
cron.schedule("0 * * * *", aggregateHourlyData); // Every hour
cron.schedule("0 0 * * *", aggregateDailyData); // Every day at midnight

// Start the Express server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
