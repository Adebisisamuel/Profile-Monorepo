import { pgTable, text, serial, integer, boolean, jsonb, date, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Society sectors
export const SOCIETY_SECTORS = [
  "Business", 
  "Politiek", 
  "Kunst", 
  "Onderwijs", 
  "Familie", 
  "Religie", 
  "Media"
] as const;

// Referral sources
export const REFERRAL_SOURCES = [
  "Vrienden", 
  "Familie", 
  "Sociale Media", 
  "Zoekmachine", 
  "Kerk", 
  "Evenement", 
  "Anders"
] as const;

// Church denominations
export const CHURCH_DENOMINATIONS = [
  "Katholiek",
  "Protestant",
  "Evangelisch",
  "Pinkster",
  "Orthodox",
  "Baptisten",
  "Gereformeerd",
  "Anders"
] as const;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(), // Primary identifier for login and identification
  password: text("password").notNull(),
  username: text("username"), // Legacy field (nullable) - being phased out in favor of email
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  name: text("name").notNull(), // Full name for display purposes (firstName + lastName)
  profileImageUrl: text("profile_image_url"), // URL to the user's profile image (optional)
  profileImageMetadata: text("profile_image_metadata"), // Metadata for the profile image (size, type, etc.)
  birthDate: date("birth_date"),
  country: text("country"),
  city: text("city"),
  churchId: integer("church_id"), // Church this user belongs to (optional)
  currentSector: text("current_sector"), // Where they currently work
  preferredSector: text("preferred_sector"), // Where they want to work (Voorkeur)
  referralSource: text("referral_source"), // How they heard about us
  role: text("role").default("user").notNull(), // "user" or "teamleader"
  teamId: integer("team_id"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()), // ISO date string
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdById: integer("created_by_id").notNull(),
  plan: text("plan").default("free").notNull(), // "free", "pro", "proplus"
  inviteCode: text("invite_code").notNull().unique(), // Shareable invite code
  churchId: integer("church_id"), // Reference to church if this team belongs to a church
});

export const churches = pgTable("churches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  denomination: text("denomination").notNull(),
  location: text("location").notNull(),
  logoUrl: text("logo_url"),
  logoMetadata: text("logo_metadata"), // Metadata for the logo image (size, type, etc.)
  inviteCode: text("invite_code"), // Shareable invite code for the church
  createdById: integer("created_by_id").notNull(), // Team leader who created it
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const roleScores = pgTable("role_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  apostle: integer("apostle").notNull(),
  prophet: integer("prophet").notNull(),
  evangelist: integer("evangelist").notNull(),
  herder: integer("herder").notNull(),
  teacher: integer("teacher").notNull(),
  responses: jsonb("responses").notNull(), // Stores the raw responses
  createdAt: text("created_at").notNull(), // ISO date string
});

// New table for team-user many-to-many relationship
export const teamMembers = pgTable("team_members", {
  userId: integer("user_id").notNull(),
  teamId: integer("team_id").notNull(),
  joinedAt: text("joined_at").notNull().default(new Date().toISOString()),
}, (table) => {
  return {
    pk: primaryKey(table.userId, table.teamId),
  };
});

export const insertUserSchema = createInsertSchema(users).pick({
  password: true,
  email: true,
  username: true, // Include legacy field for backward compatibility
  firstName: true,
  lastName: true,
  name: true,
  profileImageUrl: true,
  profileImageMetadata: true,
  birthDate: true,
  country: true,
  city: true,
  currentSector: true,
  preferredSector: true,
  referralSource: true,
  role: true,
  teamId: true,
  churchId: true,
  createdAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).pick({
  name: true,
  createdById: true,
  plan: true,
  inviteCode: true,
  churchId: true,
});

export const insertChurchSchema = createInsertSchema(churches).pick({
  name: true,
  denomination: true,
  location: true,
  logoUrl: true,
  logoMetadata: true,
  inviteCode: true,
  createdById: true,
  createdAt: true,
});

export const insertRoleScoreSchema = createInsertSchema(roleScores).pick({
  userId: true,
  apostle: true,
  prophet: true,
  evangelist: true,
  herder: true,
  teacher: true,
  responses: true,
  createdAt: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).pick({
  userId: true,
  teamId: true,
  joinedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

export type InsertChurch = z.infer<typeof insertChurchSchema>;
export type Church = typeof churches.$inferSelect;

export type InsertRoleScore = z.infer<typeof insertRoleScoreSchema>;
export type RoleScore = typeof roleScores.$inferSelect;

export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
