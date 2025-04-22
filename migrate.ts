import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { users, teams, roleScores } from "./shared/schema";

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  try {
    console.log("🚀 Running database migration...");
    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql as any);

    // Create tables if they don't exist
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        team_id INTEGER
      )
    `;

    const createTeamsTable = `
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_by_id INTEGER NOT NULL,
        plan TEXT NOT NULL DEFAULT 'free'
      )
    `;

    const createRoleScoresTable = `
      CREATE TABLE IF NOT EXISTS role_scores (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        apostle INTEGER NOT NULL,
        prophet INTEGER NOT NULL,
        evangelist INTEGER NOT NULL,
        herder INTEGER NOT NULL,
        teacher INTEGER NOT NULL,
        responses JSONB NOT NULL,
        created_at TEXT NOT NULL
      )
    `;

    // Execute the creation of tables
    await sql(createUsersTable);
    await sql(createTeamsTable);
    await sql(createRoleScoresTable);

    console.log("✅ Migration completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();