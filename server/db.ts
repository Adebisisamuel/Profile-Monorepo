import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import ws from "ws";
import * as schema from "@shared/schema";
import dotenv from "dotenv";

dotenv.config();

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Use neon http client for serverless
let sql: ReturnType<typeof neon>;

try {
  console.log("[Database] Connecting to Neon database...");
  sql = neon(process.env.DATABASE_URL!);
} catch (error) {
  console.error("[Database] Failed to connect to Neon database:", error);
  // Fallback to a basic connection
  sql = neon(process.env.DATABASE_URL!);
}

export const db = drizzle(sql, { schema });

// Also export a pooled connection for session store with improved error handling
import pg from "pg";

// Connection pool configuration
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients the pool should contain
  idleTimeoutMillis: 30000, // Reduced from 30000 - clients allowed to remain idle before being closed
  connectionTimeoutMillis: 8000, // Increased from 5000 - wait time for a connection to be established
  application_name: "bedieningen-profiel",
  statement_timeout: 15000, // Abort queries after 10 seconds
  maxUses: 7500,
  max_retries: 3, // Number of times to retry a failed q
};

// Tracking pool state
let poolCreationTime = new Date();
let isPoolHealthy = true;
let connectionFailures = 0;
const MAX_FAILURES_BEFORE_RESET = 5;

// Create a pool with robust error handling
const createPool = () => {
  console.log("[Database] Creating new connection pool");

  const newPool = new pg.Pool(poolConfig);

  // Track when this pool was created
  poolCreationTime = new Date();
  isPoolHealthy = true;
  connectionFailures = 0;

  // Add error event handlers to prevent application crashes
  newPool.on("error", (err) => {
    console.error("[Database] Unexpected error on idle client", err);
    connectionFailures++;

    if (connectionFailures >= MAX_FAILURES_BEFORE_RESET) {
      isPoolHealthy = false;
      console.error(
        `[Database] Pool experienced ${connectionFailures} failures, marking as unhealthy`
      );
    }
  });

  // Log when clients are acquired and released (uncomment for debugging)
  /*
  newPool.on('acquire', () => {
    console.log('[Database] Client acquired from pool');
  });

  newPool.on('connect', () => {
    console.log('[Database] New connection established');
  });

  newPool.on('remove', () => {
    console.log('[Database] Client removed from pool');
  });
  */

  return newPool;
};

// Initial pool creation
export let pool = createPool();

// Add a function to check and refresh the connection if needed
export const ensureConnection = async (forceRefresh = false) => {
  // Force a refresh of the pool if it's unhealthy or older than 1 hour
  const poolAgeInMinutes =
    (new Date().getTime() - poolCreationTime.getTime()) / 60000;

  if (forceRefresh || !isPoolHealthy || poolAgeInMinutes > 60) {
    console.log(
      `[Database] Pool is ${
        isPoolHealthy ? "healthy" : "unhealthy"
      }, age: ${poolAgeInMinutes.toFixed(
        2
      )} minutes, force refresh: ${forceRefresh}`
    );

    if (pool && isPoolHealthy) {
      console.log("[Database] Pool is still healthy, skipping end.");
    } else {
      // Only end the pool if we absolutely need to
      console.log("[Database] Creating new pool as necessary");
      pool = createPool();
    }
  }

  // Try to get a connection with retries
  return await testConnectionWithRetry();
};

// Helper to test the connection with retries
const testConnectionWithRetry = async (retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Test with a simple query
      const client = await pool.connect();

      try {
        await client.query("SELECT 1 AS connection_test");
        isPoolHealthy = true;
        connectionFailures = 0;
        return true;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(
        `[Database] Connection test failed (attempt ${attempt}/${retries}):`,
        error
      );

      if (attempt === retries) {
        isPoolHealthy = false;
        connectionFailures++;
        console.error(`[Database] All ${retries} connection attempts failed`);
        return false;
      }

      // Wait before retrying (500ms, 1000ms, 2000ms, etc.)
      const delay = Math.min(500 * Math.pow(2, attempt - 1), 5000);
      console.log(`[Database] Waiting ${delay}ms before retry`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return false;
};

// Export a function to get a client with retry logic
export const getClientWithRetry = async (maxRetries = 3) => {
  // Make sure the pool is in good shape
  const isConnected = await ensureConnection();

  if (!isConnected) {
    throw new Error(
      "Could not establish database connection after multiple attempts"
    );
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await pool.connect();
    } catch (error) {
      console.error(
        `[Database] Failed to get client (attempt ${attempt}/${maxRetries}):`,
        error
      );

      if (attempt === maxRetries) {
        throw new Error(`Failed to get client after ${maxRetries} attempts`);
      }

      // Wait before retrying (500ms, 1000ms, 2000ms, etc.)
      const delay = Math.min(500 * Math.pow(2, attempt - 1), 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // This should never be reached but TypeScript requires a return
  throw new Error("Could not get database client after multiple attempts");
};
