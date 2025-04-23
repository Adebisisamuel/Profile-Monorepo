// import { neon, neonConfig } from "@neondatabase/serverless";
// import { drizzle } from "drizzle-orm/neon-http";
// import ws from "ws";
// import * as schema from "@shared/schema";
// import dotenv from "dotenv";

// dotenv.config();

// neonConfig.webSocketConstructor = ws;

// if (!process.env.DATABASE_URL) {
//   throw new Error(
//     "DATABASE_URL must be set. Did you forget to provision a database?"
//   );
// }

// // Use neon http client for serverless
// let sql: ReturnType<typeof neon>;

// try {
//   console.log("[Database] Connecting to Neon database...");
//   sql = neon(process.env.DATABASE_URL!);
// } catch (error) {
//   console.error("[Database] Failed to connect to Neon database:", error);
//   // Fallback to a basic connection
//   sql = neon(process.env.DATABASE_URL!);
// }

// export const db = drizzle(sql, { schema });

// // Also export a pooled connection for session store with improved error handling
// import pg from "pg";

// // Connection pool configuration
// const poolConfig = {
//   connectionString: process.env.DATABASE_URL,
//   max: 10, // Maximum number of clients the pool should contain
//   idleTimeoutMillis: 15000, // Reduced from 30000 - clients allowed to remain idle before being closed
//   connectionTimeoutMillis: 8000, // Increased from 5000 - wait time for a connection to be established
//   application_name: "bedieningen-profiel",
//   statement_timeout: 10000, // Abort queries after 10 seconds
//   max_retries: 3, // Number of times to retry a failed query
// };

// // Tracking pool state
// let poolCreationTime = new Date();
// let isPoolHealthy = true;
// let connectionFailures = 0;
// const MAX_FAILURES_BEFORE_RESET = 5;

// // Create a pool with robust error handling
// const createPool = () => {
//   console.log("[Database] Creating new connection pool");

//   const newPool = new pg.Pool(poolConfig);

//   // Track when this pool was created
//   poolCreationTime = new Date();
//   isPoolHealthy = true;
//   connectionFailures = 0;

//   // Add error event handlers to prevent application crashes
//   newPool.on("error", (err) => {
//     console.error("[Database] Unexpected error on idle client", err);
//     connectionFailures++;

//     if (connectionFailures >= MAX_FAILURES_BEFORE_RESET) {
//       isPoolHealthy = false;
//       console.error(
//         `[Database] Pool experienced ${connectionFailures} failures, marking as unhealthy`
//       );
//     }
//   });

//   // Log when clients are acquired and released (uncomment for debugging)
//   /*
//   newPool.on('acquire', () => {
//     console.log('[Database] Client acquired from pool');
//   });

//   newPool.on('connect', () => {
//     console.log('[Database] New connection established');
//   });

//   newPool.on('remove', () => {
//     console.log('[Database] Client removed from pool');
//   });
//   */

//   return newPool;
// };

// // Initial pool creation
// export let pool = createPool();

// // Add a function to check and refresh the connection if needed
// export const ensureConnection = async (forceRefresh = false) => {
//   // Force a refresh of the pool if it's unhealthy or older than 1 hour
//   const poolAgeInMinutes =
//     (new Date().getTime() - poolCreationTime.getTime()) / 60000;

//   if (forceRefresh || !isPoolHealthy || poolAgeInMinutes > 60) {
//     console.log(
//       `[Database] Pool is ${
//         isPoolHealthy ? "healthy" : "unhealthy"
//       }, age: ${poolAgeInMinutes.toFixed(
//         2
//       )} minutes, force refresh: ${forceRefresh}`
//     );

//     if (pool) {
//       try {
//         console.log("[Database] Ending existing pool gracefully");
//         await pool.end();
//         // After calling end, wait a bit to ensure it is properly cleaned up
//         await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second
//       } catch (endError) {
//         console.error("[Database] Error ending pool:", endError);
//         // Continue anyway, we want to create a new pool
//       }
//     }

//     // Create a fresh pool
//     pool = createPool();
//   }

//   // Try to get a connection with retries
//   return await testConnectionWithRetry();
// };

// // Helper to test the connection with retries
// const testConnectionWithRetry = async (retries = 3) => {
//   for (let attempt = 1; attempt <= retries; attempt++) {
//     try {
//       // Test with a simple query
//       const client = await pool.connect();

//       try {
//         await client.query("SELECT 1 AS connection_test");
//         isPoolHealthy = true;
//         connectionFailures = 0;
//         return true;
//       } finally {
//         client.release();
//       }
//     } catch (error) {
//       console.error(
//         `[Database] Connection test failed (attempt ${attempt}/${retries}):`,
//         error
//       );

//       if (attempt === retries) {
//         isPoolHealthy = false;
//         connectionFailures++;
//         console.error(`[Database] All ${retries} connection attempts failed`);
//         return false;
//       }

