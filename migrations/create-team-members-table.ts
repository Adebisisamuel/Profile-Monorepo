import { pool } from "../server/db";

async function runMigration() {
  console.log("Starting migration: Create team_members table");
  
  try {
    // Check if table already exists
    const tableCheck = await pool.query(`
      SELECT to_regclass('public.team_members') as table_exists;
    `);
    
    if (tableCheck.rows[0].table_exists) {
      console.log("Table team_members already exists, skipping creation");
      return;
    }
    
    // Create the team_members table
    await pool.query(`
      CREATE TABLE team_members (
        user_id INTEGER NOT NULL,
        team_id INTEGER NOT NULL,
        joined_at TEXT NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, team_id)
      );
    `);
    
    console.log("Created team_members table");
    
    // Add indexes for performance
    await pool.query(`
      CREATE INDEX idx_team_members_user_id ON team_members (user_id);
    `);
    
    await pool.query(`
      CREATE INDEX idx_team_members_team_id ON team_members (team_id);
    `);
    
    console.log("Added indexes to team_members table");
    
    // Now populate the table with existing team-user relationships
    await pool.query(`
      INSERT INTO team_members (user_id, team_id)
      SELECT id as user_id, team_id
      FROM users
      WHERE team_id IS NOT NULL
      ON CONFLICT (user_id, team_id) DO NOTHING;
    `);
    
    console.log("Populated team_members table with existing relationships");
    
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Run the migration if this file is executed directly
// Using import.meta.url for ESM compatibility
if (import.meta.url === import.meta.resolve('./create-team-members-table.ts')) {
  runMigration()
    .then(() => {
      console.log("Migration completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export default runMigration;