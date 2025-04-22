import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from '../server/db';
import createTeamMembersTable from './create-team-members-table';

// This is a simple migration script for Drizzle ORM
async function main() {
  try {
    console.log('Running migrations...');
    
    // Run Drizzle ORM migrations first
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('Drizzle migrations completed successfully');
    
    // Run our custom team members table migration
    await createTeamMembersTable();
    console.log('Custom team_members table migration completed successfully');
    
    console.log('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();