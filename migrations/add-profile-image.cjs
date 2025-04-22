const { pool } = require('../server/db');

async function migrateDb() {
  console.log('Starting migration: add-profile-image');
  
  try {
    // Check if profile_image_url column already exists in users table
    const { rows: userColumns } = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'profile_image_url'
    `);
    
    if (userColumns.length === 0) {
      console.log('Adding profile_image_url column to users table');
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN profile_image_url TEXT
      `);
    } else {
      console.log('profile_image_url column already exists in users table');
    }
    
    // Check if logo_url column already exists in churches table
    const { rows: churchColumns } = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'churches' AND column_name = 'logo_url'
    `);
    
    if (churchColumns.length === 0) {
      console.log('Adding logo_url column to churches table');
      await pool.query(`
        ALTER TABLE churches
        ADD COLUMN logo_url TEXT
      `);
    } else {
      console.log('logo_url column already exists in churches table');
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

migrateDb().catch(console.error);