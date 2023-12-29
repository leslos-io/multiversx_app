require('dotenv').config();
const { Pool } = require('pg');

// Create a new pool using the connection string from your .env file
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function testDatabaseConnection() {
    try {
        // Test the connection and fetch a single row from 'tokens' table
        const tokensQuery = await pool.query('SELECT * FROM tokens LIMIT 1');
        console.log('Connection to the tokens table successful. Data:', tokensQuery.rows);

        // Test the connection and fetch a single row from 'token_prices_minute' table
        const pricesQuery = await pool.query('SELECT * FROM token_prices_minute LIMIT 1');
        console.log('Connection to the token_prices_minute table successful. Data:', pricesQuery.rows);
        
        // Close the pool after testing is done to free up resources
        pool.end();
    } catch (error) {
        console.error('Error testing database connection:', error);
        pool.end();
    }
}

// Run the test
testDatabaseConnection();
