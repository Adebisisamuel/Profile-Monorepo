import { users, teams, roleScores, churches, type User, type InsertUser, type Team, type InsertTeam, type RoleScore, type InsertRoleScore, type Church, type InsertChurch } from "@shared/schema";
import { RoleResults } from "@shared/types";
import { ROLES } from "@shared/constants";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { eq, and, isNotNull, inArray } from "drizzle-orm";
import { db, pool } from "./db";
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

  getUsersInTeam(teamId: number): Promise<User[]>;
  getUsersInChurch(churchId: number): Promise<User[]>;
  joinTeam(userId: number, teamId: number): Promise<User | undefined>;
  
  generateInviteCode(): string;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;
  
  constructor() {
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({
      pool: pool,
      createTableIfMissing: true
    });
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
        inviteCode: teams.inviteCode
      }).from(teams).where(eq(teams.id, id)).limit(1);
      
      if (result.length === 0) {
        return undefined;
      }
      
      // Return the team with churchId set to null
      return {
        ...result[0],
        churchId: null // Add the missing churchId field with null value
      };
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
        inviteCode: teams.inviteCode
      }).from(teams).where(eq(teams.createdById, createdById));
      
      // Return the results with churchId set to null for each team
      return result.map(team => ({
        ...team,
        churchId: null // Add the missing churchId field with null value
      }));
    } catch (error) {
      // If there's still an error, return an empty array
      console.error("Error in getTeamsByCreatedBy:", error);
      return [];
    }
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    try {
      // Create a new team object without churchId to avoid database errors
      const { churchId, ...teamWithoutChurchId } = insertTeam;
      
      // Insert the team without the churchId field
      const result = await db.insert(teams).values(teamWithoutChurchId).returning();
      
      // Add the churchId back to the returned object for type compatibility
      return { ...result[0], churchId: null };
    } catch (error) {
      console.error("Error in createTeam:", error);
      throw error;
    }
  }

  async updateTeam(id: number, updateData: Partial<InsertTeam>): Promise<Team | undefined> {
    try {
      // Remove churchId from the updateData to avoid database errors
      const { churchId, ...updateDataWithoutChurchId } = updateData;
      
      // Update the team without the churchId field
      const result = await db.update(teams)
        .set(updateDataWithoutChurchId)
        .where(eq(teams.id, id))
        .returning();
      
      if (result.length === 0) {
        return undefined;
      }
      
      // Add the churchId back to the returned object for type compatibility
      return { ...result[0], churchId: null };
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
    const result = await db.select().from(roleScores).where(eq(roleScores.userId, userId)).limit(1);
    return result[0];
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
    const result = await db.select().from(churches).where(eq(churches.createdById, createdById));
    return result;
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
    try {
      // Try to manually construct a safe query that references only columns we know exist
      const sqlQuery = `
        SELECT 
          id, name, created_by_id as "createdById", 
          plan, invite_code as "inviteCode"
        FROM teams
        WHERE church_id = $1
      `;
      const { rows } = await pool.query(sqlQuery, [churchId]);
      
      // Transform the rows into Team objects
      return rows.map(row => ({
        id: row.id,
        name: row.name,
        createdById: row.createdById, 
        plan: row.plan,
        inviteCode: row.inviteCode,
        churchId
      }));
    } catch (error) {
      // If the error is related to a missing column, return an empty array
      console.error("Error in getTeamsByChurchId:", error);
      return [];
    }
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
    const result = await db.select().from(roleScores).where(
      inArray(roleScores.userId, userIds)
    );
    return result;
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

  // Additional methods
  async getUsersInTeam(teamId: number): Promise<User[]> {
    const result = await db.select().from(users).where(eq(users.teamId, teamId));
    return result;
  }

  async getTeamByInviteCode(inviteCode: string): Promise<Team | undefined> {
    try {
      // Only select the columns we know exist in the database
      const result = await db.select({
        id: teams.id,
        name: teams.name,
        createdById: teams.createdById,
        plan: teams.plan,
        inviteCode: teams.inviteCode
      }).from(teams).where(eq(teams.inviteCode, inviteCode)).limit(1);
      
      if (result.length === 0) {
        return undefined;
      }
      
      // Return the team with churchId set to null
      return {
        ...result[0],
        churchId: null // Add the missing churchId field with null value
      };
    } catch (error) {
      console.error("Error in getTeamByInviteCode:", error);
      return undefined;
    }
  }

  async joinTeam(userId: number, teamId: number): Promise<User | undefined> {
    return this.updateUser(userId, { teamId });
  }

  generateInviteCode(): string {
    return nanoid(10); // Generate a 10-character unique code
  }
}

// Fallback to memory storage if no database url is provided
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private teams: Map<number, Team>;
  private churches: Map<number, Church>;
  private roleScores: Map<number, RoleScore>;
  private userIdCounter: number;
  private teamIdCounter: number;
  private churchIdCounter: number;
  private roleScoreIdCounter: number;
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.teams = new Map();
    this.churches = new Map();
    this.roleScores = new Map();
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

  // RoleScore methods
  async getRoleScore(id: number): Promise<RoleScore | undefined> {
    return this.roleScores.get(id);
  }

  async getRoleScoreByUserId(userId: number): Promise<RoleScore | undefined> {
    return Array.from(this.roleScores.values()).find(
      (score) => score.userId === userId,
    );
  }

  async getTeamRoleScores(teamId: number): Promise<RoleScore[]> {
    const teamUsers = await this.getUsersInTeam(teamId);
    const teamUserIds = teamUsers.map(user => user.id);
    
    return Array.from(this.roleScores.values()).filter(
      (score) => teamUserIds.includes(score.userId)
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

  // Additional methods
  async getUsersInTeam(teamId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.teamId === teamId,
    );
  }

  async getTeamByInviteCode(inviteCode: string): Promise<Team | undefined> {
    return Array.from(this.teams.values()).find(
      (team) => team.inviteCode === inviteCode,
    );
  }

  async joinTeam(userId: number, teamId: number): Promise<User | undefined> {
    return this.updateUser(userId, { teamId });
  }

  generateInviteCode(): string {
    return nanoid(10); // Generate a 10-character unique code
  }
}

// Use database storage if available, otherwise use memory storage
export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage() 
  : new MemStorage();