//       // Wait before retrying (500ms, 1000ms, 2000ms, etc.)
//       const delay = Math.min(500 * Math.pow(2, attempt - 1), 5000);
//       console.log(`[Database] Waiting ${delay}ms before retry`);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }

//   return false;
// };

// // Export a function to get a client with retry logic
// export const getClientWithRetry = async (maxRetries = 3) => {
//   // Make sure the pool is in good shape
//   const isConnected = await ensureConnection();

//   if (!isConnected) {
//     throw new Error(
//       "Could not establish database connection after multiple attempts"
//     );
//   }

//   for (let attempt = 1; attempt <= maxRetries; attempt++) {
//     try {
//       return await pool.connect();
//     } catch (error) {
//       console.error(
//         `[Database] Failed to get client (attempt ${attempt}/${maxRetries}):`,
//         error
//       );

//       if (attempt === maxRetries) {
//         throw new Error(`Failed to get client after ${maxRetries} attempts`);
//       }

//       // Wait before retrying (500ms, 1000ms, 2000ms, etc.)
//       const delay = Math.min(500 * Math.pow(2, attempt - 1), 5000);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }

//   // This should never be reached but TypeScript requires a return
//   throw new Error("Could not get database client after multiple attempts");
// };

import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import ws from "ws";
import * as schema from "@shared/schema";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// --- Neon HTTP Client (Drizzle ORM) — No pool, very safe for serverless ---
console.log("[Database] Connecting to Neon with HTTP client...");
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema }); // ✅ Use this for most of your DB logic

// --- PG Pool (used for sessions, transactions, raw queries only) ---
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20, // ✅ Keep this very low for Neon
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  application_name: "bedieningen-profiel",
  statement_timeout: 10000,
};

let pool: pg.Pool | null = new pg.Pool(poolConfig); // Initialize pool
let poolCreationTime = new Date();
let isPoolHealthy = true;
let connectionFailures = 0;
const MAX_FAILURES_BEFORE_RESET = 3;

pool?.on("error", (err) => {
  // Safe check for pool before using it
  console.error("[Database] Unexpected error on idle client", err);
  connectionFailures++;
  if (connectionFailures >= MAX_FAILURES_BEFORE_RESET) {
    isPoolHealthy = false;
    console.error("[Database] PG pool marked as unhealthy");
  }
});

pool?.on("acquire", () => {
  // Safe check for pool before using it
  console.log(
    `[Database] PG client acquired. Total: ${pool?.totalCount}, Idle: ${pool?.idleCount}`
  );
});

// --- Auto-pool refresh logic ---
const createPool = () => {
  console.log("[Database] Recreating PG connection pool...");
  connectionFailures = 0;
  poolCreationTime = new Date();
  isPoolHealthy = true;
  return new pg.Pool(poolConfig);
};

const ensureConnection = async (forceRefresh = false) => {
  const age = (Date.now() - poolCreationTime.getTime()) / 60000;

  if (forceRefresh || !isPoolHealthy || age > 60) {
    console.log(
      `[Database] Refreshing pool. Age: ${age.toFixed(
        1
      )} mins, Force: ${forceRefresh}`
    );

    const oldPool = pool;
    pool = createPool(); // Assign a new pool immediately after.

    try {
      if (oldPool) {
        // Ensure oldPool is not null
        await oldPool.end(); // Close the old pool
      }
      await new Promise((res) => setTimeout(res, 1000)); // small cooldown
    } catch (err) {
      console.error("[Database] Error closing old pool:", err);
    }
  }

  return await testConnectionWithRetry();
};

const testConnectionWithRetry = async (retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (!pool) {
        throw new Error("PG Pool is not initialized.");
      }

      const client = await pool.connect();
      try {
        await client.query("SELECT 1");
        isPoolHealthy = true;
        connectionFailures = 0;
        client.release();
        return true;
      } catch (err) {
        client.release();
        throw err;
      }
    } catch (error) {
      console.error(
        `[Database] Connection test failed (attempt ${attempt}):`,
        error
      );
      await new Promise((res) =>
        setTimeout(res, Math.min(500 * 2 ** (attempt - 1), 2000))
      );
    }
  }

  isPoolHealthy = false;
  return false;
};

// --- Safe Client Getter with Release Wrapper ---
export const runWithPgClient = async (
  callback: (arg0: pg.PoolClient) => any
) => {
  const isConnected = await ensureConnection();
  if (!isConnected) {
    throw new Error(
      "Could not establish a healthy connection to the database."
    );
  }

  if (!pool) {
    throw new Error("PG Pool is not initialized.");
  }

  const client = await pool.connect();
  try {
    return await callback(client);
  } finally {
    client.release(); // ✅ Always release the client
  }
};

// Optional: Expose pool for rare manual use
export { pool };
export { ensureConnection };
