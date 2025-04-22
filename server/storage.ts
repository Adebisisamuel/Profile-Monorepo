import { 
  users, teams, roleScores, churches, teamMembers, 
  type User, type InsertUser, 
  type Team, type InsertTeam, 
  type RoleScore, type InsertRoleScore, 
  type Church, type InsertChurch,
  type TeamMember, type InsertTeamMember 
} from "@shared/schema";
import { RoleResults } from "@shared/types";
import { ROLES } from "@shared/constants";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { eq, and, isNotNull, inArray } from "drizzle-orm";
import { db, pool, ensureConnection } from "./db";
import { nanoid } from "nanoid";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  getTeam(id: number): Promise<Team | undefined>;
  getTeamsByCreatedBy(createdById: number): Promise<Team[]>;
  getTeamByInviteCode(inviteCode: string): Promise<Team | undefined>;
  getTeamsByChurchId(churchId: number): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<boolean>;
  
  getChurch(id: number): Promise<Church | undefined>;
  getChurchesByCreatedBy(createdById: number): Promise<Church[]>;
  getAllChurches(): Promise<Church[]>;
  createChurch(church: InsertChurch): Promise<Church>;
  updateChurch(id: number, church: Partial<InsertChurch>): Promise<Church | undefined>;
  deleteChurch(id: number): Promise<boolean>;
  
  getRoleScore(id: number): Promise<RoleScore | undefined>;
  getRoleScoreByUserId(userId: number): Promise<RoleScore | undefined>;
  getTeamRoleScores(teamId: number): Promise<RoleScore[]>;
  getChurchRoleScores(churchId: number): Promise<RoleScore[]>;
  createRoleScore(roleScore: InsertRoleScore): Promise<RoleScore>;
  updateRoleScore(id: number, roleScore: Partial<InsertRoleScore>): Promise<RoleScore | undefined>;
  deleteRoleScore(id: number): Promise<boolean>;

  // Team membership functions
  getUsersInTeam(teamId: number): Promise<User[]>;
  getUsersInChurch(churchId: number): Promise<User[]>;
  getTeamsForUser(userId: number): Promise<Team[]>;
  addUserToTeam(userId: number, teamId: number): Promise<TeamMember>;
  removeUserFromTeam(userId: number, teamId: number): Promise<boolean>;
  isUserInTeam(userId: number, teamId: number): Promise<boolean>;
  
  // Legacy function maintained for backward compatibility
  joinTeam(userId: number, teamId: number): Promise<User | undefined>;
  
  joinChurch(userId: number, churchId: number): Promise<User | undefined>;
  getChurchByInviteCode(inviteCode: string): Promise<Church | undefined>;
  
  generateInviteCode(): string;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;
  private pgSessionStore: any; // Type for the PG session store
  
  constructor() {
    const PostgresStore = connectPg(session);
    
    // Create a more robust session store with error handling and cleanup
    this.pgSessionStore = new PostgresStore({
      pool: pool,
      createTableIfMissing: true,
      tableName: 'session', // Default name
      pruneSessionInterval: 60 * 15 // Prune sessions every 15 minutes
    } as any); // Using 'as any' to bypass TypeScript check for errorCallback
    
    // Set error handler separately
    if (this.pgSessionStore.on) {
      this.pgSessionStore.on('error', (err: Error) => {
        console.error('[Session Store] Error in PostgreSQL session store:', err);
        // Don't crash on session store errors
      });
    }
    
    // Set up periodic connection checks
    this.setupPeriodicalConnectivityChecks();
    
    this.sessionStore = this.pgSessionStore;
  }
  
  // Setup periodic connectivity checks for the session store
  private setupPeriodicalConnectivityChecks() {
    // Check session store connectivity every 10 minutes
    const checkInterval = 10 * 60 * 1000; // 10 minutes
    
    const checkConnectivity = async () => {
      try {
        console.log('[Session Store] Running scheduled session store connectivity check');
        
        // Check database connection
        const isConnected = await ensureConnection();
        
        if (!isConnected) {
          console.error('[Session Store] Database connectivity check failed, attempting to refresh connection');
          await ensureConnection(true); // Force a refresh of the pool
          
          // Also reset the session store's pool connection
          if (this.pgSessionStore && this.pgSessionStore.pool !== pool) {
            console.log('[Session Store] Updating session store to use the new pool');
            this.pgSessionStore.pool = pool;
          }
        } else {
          console.log('[Session Store] Database connectivity check passed');
        }
      } catch (error) {
        console.error('[Session Store] Error during connectivity check:', error);
      }
      
      // Schedule next check
      setTimeout(checkConnectivity, checkInterval);
    };
    
    // Start checking after a delay
    setTimeout(checkConnectivity, 60 * 1000); // Start first check after 1 minute
    
    // Also set up a shorter check if there are issues
    const periodicQuickCheck = async () => {
      try {
        // Attempt to prune old sessions (this exercises the database connection)
        await this.pgSessionStore.pruneSessions((err: Error) => {
          if (err) {
            console.error('[Session Store] Error pruning sessions:', err);
          }
        });
      } catch (error) {
        console.error('[Session Store] Error during quick session check:', error);
      }
    };
    
    // Run quick check every hour
    setInterval(periodicQuickCheck, 60 * 60 * 1000); // 1 hour
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // If username is not provided, we can't find the user
    if (!username) return undefined;
    
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // Team methods
  async getTeam(id: number): Promise<Team | undefined> {
    try {
      // Only select the columns we know exist in the database
      const result = await db.select({
        id: teams.id,
        name: teams.name,
        createdById: teams.createdById,
        plan: teams.plan,
        inviteCode: teams.inviteCode,
        churchId: teams.churchId
      }).from(teams).where(eq(teams.id, id)).limit(1);
      
      if (result.length === 0) {
        return undefined;
      }
      
      return result[0];
    } catch (error) {
      console.error("Error in getTeam:", error);
      return undefined;
    }
  }

  async getTeamsByCreatedBy(createdById: number): Promise<Team[]> {
    try {
      // Only select the columns we know exist in the database
      const result = await db.select({
        id: teams.id,
        name: teams.name,
        createdById: teams.createdById,
        plan: teams.plan,
        inviteCode: teams.inviteCode,
        churchId: teams.churchId
      }).from(teams).where(eq(teams.createdById, createdById));
      
      return result;
    } catch (error) {
      // If there's still an error, return an empty array
      console.error("Error in getTeamsByCreatedBy:", error);
      return [];
    }
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    try {
      // Insert the team with all fields including churchId
      const result = await db.insert(teams).values(insertTeam).returning();
      return result[0];
    } catch (error) {
      console.error("Error in createTeam:", error);
      throw error;
    }
  }

  async updateTeam(id: number, updateData: Partial<InsertTeam>): Promise<Team | undefined> {
    try {
      // Update the team with all fields including churchId
      const result = await db.update(teams)
        .set(updateData)
        .where(eq(teams.id, id))
        .returning();
      
      if (result.length === 0) {
        return undefined;
      }
      
      return result[0];
    } catch (error) {
      console.error("Error in updateTeam:", error);
      throw error;
    }
  }

  async deleteTeam(id: number): Promise<boolean> {
    const result = await db.delete(teams).where(eq(teams.id, id)).returning();
    return result.length > 0;
  }

  // RoleScore methods
  async getRoleScore(id: number): Promise<RoleScore | undefined> {
    const result = await db.select().from(roleScores).where(eq(roleScores.id, id)).limit(1);
    return result[0];
  }

  async getRoleScoreByUserId(userId: number): Promise<RoleScore | undefined> {
    console.log(`[DB getRoleScoreByUserId] Getting role score for user ID: ${userId}`);
    try {
      // Check if the user exists first
      const user = await this.getUser(userId);
      if (!user) {
        console.log(`[DB getRoleScoreByUserId] User with ID ${userId} does not exist`);
        return undefined;
      }

      // Get the role score using ORM
      try {
        const result = await db.select().from(roleScores).where(eq(roleScores.userId, userId)).limit(1);
        
        if (result.length > 0) {
          console.log(`[DB getRoleScoreByUserId] Found role score for user ${userId}`);
        } else {
          console.log(`[DB getRoleScoreByUserId] No role score found for user ${userId}`);
        }
        
        return result[0];
      } catch (ormError) {
        console.error(`[DB getRoleScoreByUserId] ORM query failed for user ${userId}:`, ormError);
        
        // Fallback to raw SQL query
        const query = `
          SELECT * FROM role_scores 
          WHERE user_id = $1
          LIMIT 1
        `;
        
        const { rows } = await pool.query(query, [userId]);
        
        if (rows.length > 0) {
          console.log(`[DB getRoleScoreByUserId] Fallback SQL found role score for user ${userId}`);
          
          // Convert snake_case to camelCase
          return {
            id: rows[0].id,
            userId: rows[0].user_id,
            apostle: rows[0].apostle,
            prophet: rows[0].prophet,
            evangelist: rows[0].evangelist,
            herder: rows[0].herder,
            teacher: rows[0].teacher,
            responses: rows[0].responses,
            createdAt: rows[0].created_at
          };
        } else {
          console.log(`[DB getRoleScoreByUserId] No role score found for user ${userId} using fallback SQL`);
          return undefined;
        }
      }
    } catch (error) {
      console.error(`[DB getRoleScoreByUserId] Error:`, error);
      return undefined;
    }
  }

  async getTeamRoleScores(teamId: number): Promise<RoleScore[]> {
    // First get all users in the team
    const teamUsers = await this.getUsersInTeam(teamId);
    const userIds = teamUsers.map(user => user.id);
    
    if (userIds.length === 0) {
      return [];
    }
    
    // Then get role scores for those users
    const result = await db.select().from(roleScores).where(
      inArray(roleScores.userId, userIds)
    );
    return result;
  }

  async createRoleScore(insertRoleScore: InsertRoleScore): Promise<RoleScore> {
    const result = await db.insert(roleScores).values(insertRoleScore).returning();
    return result[0];
  }

  async updateRoleScore(id: number, updateData: Partial<InsertRoleScore>): Promise<RoleScore | undefined> {
    const result = await db.update(roleScores)
      .set(updateData)
      .where(eq(roleScores.id, id))
      .returning();
    return result[0];
  }

  async deleteRoleScore(id: number): Promise<boolean> {
    const result = await db.delete(roleScores).where(eq(roleScores.id, id)).returning();
    return result.length > 0;
  }

  // Church methods
  async getChurch(id: number): Promise<Church | undefined> {
    const result = await db.select().from(churches).where(eq(churches.id, id)).limit(1);
    return result[0];
  }

  async getChurchesByCreatedBy(createdById: number): Promise<Church[]> {
    console.log(`[DB getChurchesByCreatedBy] Getting churches created by user ${createdById}`);
    try {
      const result = await db.select().from(churches).where(eq(churches.createdById, createdById));
      console.log(`[DB getChurchesByCreatedBy] Found ${result.length} churches`);
      
      // Check if inviteCode exists for each church
      result.forEach(church => {
        console.log(`[DB getChurchesByCreatedBy] Church ${church.id} (${church.name}) has inviteCode: ${church.inviteCode || 'undefined'}`);
      });
      
      return result;
    } catch (error) {
      console.error("[DB getChurchesByCreatedBy] Error:", error);
      throw error;
    }
  }
  
  async getAllChurches(): Promise<Church[]> {
    console.log(`[DB getAllChurches] Getting all churches`);
    try {
      const result = await db.select().from(churches);
      console.log(`[DB getAllChurches] Found ${result.length} churches`);
      return result;
    } catch (error) {
      console.error("[DB getAllChurches] Error:", error);
      return [];
    }
  }

  async createChurch(insertChurch: InsertChurch): Promise<Church> {
    const result = await db.insert(churches).values(insertChurch).returning();
    return result[0];
  }

  async updateChurch(id: number, updateData: Partial<InsertChurch>): Promise<Church | undefined> {
    const result = await db.update(churches)
      .set(updateData)
      .where(eq(churches.id, id))
      .returning();
    return result[0];
  }

  async deleteChurch(id: number): Promise<boolean> {
    const result = await db.delete(churches).where(eq(churches.id, id)).returning();
    return result.length > 0;
  }

  async getTeamsByChurchId(churchId: number): Promise<Team[]> {
    console.log(`[DB getTeamsByChurchId] Getting teams for church ID: ${churchId}`);
    try {
      // First check if the church exists
      const church = await this.getChurch(churchId);
      if (!church) {
        console.log(`[DB getTeamsByChurchId] Church with ID ${churchId} does not exist`);
        return [];
      }
      
      console.log(`[DB getTeamsByChurchId] Church exists, fetching teams with churchId: ${churchId}`);
      
      // Try with drizzle ORM first
      try {
        console.log(`[DB getTeamsByChurchId] Attempting to query with ORM where churchId = ${churchId}`);
        const result = await db.select().from(teams).where(eq(teams.churchId, churchId));
        console.log(`[DB getTeamsByChurchId] ORM query returned ${result.length} teams`);
        return result;
      } catch (ormError) {
        console.log(`[DB getTeamsByChurchId] ORM query failed, falling back to raw SQL:`, ormError);
        
        // Fallback to raw SQL if ORM fails
        const sqlQuery = `
          SELECT 
            id, name, created_by_id as "createdById", 
            plan, invite_code as "inviteCode", church_id as "churchId"
          FROM teams
          WHERE church_id = $1
        `;
        
        console.log(`[DB getTeamsByChurchId] Executing SQL: ${sqlQuery} with param ${churchId}`);
        const { rows } = await pool.query(sqlQuery, [churchId]);
        
        // Transform the rows into Team objects
        console.log(`[DB getTeamsByChurchId] Found ${rows.length} teams for church ${churchId}:`, rows);
        return rows.map(row => ({
          id: row.id,
          name: row.name,
          createdById: row.createdById, 
          plan: row.plan,
          inviteCode: row.inviteCode,
          churchId: row.churchId
        }));
      }
    } catch (error) {
      // If the error is related to a missing column, return an empty array
      console.error("[DB getTeamsByChurchId] Error:", error);
      return [];
    }
  }

  async getChurchRoleScores(churchId: number): Promise<RoleScore[]> {
    console.log(`[DB getChurchRoleScores] Getting role scores for church ID: ${churchId}`);
    
    // Get all teams in the church
    const churchTeams = await this.getTeamsByChurchId(churchId);
    
    if (churchTeams.length === 0) {
      console.log(`[DB getChurchRoleScores] No teams found for church ${churchId}, returning empty array`);
      return [];
    }
    
    // Collect all users from all teams
    const allUsers: User[] = [];
    for (const team of churchTeams) {
      console.log(`[DB getChurchRoleScores] Getting users for team ${team.id} in church ${churchId}`);
      const teamUsers = await this.getUsersInTeam(team.id);
      console.log(`[DB getChurchRoleScores] Found ${teamUsers.length} users in team ${team.id}`);
      allUsers.push(...teamUsers);
    }
    
    const userIds = Array.from(new Set(allUsers.map(user => user.id))); // Remove duplicates
    console.log(`[DB getChurchRoleScores] Found ${userIds.length} unique users in church ${churchId}`);
    
    if (userIds.length === 0) {
      console.log(`[DB getChurchRoleScores] No users found in church ${churchId}, returning empty array`);
      return [];
    }
    
    // Then get role scores for those users
    console.log(`[DB getChurchRoleScores] Fetching role scores for ${userIds.length} users`);
    const result = await db.select().from(roleScores).where(
      inArray(roleScores.userId, userIds)
    );
    console.log(`[DB getChurchRoleScores] Found ${result.length} role scores for church ${churchId}`);
    return result;
  }

  async getUsersInChurch(churchId: number): Promise<User[]> {
    console.log(`[DB getUsersInChurch] Getting users for church ID: ${churchId}`);
    // Get all teams in the church
    const churchTeams = await this.getTeamsByChurchId(churchId);
    console.log(`[DB getUsersInChurch] Found ${churchTeams.length} teams for church ${churchId}`);
    
    if (churchTeams.length === 0) {
      console.log(`[DB getUsersInChurch] No teams found for church ${churchId}, returning empty array`);
      return [];
    }
    
    const allUsers: User[] = [];
    
    for (const team of churchTeams) {
      console.log(`[DB getUsersInChurch] Getting users for team ${team.id} (${team.name})`);
      const teamUsers = await this.getUsersInTeam(team.id);
      console.log(`[DB getUsersInChurch] Found ${teamUsers.length} users in team ${team.id}`);
      allUsers.push(...teamUsers);
    }
    
    console.log(`[DB getUsersInChurch] Found total of ${allUsers.length} users (before deduplication)`);
    
    // Remove duplicates by user id
    const uniqueUserIds = new Set<number>();
    const uniqueUsers = allUsers.filter(user => {
      if (uniqueUserIds.has(user.id)) {
        return false;
      }
      uniqueUserIds.add(user.id);
      return true;
    });
    
    console.log(`[DB getUsersInChurch] Returning ${uniqueUsers.length} unique users for church ${churchId}`);
    return uniqueUsers;
  }

  // Additional methods
  // Team membership methods
  async getTeamsForUser(userId: number): Promise<Team[]> {
    console.log(`[DB getTeamsForUser] Getting teams for user ID: ${userId}`);
    try {
      // First get all team memberships for this user
      const query = `
        SELECT team_id FROM team_members 
        WHERE user_id = $1
      `;
      
      const { rows } = await pool.query(query, [userId]);
      
      if (rows.length === 0) {
        console.log(`[DB getTeamsForUser] No team memberships found for user ${userId}`);
        
        // Fall back to the old teamId field on the user table for backward compatibility
        const user = await this.getUser(userId);
        if (user && user.teamId) {
          console.log(`[DB getTeamsForUser] User has legacy teamId: ${user.teamId}`);
          const team = await this.getTeam(user.teamId);
          return team ? [team] : [];
        }
        
        return [];
      }
      
      console.log(`[DB getTeamsForUser] Found ${rows.length} team memberships for user ${userId}`);
      
      // Get all teams for these team IDs
      const teamIds = rows.map(row => row.team_id);
      const teams = await Promise.all(teamIds.map(id => this.getTeam(id)));
      
      // Filter out any undefined teams
      return teams.filter(team => team !== undefined) as Team[];
    } catch (error) {
      console.error(`[DB getTeamsForUser] Error:`, error);
      return [];
    }
  }
  
  async addUserToTeam(userId: number, teamId: number): Promise<TeamMember> {
    console.log(`[DB addUserToTeam] Adding user ${userId} to team ${teamId}`);
    
    // Check if the user is already in the team
    const isInTeam = await this.isUserInTeam(userId, teamId);
    if (isInTeam) {
      console.log(`[DB addUserToTeam] User ${userId} is already in team ${teamId}`);
      
      // Return the existing membership
      const existingMembership = await db.select()
        .from(teamMembers)
        .where(and(
          eq(teamMembers.userId, userId),
          eq(teamMembers.teamId, teamId)
        ))
        .limit(1);
        
      return existingMembership[0];
    }
    
    // Create new team membership
    const newMembership: InsertTeamMember = {
      userId,
      teamId,
      joinedAt: new Date().toISOString()
    };
    
    const result = await db.insert(teamMembers).values(newMembership).returning();
    return result[0];
  }
  
  async removeUserFromTeam(userId: number, teamId: number): Promise<boolean> {
    console.log(`[DB removeUserFromTeam] Removing user ${userId} from team ${teamId}`);
    
    const result = await db.delete(teamMembers)
      .where(and(
        eq(teamMembers.userId, userId),
        eq(teamMembers.teamId, teamId)
      ))
      .returning();
      
    return result.length > 0;
  }
  
  async isUserInTeam(userId: number, teamId: number): Promise<boolean> {
    console.log(`[DB isUserInTeam] Checking if user ${userId} is in team ${teamId}`);
    
    // First check the team_members table
    const membershipResult = await db.select()
      .from(teamMembers)
      .where(and(
        eq(teamMembers.userId, userId),
        eq(teamMembers.teamId, teamId)
      ))
      .limit(1);
      
    if (membershipResult.length > 0) {
      console.log(`[DB isUserInTeam] User ${userId} is in team ${teamId} (via team_members)`);
      return true;
    }
    
    // If not found in team_members, check the legacy teamId field on the user for backward compatibility
    const user = await this.getUser(userId);
    if (user && user.teamId === teamId) {
      console.log(`[DB isUserInTeam] User ${userId} is in team ${teamId} (via legacy teamId)`);
      return true;
    }
    
    console.log(`[DB isUserInTeam] User ${userId} is NOT in team ${teamId}`);
    return false;
  }
  
  async getUsersInTeam(teamId: number): Promise<User[]> {
    console.log(`[DB getUsersInTeam] Querying users for team ID: ${teamId}`);
    try {
      // First check if team exists
      const team = await this.getTeam(teamId);
      if (!team) {
        console.error(`[DB getUsersInTeam] Team with ID ${teamId} does not exist`);
        return [];
      }
      
      // Log the team details
      console.log(`[DB getUsersInTeam] Team details for ${teamId}:`, 
        { id: team.id, name: team.name, churchId: team.churchId, createdById: team.createdById });
      
      let users: User[] = [];
      
      // Try to get users from the team_members table (preferred approach)
      try {
        // Use transaction to ensure consistency
        await pool.query('BEGIN');
        
        // First, check if the team_members table exists
        const tableCheck = await pool.query(`
          SELECT to_regclass('public.team_members') as table_exists;
        `);
        
        if (tableCheck.rows[0].table_exists) {
          console.log(`[DB getUsersInTeam] team_members table exists, using it for team ${teamId}`);
          
          // Get user IDs from team_members
          const membershipQuery = `
            SELECT user_id FROM team_members 
            WHERE team_id = $1
          `;
          
          console.log(`[DB getUsersInTeam] Querying team_members for team ${teamId}`);
          const { rows: membershipRows } = await pool.query(membershipQuery, [teamId]);
          
          if (membershipRows && membershipRows.length > 0) {
            console.log(`[DB getUsersInTeam] Found ${membershipRows.length} memberships in team_members for team ${teamId}`);
            
            // Get the users for these user IDs
            const userIds = membershipRows.map(row => row.user_id);
            const placeholders = userIds.map((_, i) => `$${i + 1}`).join(',');
            
            const usersQuery = `
              SELECT * FROM users 
              WHERE id IN (${placeholders})
            `;
            
            const { rows: userRows } = await pool.query(usersQuery, userIds);
            console.log(`[DB getUsersInTeam] Found ${userRows.length} users for team ${teamId} via team_members`);
            
            // Convert rows to User objects
            users = userRows.map(row => ({
              id: row.id,
              email: row.email,
              password: row.password,
              username: row.username,
              firstName: row.first_name,
              lastName: row.last_name,
              name: row.name,
              birthDate: row.birth_date,
              country: row.country,
              city: row.city,
              profileImageUrl: row.profile_image_url,
              churchId: row.church_id,
              currentSector: row.current_sector,
              preferredSector: row.preferred_sector,
              referralSource: row.referral_source,
              role: row.role,
              teamId: row.team_id,
              createdAt: row.created_at
            }));
            
            // Check if any legacy team members need to be migrated
            if (users.length === 0) {
              await this.migrateTeamMembers(teamId);
              
              // Try again after migration
              const { rows: afterMigrationRows } = await pool.query(membershipQuery, [teamId]);
              
              if (afterMigrationRows && afterMigrationRows.length > 0) {
                console.log(`[DB getUsersInTeam] After migration, found ${afterMigrationRows.length} memberships for team ${teamId}`);
                
                // Get the users again
                const migrationUserIds = afterMigrationRows.map(row => row.user_id);
                const migrationPlaceholders = migrationUserIds.map((_, i) => `$${i + 1}`).join(',');
                
                const migrationUsersQuery = `
                  SELECT * FROM users 
                  WHERE id IN (${migrationPlaceholders})
                `;
                
                const { rows: migrationUserRows } = await pool.query(migrationUsersQuery, migrationUserIds);
                console.log(`[DB getUsersInTeam] After migration, found ${migrationUserRows.length} users for team ${teamId}`);
                
                // Convert rows to User objects
                users = migrationUserRows.map(row => ({
                  id: row.id,
                  email: row.email,
                  password: row.password,
                  username: row.username,
                  firstName: row.first_name,
                  lastName: row.last_name,
                  name: row.name,
                  birthDate: row.birth_date,
                  country: row.country,
                  city: row.city,
                  profileImageUrl: row.profile_image_url,
                  churchId: row.church_id,
                  currentSector: row.current_sector,
                  preferredSector: row.preferred_sector,
                  referralSource: row.referral_source,
                  role: row.role,
                  teamId: row.team_id,
                  createdAt: row.created_at
                }));
              }
            }
          } else {
            console.log(`[DB getUsersInTeam] No memberships found in team_members for team ${teamId}`);
            
            // Try to migrate legacy team members
            await this.migrateTeamMembers(teamId);
            
            // Check again for team members after migration
            const { rows: checkRows } = await pool.query(membershipQuery, [teamId]);
            
            if (checkRows && checkRows.length > 0) {
              console.log(`[DB getUsersInTeam] After migration, found ${checkRows.length} memberships for team ${teamId}`);
              
              // Get the users for these user IDs
              const checkUserIds = checkRows.map(row => row.user_id);
              const checkPlaceholders = checkUserIds.map((_, i) => `$${i + 1}`).join(',');
              
              const checkUsersQuery = `
                SELECT * FROM users 
                WHERE id IN (${checkPlaceholders})
              `;
              
              const { rows: checkUserRows } = await pool.query(checkUsersQuery, checkUserIds);
              console.log(`[DB getUsersInTeam] Found ${checkUserRows.length} users for team ${teamId} after migration`);
              
              // Convert rows to User objects
              users = checkUserRows.map(row => ({
                id: row.id,
                email: row.email,
                password: row.password,
                username: row.username,
                firstName: row.first_name,
                lastName: row.last_name,
                name: row.name,
                birthDate: row.birth_date,
                country: row.country,
                city: row.city,
                profileImageUrl: row.profile_image_url,
                churchId: row.church_id,
                currentSector: row.current_sector,
                preferredSector: row.preferred_sector,
                referralSource: row.referral_source,
                role: row.role,
                teamId: row.team_id,
                createdAt: row.created_at
              }));
            }
          }
        } else {
          console.log(`[DB getUsersInTeam] team_members table doesn't exist yet, running migration for team ${teamId}`);
          
          // Create team_members table since it doesn't exist
          await pool.query(`
            CREATE TABLE IF NOT EXISTS team_members (
              user_id INTEGER NOT NULL,
              team_id INTEGER NOT NULL,
              joined_at TEXT NOT NULL DEFAULT NOW(),
              PRIMARY KEY (user_id, team_id)
            );
            
            CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members (user_id);
            CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members (team_id);
          `);
          
          console.log(`[DB getUsersInTeam] Created team_members table`);
          
          // Migrate existing team memberships
          await this.migrateTeamMembers(teamId);
        }
        
        await pool.query('COMMIT');
      } catch (membershipError) {
        await pool.query('ROLLBACK');
        console.error(`[DB getUsersInTeam] Error with team_members approach:`, membershipError);
      }
      
      // Fall back to legacy approach if we didn't find any users via team_members
      if (users.length === 0) {
        console.log(`[DB getUsersInTeam] No members found via team_members, trying legacy approach for team ${teamId}`);
        
        // Use direct SQL query to get better logging
        const query = `
          SELECT * FROM users 
          WHERE team_id = $1
        `;
        
        console.log(`[DB getUsersInTeam] Executing legacy SQL query for team ${teamId}`);
        const { rows } = await pool.query(query, [teamId]);
        
        // Log all found users with their IDs to diagnose the issue
        console.log(`[DB getUsersInTeam] Found ${rows.length} users for team ${teamId} via legacy approach`);
        if (rows.length > 0) {
          console.log('[DB getUsersInTeam] User IDs found:', rows.map(r => `ID: ${r.id}, Email: ${r.email}`));
          
          // Sync team members to the team_members table
          for (const row of rows) {
            try {
              await pool.query(`
                INSERT INTO team_members (user_id, team_id, joined_at)
                VALUES ($1, $2, $3)
                ON CONFLICT (user_id, team_id) DO NOTHING
              `, [row.id, teamId, new Date().toISOString()]);
            } catch (insertError) {
              console.error(`[DB getUsersInTeam] Error syncing user ${row.id} to team_members:`, insertError);
            }
          }
          
          // Check if these users have role scores
          for (const row of rows) {
            try {
              const roleScore = await this.getRoleScoreByUserId(row.id);
              console.log(`[DB getUsersInTeam] Role score for user ${row.id}: ${roleScore ? 'Found' : 'Not found'}`);
            } catch (e) {
              console.error(`[DB getUsersInTeam] Error getting role score for user ${row.id}:`, e);
            }
          }
        }
        
        // Convert rows to User objects
        users = rows.map(row => ({
          id: row.id,
          email: row.email,
          password: row.password,
          username: row.username,
          firstName: row.first_name,
          lastName: row.last_name,
          name: row.name,
          birthDate: row.birth_date,
          country: row.country,
          city: row.city,
          profileImageUrl: row.profile_image_url,
          churchId: row.church_id,
          currentSector: row.current_sector,
          preferredSector: row.preferred_sector,
          referralSource: row.referral_source,
          role: row.role,
          teamId: row.team_id,
          createdAt: row.created_at
        }));
      }
      
      return users;
    } catch (error) {
      console.error(`[DB getUsersInTeam] Error querying users for team ${teamId}:`, error);
      
      // Last-resort fallback to the ORM approach
      try {
        const result = await db.select().from(users).where(eq(users.teamId, teamId));
        console.log(`[DB getUsersInTeam] Fallback method found ${result.length} users for team ${teamId}`);
        return result;
      } catch (fallbackError) {
        console.error(`[DB getUsersInTeam] Even fallback query failed:`, fallbackError);
        throw error; // Throw the original error
      }
    }
  }
  
  // Helper method to migrate existing team memberships to the team_members table
  private async migrateTeamMembers(teamId: number): Promise<void> {
    try {
      console.log(`[DB migrateTeamMembers] Migrating existing team members for team ${teamId}`);
      
      // Find all users with this teamId in the users table
      const query = `
        SELECT id, team_id FROM users 
        WHERE team_id = $1
      `;
      
      const { rows } = await pool.query(query, [teamId]);
      console.log(`[DB migrateTeamMembers] Found ${rows.length} users with teamId ${teamId}`);
      
      // Insert these users into the team_members table
      for (const row of rows) {
        try {
          await pool.query(`
            INSERT INTO team_members (user_id, team_id, joined_at)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, team_id) DO NOTHING
          `, [row.id, teamId, new Date().toISOString()]);
        } catch (insertError) {
          console.error(`[DB migrateTeamMembers] Error adding user ${row.id} to team_members:`, insertError);
        }
      }
      
      console.log(`[DB migrateTeamMembers] Completed migration for team ${teamId}`);
    } catch (error) {
      console.error(`[DB migrateTeamMembers] Error migrating team ${teamId}:`, error);
      throw error;
    }
  }

  async getTeamByInviteCode(inviteCode: string): Promise<Team | undefined> {
    try {
      console.log(`[DB getTeamByInviteCode] Looking for team with exact invite code: ${inviteCode}`);
      
      // First try an exact match
      const result = await db.select({
        id: teams.id,
        name: teams.name,
        createdById: teams.createdById,
        plan: teams.plan,
        inviteCode: teams.inviteCode,
        churchId: teams.churchId
      }).from(teams).where(eq(teams.inviteCode, inviteCode)).limit(1);
      
      if (result.length > 0) {
        console.log(`[DB getTeamByInviteCode] Found team with exact invite code: ${inviteCode}`);
        return result[0];
      }
      
      // If no exact match, try a case-insensitive match directly with SQL
      console.log(`[DB getTeamByInviteCode] No exact match, trying case-insensitive search for: ${inviteCode}`);
      
      // Use raw SQL for the ILIKE operator as drizzle doesn't have a direct equivalent
      const fuzzyQuery = `
        SELECT id, name, created_by_id as "createdById", plan, invite_code as "inviteCode", church_id as "churchId" 
        FROM teams 
        WHERE invite_code ILIKE $1 
        LIMIT 1
      `;
      
      const { rows } = await pool.query(fuzzyQuery, [inviteCode]);
      
      if (rows.length > 0) {
        console.log(`[DB getTeamByInviteCode] Found team with fuzzy matching: ${rows[0].inviteCode}`);
        return rows[0] as Team;
      }
      
      // If still no match, try a more aggressive approach - look for invite codes 
      // that are only 1-2 characters different (common typos)
      console.log(`[DB getTeamByInviteCode] No fuzzy match, trying to find similar codes`);
      
      // Get all invite codes
      const allCodesQuery = `SELECT id, name, invite_code FROM teams`;
      const { rows: allCodes } = await pool.query(allCodesQuery);
      
      // Log all invite codes for debugging
      console.log(`[DB getTeamByInviteCode] All invite codes:`, 
        allCodes.map(row => `${row.id}: ${row.name} - ${row.invite_code}`));
      
      // Look for the most similar code
      let mostSimilarCode = null;
      let highestSimilarity = 0;
      
      for (const row of allCodes) {
        const code = row.invite_code;
        let similarity = 0;
        let bonusPoints = 0;
        
        // Count exact matching characters in same position (strongest signal)
        for (let i = 0; i < Math.min(inviteCode.length, code.length); i++) {
          if (inviteCode[i].toLowerCase() === code[i].toLowerCase()) {
            similarity += 2; // Double weight for exact position matches
          }
        }
        
        // Check for character existence regardless of position (weaker signal)
        const inputChars = inviteCode.toLowerCase().split('');
        const codeChars = code.toLowerCase().split('');
        
        for (const char of inputChars) {
          if (codeChars.includes(char)) {
            bonusPoints += 0.5; // Half point for character existing anywhere
            
            // Remove the character so we don't count it twice
            const index = codeChars.indexOf(char);
            if (index > -1) {
              codeChars.splice(index, 1);
            }
          }
        }
        
        // If lengths are the same, give extra bonus
        if (inviteCode.length === code.length) {
          bonusPoints += 1;
        }
        
        // Calculate similarity percentage based on the longer string plus bonus points
        const totalPossibleScore = Math.max(inviteCode.length, code.length) * 2; // *2 because exact matches are worth 2
        const similarityScore = (similarity + bonusPoints) / totalPossibleScore;
        
        if (similarityScore > highestSimilarity && similarityScore > 0.90) { // At least 90% similar
          highestSimilarity = similarityScore;
          mostSimilarCode = row;
        }
      }
      
      if (mostSimilarCode) {
        console.log(`[DB getTeamByInviteCode] Found similar invite code: ${mostSimilarCode.invite_code} (${Math.round(highestSimilarity * 100)}% similar)`);
        
        return {
          id: mostSimilarCode.id,
          name: mostSimilarCode.name,
          inviteCode: mostSimilarCode.invite_code,
          // These will be filled in with defaults as they're missing from our query
          createdById: 0,
          plan: "",
          churchId: null
        };
      }
      
      console.log(`[DB getTeamByInviteCode] No team found with invite code similar to: ${inviteCode}`);
      return undefined;
    } catch (error) {
      console.error("Error in getTeamByInviteCode:", error);
      return undefined;
    }
  }

  async joinTeam(userId: number, teamId: number): Promise<User | undefined> {
    console.log(`[DB joinTeam] User ${userId} joining team ${teamId}`);
    try {
      // First make sure the team exists
      const team = await this.getTeam(teamId);
      if (!team) {
        console.error(`[DB joinTeam] Team ${teamId} does not exist`);
        return undefined;
      }

      // Verify the user exists
      const user = await this.getUser(userId);
      if (!user) {
        console.error(`[DB joinTeam] User ${userId} does not exist`);
        return undefined;
      }
      
      // Check if the team has a church association
      console.log(`[DB joinTeam] Team ${teamId} has churchId: ${team.churchId || 'none'}`);
      
      // If the team belongs to a church, make sure the user gets the church association too
      let churchId = null;
      if (team.churchId) {
        churchId = team.churchId;
        console.log(`[DB joinTeam] Will also associate user ${userId} with church ${churchId}`);
      }
      
      // Check if user is already a member of the team (to avoid duplicate entries)
      const checkMembershipQuery = `
        SELECT * FROM team_members 
        WHERE user_id = $1 AND team_id = $2
      `;
      
      const { rows: existingMembership } = await pool.query(checkMembershipQuery, [userId, teamId]);
      
      if (existingMembership.length > 0) {
        console.log(`[DB joinTeam] User ${userId} is already a member of team ${teamId}`);
        
        // Update the user's church association if needed, but we don't need to add team_members record
        if (churchId && (!user.churchId || user.churchId !== churchId)) {
          console.log(`[DB joinTeam] Updating user ${userId} with churchId ${churchId}`);
          
          const updateChurchQuery = `
            UPDATE users 
            SET church_id = $1 
            WHERE id = $2 
            RETURNING *
          `;
          
          const { rows } = await pool.query(updateChurchQuery, [churchId, userId]);
          
          if (rows.length === 0) {
            console.error(`[DB joinTeam] Failed to update user ${userId} church - no rows returned`);
            return user; // Return original user since they're still in the team
          }
          
          // Convert snake_case to camelCase
          const updatedUser: User = {
            id: rows[0].id,
            email: rows[0].email,
            password: rows[0].password,
            username: rows[0].username,
            firstName: rows[0].first_name,
            lastName: rows[0].last_name,
            name: rows[0].name,
            birthDate: rows[0].birth_date,
            country: rows[0].country,
            city: rows[0].city,
            profileImageUrl: rows[0].profile_image_url,
            currentSector: rows[0].current_sector,
            preferredSector: rows[0].preferred_sector,
            referralSource: rows[0].referral_source,
            role: rows[0].role,
            teamId: rows[0].team_id,
            churchId: rows[0].church_id,
            createdAt: rows[0].created_at
          };
          
          return updatedUser;
        }
        
        return user; // User is already a member, just return the current user
      }
      
      // Insert into team_members table (new approach)
      try {
        // Begin transaction
        await pool.query('BEGIN');
        
        // 1. Insert into team_members table
        const insertMembershipQuery = `
          INSERT INTO team_members (user_id, team_id, joined_at)
          VALUES ($1, $2, $3)
        `;
        
        await pool.query(insertMembershipQuery, [
          userId, 
          teamId, 
          new Date().toISOString()
        ]);
        
        console.log(`[DB joinTeam] Added user ${userId} to team_members for team ${teamId}`);
        
        // 2. Update user's churchId if needed
        let updatedUser = user;
        
        if (churchId && (!user.churchId || user.churchId !== churchId)) {
          console.log(`[DB joinTeam] Updating user ${userId} with churchId ${churchId}`);
          
          const updateChurchQuery = `
            UPDATE users 
            SET church_id = $1 
            WHERE id = $2 
            RETURNING *
          `;
          
          const { rows } = await pool.query(updateChurchQuery, [churchId, userId]);
          
          if (rows.length === 0) {
            // Rollback if update fails
            await pool.query('ROLLBACK');
            console.error(`[DB joinTeam] Failed to update user ${userId} church - no rows returned`);
            return undefined;
          }
          
          // Convert snake_case to camelCase
          updatedUser = {
            id: rows[0].id,
            email: rows[0].email,
            password: rows[0].password,
            username: rows[0].username,
            firstName: rows[0].first_name,
            lastName: rows[0].last_name,
            name: rows[0].name,
            birthDate: rows[0].birth_date,
            country: rows[0].country,
            city: rows[0].city,
            profileImageUrl: rows[0].profile_image_url,
            currentSector: rows[0].current_sector,
            preferredSector: rows[0].preferred_sector,
            referralSource: rows[0].referral_source,
            role: rows[0].role,
            teamId: rows[0].team_id,
            churchId: rows[0].church_id,
            createdAt: rows[0].created_at
          };
        }
        
        // Commit transaction
        await pool.query('COMMIT');
        
        console.log(`[DB joinTeam] Successfully added user ${userId} to team ${teamId}`);
        if (churchId) {
          console.log(`[DB joinTeam] Also associated user ${userId} with church ${churchId}`);
        }
        
        return updatedUser;
      } catch (dbError) {
        // Rollback transaction on error
        await pool.query('ROLLBACK');
        console.error(`[DB joinTeam] Database error while adding team member:`, dbError);
        
        // For backward compatibility, try the legacy approach (updating user.teamId)
        console.log(`[DB joinTeam] Falling back to legacy approach (updating user.teamId)`);
        
        const updateData: Partial<InsertUser> = { teamId };
        
        // Also include churchId in the update if available
        if (churchId) {
          updateData.churchId = churchId;
        }
        
        const updatedUser = await this.updateUser(userId, updateData);
        
        if (updatedUser) {
          console.log(`[DB joinTeam] Successfully updated user ${userId} with teamId ${teamId} (fallback method)`);
          if (churchId) {
            console.log(`[DB joinTeam] Also associated user ${userId} with church ${churchId} (fallback method)`);
          }
        } else {
          console.error(`[DB joinTeam] Failed to update user ${userId} (fallback method)`);
        }
        
        return updatedUser;
      }
    } catch (error) {
      console.error(`[DB joinTeam] Error joining team:`, error);
      throw error;
    }
  }

  generateInviteCode(): string {
    return nanoid(10); // Generate a 10-character unique code
  }

  async joinChurch(userId: number, churchId: number): Promise<User | undefined> {
    console.log(`[DB joinChurch] User ${userId} joining church ${churchId}`);
    try {
      const church = await this.getChurch(churchId);
      if (!church) {
        console.error(`[DB joinChurch] Church ${churchId} does not exist`);
        return undefined;
      }

      const user = await this.getUser(userId);
      if (!user) {
        console.error(`[DB joinChurch] User ${userId} does not exist`);
        return undefined;
      }

      const updatedUser = await this.updateUser(userId, { churchId });
      
      if (updatedUser) {
        console.log(`[DB joinChurch] Successfully updated user ${userId} with churchId ${churchId}`);
      } else {
        console.error(`[DB joinChurch] Failed to update user ${userId}`);
      }
      
      return updatedUser;
    } catch (error) {
      console.error(`[DB joinChurch] Error joining church:`, error);
      throw error;
    }
  }

  async getChurchByInviteCode(inviteCode: string): Promise<Church | undefined> {
    console.log(`[DB getChurchByInviteCode] Looking up church with invite code: ${inviteCode}`);
    
    try {
      const result = await db.select().from(churches).where(eq(churches.inviteCode, inviteCode)).limit(1);
      
      if (result.length > 0) {
        console.log(`[DB getChurchByInviteCode] Found church with ID ${result[0].id}`);
        return result[0];
      } else {
        console.log(`[DB getChurchByInviteCode] No church found with invite code: ${inviteCode}`);
        return undefined;
      }
    } catch (error) {
      console.error(`[DB getChurchByInviteCode] Error:`, error);
      return undefined;
    }
  }
}

