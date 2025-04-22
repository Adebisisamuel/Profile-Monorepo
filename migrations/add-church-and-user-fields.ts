import { pool } from "../server/db";

async function runMigration() {
  console.log("Starting migration: add church inviteCode and user churchId fields");

  const client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    // Check if the invite_code column exists in the churches table
    const churchTableCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'churches' AND column_name = 'invite_code'
    `);
    
    // Add invite_code column to churches table if it doesn't exist
    if (churchTableCheck.rows.length === 0) {
      console.log("Adding invite_code column to churches table");
      await client.query(`
        ALTER TABLE churches
        ADD COLUMN invite_code TEXT
      `);
      console.log("Added invite_code column to churches table");
    } else {
      console.log("invite_code column already exists in churches table");
    }
    
    // Check if the church_id column exists in the users table
    const usersTableCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'church_id'
    `);
    
    // Add church_id column to users table if it doesn't exist
    if (usersTableCheck.rows.length === 0) {
      console.log("Adding church_id column to users table");
      await client.query(`
        ALTER TABLE users
        ADD COLUMN church_id INTEGER
      `);
      console.log("Added church_id column to users table");
    } else {
      console.log("church_id column already exists in users table");
    }
    
    // Generate invite codes for churches that don't have one
    console.log("Generating invite codes for churches without one");
    await client.query(`
      UPDATE churches
      SET invite_code = SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10)
      WHERE invite_code IS NULL
    `);
    
    // If users are in teams, set their church_id based on their team's church_id
    console.log("Updating user church_id based on team membership");
    await client.query(`
      UPDATE users u
      SET church_id = t.church_id
      FROM teams t
      WHERE u.team_id = t.id
        AND t.church_id IS NOT NULL
        AND (u.church_id IS NULL OR u.church_id != t.church_id)
    `);
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log("Migration completed successfully");
  } catch (error) {
    // If anything goes wrong, rollback
    await client.query('ROLLBACK');
    console.error("Migration failed:", error);
    throw error;
  } finally {
    // Release the client back to the pool
    client.release();
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log("Migration script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration script failed:", error);
    process.exit(1);
  });