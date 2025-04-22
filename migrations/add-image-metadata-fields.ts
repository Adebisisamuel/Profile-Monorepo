import { db, pool } from "../server/db";
import { sql } from "drizzle-orm";

async function runMigration() {
  console.log("Starting migration: Add image metadata fields");
  
  try {
    // Add profileImageMetadata to users table
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS profile_image_metadata TEXT;
    `);
    console.log("Added profile_image_metadata to users table");

    // Add logoMetadata to churches table
    await db.execute(sql`
      ALTER TABLE churches
      ADD COLUMN IF NOT EXISTS logo_metadata TEXT;
    `);
    console.log("Added logo_metadata to churches table");
    
    console.log("Migration completed successfully");
    return true;
  } catch (error) {
    console.error("Migration failed:", error);
    return false;
  } finally {
    await pool.end();
  }
}

runMigration().then((success) => {
  process.exit(success ? 0 : 1);
});