// Fallback to memory storage if no database url is provided
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private teams: Map<number, Team>;
  private churches: Map<number, Church>;
  private roleScores: Map<number, RoleScore>;
  private teamMembers: Map<string, TeamMember>; // Use composite key userId:teamId as the map key
  private userIdCounter: number;
  private teamIdCounter: number;
  private churchIdCounter: number;
  private roleScoreIdCounter: number;
  public sessionStore: session.Store;
  
  // Method to calculate similarity between two strings
  private calculateSimilarity(a: string, b: string): number {
    if (!a || !b) return 0;
    
    // Same length bonus
    const lengthBonus = a.length === b.length ? 0.1 : 0;
    
    let similarity = 0;
    const maxLength = Math.max(a.length, b.length);
    
    // Scan through strings giving 2 points for exact character matches and 1 point for character existing elsewhere
    for (let i = 0; i < a.length; i++) {
      if (i < b.length && a[i] === b[i]) {
        // Double points for exact position match
        similarity += 2;
      } else if (b.includes(a[i])) {
        // Single point for character existing elsewhere
        similarity += 1;
      }
    }
    
    // Compute final score based on the longer string length
    return similarity / (maxLength * 2) + lengthBonus;
  }

  constructor() {
    this.users = new Map();
    this.teams = new Map();
    this.churches = new Map();
    this.roleScores = new Map();
    this.teamMembers = new Map();
    this.userIdCounter = 1;
    this.teamIdCounter = 1;
    this.churchIdCounter = 1;
    this.roleScoreIdCounter = 1;
    
    // Create memory session store
    const MemoryStore = require('memorystore')(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // If username is not provided, we can't find the user
    if (!username) return undefined;
    
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    
    // Generate a default username from email if not provided
    const username = insertUser.username || null;
    
    // Create user object without using spread to avoid type issues
    const user: User = { 
      id,
      username,
      password: insertUser.password,
      email: insertUser.email,
      role: insertUser.role || "user", // Ensure role is always defined
      teamId: insertUser.teamId || null, // Ensure teamId is always defined or null
      firstName: insertUser.firstName,
      lastName: insertUser.lastName,
      name: insertUser.name,
      birthDate: insertUser.birthDate || null,
      country: insertUser.country || null,
      city: insertUser.city || null,
      currentSector: insertUser.currentSector || null,
      preferredSector: insertUser.preferredSector || null,
      referralSource: insertUser.referralSource || null,
      profileImageUrl: insertUser.profileImageUrl || null,
      churchId: insertUser.churchId || null,
      createdAt: insertUser.createdAt || new Date().toISOString()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updateData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Team methods
  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async getTeamsByCreatedBy(createdById: number): Promise<Team[]> {
    return Array.from(this.teams.values()).filter(
      (team) => team.createdById === createdById,
    );
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = this.teamIdCounter++;
    const team: Team = { 
      ...insertTeam, 
      id,
      name: insertTeam.name,
      createdById: insertTeam.createdById,
      plan: insertTeam.plan || "free", // Ensure plan is always defined
      inviteCode: insertTeam.inviteCode,
      churchId: insertTeam.churchId || null
    };
    this.teams.set(id, team);
    return team;
  }

  async updateTeam(id: number, updateData: Partial<InsertTeam>): Promise<Team | undefined> {
    const team = this.teams.get(id);
    if (!team) return undefined;
    
    const updatedTeam = { ...team, ...updateData };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }

  async deleteTeam(id: number): Promise<boolean> {
    return this.teams.delete(id);
  }
  
  // Church methods
  async getChurch(id: number): Promise<Church | undefined> {
    return this.churches.get(id);
  }

  async getChurchesByCreatedBy(createdById: number): Promise<Church[]> {
    return Array.from(this.churches.values()).filter(
      (church) => church.createdById === createdById,
    );
  }
  
  async getAllChurches(): Promise<Church[]> {
    console.log(`[MemDB getAllChurches] Getting all churches from memory storage`);
    return Array.from(this.churches.values());
  }

  async createChurch(insertChurch: InsertChurch): Promise<Church> {
    const id = this.churchIdCounter++;
    const church: Church = { 
      ...insertChurch, 
      id,
      name: insertChurch.name,
      denomination: insertChurch.denomination,
      location: insertChurch.location,
      createdById: insertChurch.createdById,
      logoUrl: insertChurch.logoUrl || null,
      inviteCode: insertChurch.inviteCode || this.generateInviteCode(),
      createdAt: insertChurch.createdAt || new Date().toISOString()
    };
    this.churches.set(id, church);
    return church;
  }

  async updateChurch(id: number, updateData: Partial<InsertChurch>): Promise<Church | undefined> {
    const church = this.churches.get(id);
    if (!church) return undefined;
    
    const updatedChurch = { ...church, ...updateData };
    this.churches.set(id, updatedChurch);
    return updatedChurch;
  }

  async deleteChurch(id: number): Promise<boolean> {
    return this.churches.delete(id);
  }

  async getTeamsByChurchId(churchId: number): Promise<Team[]> {
    return Array.from(this.teams.values()).filter(
      (team) => team.churchId === churchId,
    );
  }

  async getChurchRoleScores(churchId: number): Promise<RoleScore[]> {
    // Get all teams in the church
    const churchTeams = await this.getTeamsByChurchId(churchId);
    
    if (churchTeams.length === 0) {
      return [];
    }
    
    // Collect all users from all teams
    const allUsers: User[] = [];
    for (const team of churchTeams) {
      const teamUsers = await this.getUsersInTeam(team.id);
      allUsers.push(...teamUsers);
    }
    
    const userIds = Array.from(new Set(allUsers.map(user => user.id))); // Remove duplicates
    
    if (userIds.length === 0) {
      return [];
    }
    
    // Then get role scores for those users
    return Array.from(this.roleScores.values()).filter(
      (score) => userIds.includes(score.userId)
    );
  }
  
  async getRoleScore(id: number): Promise<RoleScore | undefined> {
    return this.roleScores.get(id);
  }
  
  async getRoleScoreByUserId(userId: number): Promise<RoleScore | undefined> {
    return Array.from(this.roleScores.values()).find(
      (score) => score.userId === userId
    );
  }
  
  async getTeamRoleScores(teamId: number): Promise<RoleScore[]> {
    // Get all users in the team
    const teamUsers = await this.getUsersInTeam(teamId);
    
    if (teamUsers.length === 0) {
      return [];
    }
    
    const userIds = teamUsers.map(user => user.id);
    
    // Get role scores for those users
    return Array.from(this.roleScores.values()).filter(
      (score) => userIds.includes(score.userId)
    );
  }
  
  async createRoleScore(insertRoleScore: InsertRoleScore): Promise<RoleScore> {
    const id = this.roleScoreIdCounter++;
    const roleScore: RoleScore = { ...insertRoleScore, id };
    this.roleScores.set(id, roleScore);
    return roleScore;
  }
  
  async updateRoleScore(id: number, updateData: Partial<InsertRoleScore>): Promise<RoleScore | undefined> {
    const roleScore = this.roleScores.get(id);
    if (!roleScore) return undefined;
    
    const updatedRoleScore = { ...roleScore, ...updateData };
    this.roleScores.set(id, updatedRoleScore);
    return updatedRoleScore;
  }
  
  async deleteRoleScore(id: number): Promise<boolean> {
    return this.roleScores.delete(id);
  }

  async getUsersInChurch(churchId: number): Promise<User[]> {
    // Get all teams in the church
    const churchTeams = await this.getTeamsByChurchId(churchId);
    
    if (churchTeams.length === 0) {
      return [];
    }
    
    // Collect all users from all teams
    const allUsers: User[] = [];
    for (const team of churchTeams) {
      const teamUsers = await this.getUsersInTeam(team.id);
      allUsers.push(...teamUsers);
    }
    
    // Remove duplicates by user id
    const uniqueUserIds = new Set<number>();
    return allUsers.filter(user => {
      if (uniqueUserIds.has(user.id)) {
        return false;
      }
      uniqueUserIds.add(user.id);
      return true;
    });
  }

  // Team membership methods
  async getTeamsForUser(userId: number): Promise<Team[]> {
    console.log(`[MEM getTeamsForUser] Getting teams for user ID: ${userId}`);
    try {
      // Get membership keys that start with this userId
      const membershipKeys = Array.from(this.teamMembers.keys()).filter(
        key => key.startsWith(`${userId}:`)
      );
      
      if (membershipKeys.length === 0) {
        console.log(`[MEM getTeamsForUser] No team memberships found for user ${userId}`);
        
        // Check for legacy teamId on user
        const user = await this.getUser(userId);
        if (user && user.teamId) {
          console.log(`[MEM getTeamsForUser] User has legacy teamId: ${user.teamId}`);
          const team = await this.getTeam(user.teamId);
          return team ? [team] : [];
        }
        
        return [];
      }
      
      // Extract teamIds from the keys (format is "userId:teamId")
      const teamIds = membershipKeys.map(key => {
        const parts = key.split(':');
        return parseInt(parts[1]);
      });
      
      console.log(`[MEM getTeamsForUser] Found ${teamIds.length} team memberships for user ${userId}`);
      
      // Get the team objects
      const teams = teamIds.map(id => this.teams.get(id)).filter(team => team !== undefined) as Team[];
      return teams;
    } catch (error) {
      console.error(`[MEM getTeamsForUser] Error:`, error);
      return [];
    }
  }
  
  async addUserToTeam(userId: number, teamId: number): Promise<TeamMember> {
    console.log(`[MEM addUserToTeam] Adding user ${userId} to team ${teamId}`);
    
    // Check if the user is already in the team
    const isInTeam = await this.isUserInTeam(userId, teamId);
    if (isInTeam) {
      console.log(`[MEM addUserToTeam] User ${userId} is already in team ${teamId}`);
      
      // Return the existing membership
      const key = `${userId}:${teamId}`;
      const existingMembership = this.teamMembers.get(key);
      
      if (existingMembership) {
        return existingMembership;
      }
      
      // If we determined they're in the team but no membership exists, create one
      // This can happen when a user is in a team via the legacy teamId field
      const newMembership: TeamMember = {
        userId,
        teamId,
        joinedAt: new Date().toISOString()
      };
      
      this.teamMembers.set(key, newMembership);
      return newMembership;
    }
    
    // Create new team membership
    const newMembership: TeamMember = {
      userId,
      teamId,
      joinedAt: new Date().toISOString()
    };
    
    // Store using a composite key format "userId:teamId"
    const key = `${userId}:${teamId}`;
    this.teamMembers.set(key, newMembership);
    
    return newMembership;
  }
  
  async removeUserFromTeam(userId: number, teamId: number): Promise<boolean> {
    console.log(`[MEM removeUserFromTeam] Removing user ${userId} from team ${teamId}`);
    
    const key = `${userId}:${teamId}`;
    const deleted = this.teamMembers.delete(key);
    
    // Also check legacy teamId field and clear it if necessary
    const user = await this.getUser(userId);
    if (user && user.teamId === teamId) {
      await this.updateUser(userId, { teamId: null });
      return true;
    }
    
    return deleted;
  }
  
  async isUserInTeam(userId: number, teamId: number): Promise<boolean> {
    console.log(`[MEM isUserInTeam] Checking if user ${userId} is in team ${teamId}`);
    
    // First check for entry in teamMembers map
    const key = `${userId}:${teamId}`;
    if (this.teamMembers.has(key)) {
      console.log(`[MEM isUserInTeam] User ${userId} is in team ${teamId} (via teamMembers)`);
      return true;
    }
    
    // Then check the legacy teamId field on the user
    const user = await this.getUser(userId);
    if (user && user.teamId === teamId) {
      console.log(`[MEM isUserInTeam] User ${userId} is in team ${teamId} (via legacy teamId)`);
      return true;
    }
    
    console.log(`[MEM isUserInTeam] User ${userId} is NOT in team ${teamId}`);
    return false;
  }
  
  async getUsersInTeam(teamId: number): Promise<User[]> {
    console.log(`[MEM getUsersInTeam] Querying users for team ID: ${teamId}`);
    try {
      // First try to get users from team memberships
      const membershipKeys = Array.from(this.teamMembers.keys()).filter(
        key => key.endsWith(`:${teamId}`)
      );
      
      if (membershipKeys.length > 0) {
        // Extract userIds from the keys (format is "userId:teamId")
        const userIds = membershipKeys.map(key => {
          const parts = key.split(':');
          return parseInt(parts[0]);
        });
        
        console.log(`[MEM getUsersInTeam] Found ${userIds.length} memberships for team ${teamId}`);
        
        // Get the user objects
        const users = userIds.map(id => this.users.get(id)).filter(user => user !== undefined) as User[];
        console.log(`[MEM getUsersInTeam] Found ${users.length} users for team ${teamId} via team memberships`);
        return users;
      }
      
      // If no memberships found, fall back to legacy teamId field
      console.log(`[MEM getUsersInTeam] No memberships found, checking legacy teamId field`);
      const result = Array.from(this.users.values()).filter(
        (user) => user.teamId === teamId,
      );
      console.log(`[MEM getUsersInTeam] Found ${result.length} users for team ${teamId} via legacy teamId`);
      return result;
    } catch (error) {
      console.error(`[MEM getUsersInTeam] Error querying users:`, error);
      throw error;
    }
  }

  async getTeamByInviteCode(inviteCode: string): Promise<Team | undefined> {
    console.log(`[MEM getTeamByInviteCode] Looking for team with invite code: ${inviteCode}`);
    
    // First try an exact match
    const exactMatch = Array.from(this.teams.values()).find(
      (team) => team.inviteCode === inviteCode,
    );
    
    if (exactMatch) {
      console.log(`[MEM getTeamByInviteCode] Found team with exact invite code: ${inviteCode}`);
      return exactMatch;
    }
    
    // Then try case-insensitive
    if (inviteCode) {
      const caseInsensitiveMatch = Array.from(this.teams.values()).find(
        (team) => team.inviteCode && team.inviteCode.toLowerCase() === inviteCode.toLowerCase(),
      );
      
      if (caseInsensitiveMatch) {
        console.log(`[MEM getTeamByInviteCode] Found team with case-insensitive invite code: ${inviteCode}`);
        return caseInsensitiveMatch;
      }
    }
    
    // Try fuzzy matching as a last resort
    console.log(`[MEM getTeamByInviteCode] Trying fuzzy matching for invite code: ${inviteCode}`);
    let highestSimilarity = 0;
    let bestMatch: Team | undefined;
    
    for (const team of this.teams.values()) {
      if (!team.inviteCode) continue;
      
      const similarityScore = this.calculateSimilarity(inviteCode, team.inviteCode);
      if (similarityScore > highestSimilarity && similarityScore > 0.90) { // Using at least 90% similarity
        highestSimilarity = similarityScore;
        bestMatch = team;
      }
    }
    
    if (bestMatch) {
      console.log(`[MEM getTeamByInviteCode] Found similar invite code: ${bestMatch.inviteCode} (${Math.round(highestSimilarity * 100)}% similar)`);
      return bestMatch;
    }
    
    console.log(`[MEM getTeamByInviteCode] No team found with similar invite code: ${inviteCode}`);
    return undefined;
  }

  async joinTeam(userId: number, teamId: number): Promise<User | undefined> {
    console.log(`[MEM joinTeam] User ${userId} joining team ${teamId}`);
    try {
      // First make sure the team exists
      const team = await this.getTeam(teamId);
      if (!team) {
        console.error(`[MEM joinTeam] Team ${teamId} does not exist`);
        return undefined;
      }
      
      // Verify the user exists
      const user = await this.getUser(userId);
      if (!user) {
        console.error(`[MEM joinTeam] User ${userId} does not exist`);
        return undefined;
      }

      // Update the user's teamId
      const updatedUser = await this.updateUser(userId, { teamId });
      
      if (updatedUser) {
        console.log(`[MEM joinTeam] Successfully updated user ${userId} with teamId ${teamId}`);
        
        // Explicitly invalidate any cached data related to this team to force a refresh
        console.log(`[MEM joinTeam] Team membership updated for user ${userId}`);
      } else {
        console.error(`[MEM joinTeam] Failed to update user ${userId}`);
      }
      
      return updatedUser;
    } catch (error) {
      console.error(`[MEM joinTeam] Error joining team:`, error);
      throw error;
    }
  }

  generateInviteCode(): string {
    return nanoid(10); // Generate a 10-character unique code
  }

  async joinChurch(userId: number, churchId: number): Promise<User | undefined> {
    console.log(`[MEM joinChurch] User ${userId} joining church ${churchId}`);
    try {
      // First make sure the church exists
      const church = await this.getChurch(churchId);
      if (!church) {
        console.error(`[MEM joinChurch] Church ${churchId} does not exist`);
        return undefined;
      }

      // Verify the user exists
      const user = await this.getUser(userId);
      if (!user) {
        console.error(`[MEM joinChurch] User ${userId} does not exist`);
        return undefined;
      }

      // Update the user's churchId
      const updatedUser = await this.updateUser(userId, { churchId });
      
      if (updatedUser) {
        console.log(`[MEM joinChurch] Successfully updated user ${userId} with churchId ${churchId}`);
      } else {
        console.error(`[MEM joinChurch] Failed to update user ${userId}`);
      }
      
      return updatedUser;
    } catch (error) {
      console.error(`[MEM joinChurch] Error joining church:`, error);
      throw error;
    }
  }

  async getChurchByInviteCode(inviteCode: string): Promise<Church | undefined> {
    console.log(`[MEM getChurchByInviteCode] Looking up church with invite code: ${inviteCode}`);
    
    try {
      // Loop through all churches to find the one with the matching invite code
      for (const church of this.churches.values()) {
        if (church.inviteCode === inviteCode) {
          console.log(`[MEM getChurchByInviteCode] Found church with ID ${church.id}`);
          return church;
        }
      }
      
      console.log(`[MEM getChurchByInviteCode] No church found with invite code: ${inviteCode}`);
      return undefined;
    } catch (error) {
      console.error(`[MEM getChurchByInviteCode] Error:`, error);
      return undefined;
    }
  }
}

// Use database storage if available, otherwise use memory storage
export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage() 
  : new MemStorage();
