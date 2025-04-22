import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pool as dbPool, ensureConnection, db } from "./db";
import { z } from "zod";
import { insertUserSchema, insertRoleScoreSchema, insertChurchSchema, insertTeamSchema, SOCIETY_SECTORS, REFERRAL_SOURCES, CHURCH_DENOMINATIONS } from "@shared/schema";
import { QUESTIONS, ROLES, ROLE_DESCRIPTIONS } from "@shared/constants";
import { QuestionResponse } from "@shared/types";
import * as path from "path";
import fs from "fs";
import { upload, uploadProfileImage, uploadChurchLogo, setupUploadsRoutes, handleMulterError } from "./upload";
import { calculatePrimaryRole as calculatePrimaryRoleUtil, getTeamRoleDistribution } from "./utils/roleCalculations";

// Helper function to calculate role scores from responses
function calculateRoleScores(responses: QuestionResponse[]): Record<string, number> {
  const roleScores = {
    [ROLES.APOSTLE]: 0,
    [ROLES.PROPHET]: 0,
    [ROLES.EVANGELIST]: 0,
    [ROLES.HERDER]: 0,
    [ROLES.TEACHER]: 0
  };
  
  responses.forEach(response => {
    const { value, statement1Role, statement2Role } = response;
    
    // Value is 0-6 where:
    // 0 = Strong agreement with statement1 (+5 points to statement1Role)
    // 3 = Neutral (0 points to both)
    // 6 = Strong agreement with statement2 (+5 points to statement2Role)
    
    if (value < 3) {
      // Agreement with statement1
      const points = 5 - value; // Convert 0->5, 1->4, 2->3
      roleScores[statement1Role] += points;
    } else if (value > 3) {
      // Agreement with statement2
      const points = value - 3; // Convert 4->1, 5->2, 6->3
      roleScores[statement2Role] += points;
    }
    // value === 3 means neutral, no points added
  });
  
  return roleScores;
}

// Function to get proper role label for a role value
function getRoleLabel(role: string): string {
  switch(role) {
    case ROLES.APOSTLE:
      return ROLE_DESCRIPTIONS[ROLES.APOSTLE]?.title || "Apostel";
    case ROLES.PROPHET:
      return ROLE_DESCRIPTIONS[ROLES.PROPHET]?.title || "Profeet";
    case ROLES.EVANGELIST:
      return ROLE_DESCRIPTIONS[ROLES.EVANGELIST]?.title || "Evangelist";
    case ROLES.HERDER:
      return ROLE_DESCRIPTIONS[ROLES.HERDER]?.title || "Herder";
    case ROLES.TEACHER:
      return ROLE_DESCRIPTIONS[ROLES.TEACHER]?.title || "Leraar";
    default:
      return "Unknown Role";
  }
}

// Generate personalized recommendations based on user's score profile
/**
 * @deprecated Use the imported function from ./utils/roleCalculations instead
 * This function is kept for backwards compatibility, but delegates to the common utility
 */
function calculatePrimaryRole(roleScores: Record<string, number>) {
  return calculatePrimaryRoleUtil(roleScores);
}

function generatePersonalizedRecommendations(roleScores: Record<string, number>) {
  // Calculate primary and secondary roles using the dedicated function
  const roleProfile = calculatePrimaryRole(roleScores);
  
  // Destructure values from the profile
  const { primaryRole, secondaryRole, profileType, dominanceRatio } = roleProfile;
  
  // Calculate balanced and specialized flags based on profile type
  // These are needed for existing code that expects these boolean flags
  const isBalanced = profileType === "balanced";
  const isSpecialized = profileType === "specialized";
  
  // Safety check - if no valid primary role was found
  if (!primaryRole) {
    console.warn('[generatePersonalizedRecommendations] No valid primary role found');
    return {
      primaryRole: null,
      secondaryRole: null,
      profileType: 'unknown',
      strengths: [],
      growthAreas: [],
      teamContributions: [],
      personalGrowthSuggestions: []
    };
  }
  
  // Create the base recommendation
  let recommendation = {
    primaryRole,
    secondaryRole,
    profileType,
    dominanceRatio, // Include the calculated ratio for reference
    strengths: [] as string[],
    growthAreas: [] as string[],
    teamContributions: [] as string[],
    personalGrowthSuggestions: [] as string[]
  };
  
  // Add role-specific recommendations
  switch (primaryRole) {
    case ROLES.APOSTLE:
      recommendation.strengths = [
        "Visie ontwikkelen en uitdragen",
        "Strategisch denken en plannen",
        "Nieuwe initiatieven starten",
        "Leiderschap in veranderingsprocessen"
      ];
      recommendation.growthAreas = [
        "Meer geduld hebben met mensen die langzamer veranderen",
        "Aandacht voor details en implementatie",
        "Verbinden met de emotionele behoeften van anderen"
      ];
      recommendation.teamContributions = [
        "Richting geven aan het team",
        "Vernieuwing stimuleren",
        "Vastgelopen situaties doorbreken"
      ];
      break;
      
    case ROLES.PROPHET:
      recommendation.strengths = [
        "Diepe spirituele inzichten delen",
        "Waarheid spreken in complexe situaties",
        "Onrecht en problemen identificeren",
        "Mensen uitdagen om te groeien"
      ];
      recommendation.growthAreas = [
        "Meer geduld en mededogen tonen",
        "Communicatie verzachten zonder de boodschap te verliezen",
        "Praktische implementatie van visie"
      ];
      recommendation.teamContributions = [
        "Het team wakker houden en uitdagen",
        "Scherp houden op de kernwaarden",
        "Waarschuwen voor verkeerde richtingen"
      ];
      break;
      
    case ROLES.EVANGELIST:
      recommendation.strengths = [
        "Enthousiasmeren en inspireren",
        "Netwerken en verbindingen leggen",
        "Communiceren met verschillende doelgroepen",
        "Mensen mobiliseren voor een doel"
      ];
      recommendation.growthAreas = [
        "Diepgang in relaties ontwikkelen",
        "Analytisch denken versterken",
        "Langetermijnprocessen volhouden"
      ];
      recommendation.teamContributions = [
        "Positieve energie brengen",
        "Nieuwe mensen betrekken",
        "De boodschap helder communiceren"
      ];
      break;
      
    case ROLES.HERDER:
      recommendation.strengths = [
        "Zorg dragen voor het welzijn van anderen",
        "Luisteren en begrijpen",
        "Veilige omgeving creëren",
        "Relaties opbouwen en onderhouden"
      ];
      recommendation.growthAreas = [
        "Grenzen stellen en moeilijke gesprekken voeren",
        "Strategisch denken ontwikkelen",
        "Balans vinden tussen zorg voor anderen en zelfzorg"
      ];
      recommendation.teamContributions = [
        "Zorgen voor teamcohesie",
        "Ondersteuning bieden in moeilijke tijden",
        "Conflicten helpen oplossen"
      ];
      break;
      
    case ROLES.TEACHER:
      recommendation.strengths = [
        "Kennis systematisch ordenen en delen",
        "Complexe concepten helder uitleggen",
        "Grondig onderzoek doen",
        "Waarheid en nauwkeurigheid bewaken"
      ];
      recommendation.growthAreas = [
        "Emotionele intelligentie ontwikkelen",
        "Praktische toepassing van kennis",
        "Flexibiliteit in denken en handelen"
      ];
      recommendation.teamContributions = [
        "Grondige analyse van situaties",
        "Training en toerusting van teamleden",
        "Bewaken van kwaliteit en standaarden"
      ];
      break;
  }
  
  // Add secondary role influence
  if (secondaryRole && !isBalanced) {
    const primaryRoleLabel = getRoleLabel(primaryRole);
    const secondaryRoleLabel = getRoleLabel(secondaryRole);
    
    recommendation.personalGrowthSuggestions.push(
      `Je ${secondaryRoleLabel} aspecten kunnen je helpen om een betere ${primaryRoleLabel} te zijn.`
    );
    
    // Add specific combinations advice
    if (primaryRole === ROLES.APOSTLE && secondaryRole === ROLES.PROPHET) {
      recommendation.personalGrowthSuggestions.push(
        "Je combinatie van visie en onderscheidingsvermogen maakt je sterk in het initiëren van betekenisvolle verandering."
      );
    } else if (primaryRole === ROLES.APOSTLE && secondaryRole === ROLES.TEACHER) {
      recommendation.personalGrowthSuggestions.push(
        "Je combinatie van strategisch denken en analytisch vermogen maakt je sterk in het ontwikkelen van goed onderbouwde plannen."
      );
    } else if (primaryRole === ROLES.PROPHET && secondaryRole === ROLES.TEACHER) {
      recommendation.personalGrowthSuggestions.push(
        "Je combinatie van onderscheidingsvermogen en analytisch denken maakt je sterk in het doorgronden van complexe situaties."
      );
    } else if (primaryRole === ROLES.HERDER && secondaryRole === ROLES.EVANGELIST) {
      recommendation.personalGrowthSuggestions.push(
        "Je combinatie van zorgzaamheid en enthousiasme maakt je sterk in het inspireren en motiveren van mensen in persoonlijke groei."
      );
    }
  }
  
  // Add balanced profile specific advice
  if (isBalanced) {
    recommendation.personalGrowthSuggestions.push(
      "Je hebt een evenwichtig profiel wat je veelzijdig maakt, maar probeer te voorkomen dat je te veel verschillende rollen tegelijk probeert te vervullen."
    );
  }
  
  // Add specialized profile specific advice
  if (isSpecialized) {
    const primaryRoleLabel = getRoleLabel(primaryRole);
    recommendation.personalGrowthSuggestions.push(
      `Je hebt een uitgesproken ${primaryRoleLabel} profiel. Zoek teamleden die complementaire rollen hebben om een volledig team te vormen.`
    );
  }
  
  return recommendation;
}

// Utility function to ensure API responses are properly formatted and returned as JSON
function sendJsonResponse(res: Response, status: number, data: any) {
  // Make sure response is set to JSON content type
  res.setHeader('Content-Type', 'application/json');
  return res.status(status).json(data);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Public routes

  // Get all questions for the questionnaire
  app.get("/api/questions", (req, res) => {
    return res.status(200).json(QUESTIONS);
  });

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    console.log(`Auth Check: ${req.path} - Session ID: ${req.sessionID} - Authenticated: ${req.isAuthenticated()}`);
    
    if (req.isAuthenticated()) {
      const userId = req.user?.id || 'unknown';
      const userEmail = req.user?.email || 'unknown';
      console.log(`User authenticated: ID ${userId} (${userEmail}) - Session ID: ${req.sessionID}`);
      return next();
    }
    
    console.log(`Authentication failed - Session ID: ${req.sessionID} - Headers:`, {
      cookie: req.headers.cookie,
      referer: req.headers.referer,
      origin: req.headers.origin
    });
    
    return res.status(401).json({ message: "Niet geauthenticeerd" });
  };
  
  // Export test results for a user
  app.get("/api/users/:userId/export", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Get the user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get the user's role score
      const roleScore = await storage.getRoleScoreByUserId(userId);
      if (!roleScore) {
        return res.status(404).json({ message: "No test results found for this user" });
      }
      
      // Format the data
      const exportData = {
        user: {
          name: user.name,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          exportDate: new Date().toISOString()
        },
        scores: {
          apostle: roleScore.apostle,
          prophet: roleScore.prophet,
          evangelist: roleScore.evangelist,
          herder: roleScore.herder,
          teacher: roleScore.teacher
        },
        testDate: roleScore.createdAt,
        responses: roleScore.responses
      };
      
      return res.status(200).json(exportData);
    } catch (error) {
      console.error("Export profile error:", error);
      return res.status(500).json({ message: "Failed to export profile data" });
    }
  });
  
  // Export test results for a team
  app.get("/api/teams/:teamId/export", isAuthenticated, async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      
      if (isNaN(teamId)) {
        return res.status(400).json({ message: "Invalid team ID" });
      }
      
      // Verify the team exists
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // Get all users in the team
      const users = await storage.getUsersInTeam(teamId);
      if (!users || users.length === 0) {
        return res.status(404).json({ message: "No members found in this team" });
      }
      
      // Get all their profiles
      const teamData = await Promise.all(
        users.map(async (user) => {
          let roleScore = null;
          try {
            roleScore = await storage.getRoleScoreByUserId(user.id);
          } catch (error) {
            console.error(`Error fetching role score for user ${user.id}:`, error);
          }
          
          return {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName
            },
            scores: roleScore ? {
              apostle: roleScore.apostle,
              prophet: roleScore.prophet,
              evangelist: roleScore.evangelist,
              herder: roleScore.herder,
              teacher: roleScore.teacher
            } : null,
            testDate: roleScore ? roleScore.createdAt : null
          };
        })
      );
      
      // Calculate team aggregate scores
      const teamScores = teamData.reduce(
        (acc, member) => {
          if (!member.scores) return acc;
          
          return {
            apostle: acc.apostle + member.scores.apostle,
            prophet: acc.prophet + member.scores.prophet,
            evangelist: acc.evangelist + member.scores.evangelist,
            herder: acc.herder + member.scores.herder,
            teacher: acc.teacher + member.scores.teacher
          };
        },
        { apostle: 0, prophet: 0, evangelist: 0, herder: 0, teacher: 0 }
      );
      
      const exportData = {
        team: {
          id: team.id,
          name: team.name,
          plan: team.plan,
          exportDate: new Date().toISOString()
        },
        aggregateScores: teamScores,
        members: teamData
      };
      
      return res.status(200).json(exportData);
    } catch (error) {
      console.error("Export team data error:", error);
      return res.status(500).json({ message: "Failed to export team data" });
    }
  });

  // Protected routes
  app.post("/api/profile/submit", isAuthenticated, async (req, res) => {
    try {
      const { responses } = req.body;
      const userId = req.user!.id; // Get the authenticated user's ID
      
      if (!responses || !Array.isArray(responses)) {
        return res.status(400).json({ message: "Invalid submission data" });
      }
      
      // Calculate scores for each role
      const roleScores = calculateRoleScores(responses);
      
      // Calculate primary role info
      const roleProfile = calculatePrimaryRole(roleScores);
      console.log(`[Profile submit] User ${userId}: Primary role=${roleProfile.primaryRole}, Profile type=${roleProfile.profileType}`);
      
      // Check if user has an existing score
      const existingScore = await storage.getRoleScoreByUserId(userId);
      
      let roleScore;
      
      if (existingScore) {
        // Update existing score
        roleScore = await storage.updateRoleScore(existingScore.id, {
          apostle: roleScores[ROLES.APOSTLE],
          prophet: roleScores[ROLES.PROPHET],
          evangelist: roleScores[ROLES.EVANGELIST],
          herder: roleScores[ROLES.HERDER],
          teacher: roleScores[ROLES.TEACHER],
          // We could add primaryRole and profileType fields here if we had them in the schema
          responses: responses,
          createdAt: new Date().toISOString(),
        });
      } else {
        // Create new score
        roleScore = await storage.createRoleScore({
          userId,
          apostle: roleScores[ROLES.APOSTLE],
          prophet: roleScores[ROLES.PROPHET],
          evangelist: roleScores[ROLES.EVANGELIST],
          herder: roleScores[ROLES.HERDER],
          teacher: roleScores[ROLES.TEACHER],
          // We could add primaryRole and profileType fields here if we had them in the schema
          responses: responses,
          createdAt: new Date().toISOString(),
        });
      }
      
      // Add calculated primary role info to the response
      const enhancedResponse = {
        ...roleScore,
        primaryRole: roleProfile.primaryRole,
        secondaryRole: roleProfile.secondaryRole,
        profileType: roleProfile.profileType
      };
      
      return res.status(200).json(enhancedResponse);
    } catch (error) {
      console.error("Profile submission error:", error);
      return res.status(400).json({ message: "Failed to submit profile" });
    }
  });

  // Get user's role score
  app.get("/api/users/:userId/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const roleScore = await storage.getRoleScoreByUserId(userId);
      
      if (!roleScore) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      return res.status(200).json(roleScore);
    } catch (error) {
      console.error("Get profile error:", error);
      return res.status(400).json({ message: "Failed to get profile" });
    }
  });
  
  // Get personalized recommendations based on user's profile
  app.get("/api/users/:userId/recommendations", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const roleScore = await storage.getRoleScoreByUserId(userId);
      
      if (!roleScore) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      const roleScores = {
        [ROLES.APOSTLE]: roleScore.apostle,
        [ROLES.PROPHET]: roleScore.prophet,
        [ROLES.EVANGELIST]: roleScore.evangelist,
        [ROLES.HERDER]: roleScore.herder,
        [ROLES.TEACHER]: roleScore.teacher
      };
      
      // Calculate primary role info
      const roleProfile = calculatePrimaryRole(roleScores);
      console.log(`[API recommendations] User ${userId}: Primary role=${roleProfile.primaryRole}, Profile type=${roleProfile.profileType}`);
      
      // Generate personalized recommendations based on role scores
      const recommendations = generatePersonalizedRecommendations(roleScores);
      
      // Combine with primary role calculation for consistency 
      // (in case generatePersonalizedRecommendations calculates differently)
      const enhancedRecommendations = {
        ...recommendations,
        primaryRole: roleProfile.primaryRole,
        secondaryRole: roleProfile.secondaryRole,
        profileType: roleProfile.profileType
      };
      
      return res.status(200).json(enhancedRecommendations);
    } catch (error) {
      console.error("Get recommendations error:", error);
      return res.status(400).json({ message: "Failed to get recommendations" });
    }
  });

  // Team leader routes
  app.post("/api/teams", isAuthenticated, async (req, res) => {
    try {
      const { name, churchId: explicitChurchId } = req.body;
      const createdById = req.user!.id; // Get the authenticated user's ID
      
      if (!name) {
        return res.status(400).json({ message: "Team name is required" });
      }

      // Generate a unique invite code
      const inviteCode = storage.generateInviteCode();
      
      // If no explicit churchId was provided, check if the user has a church
      let churchId = explicitChurchId;
      
      if (!churchId) {
        console.log(`[API createTeam] Looking for church associated with user ${req.user!.id}`);
        
        // First check if user has a churchId directly
        if (req.user!.churchId) {
          churchId = req.user!.churchId;
          console.log(`[API createTeam] User ${req.user!.id} already has churchId ${churchId}`);
        } 
        // Then check if they created any churches
        else {
          console.log(`[API createTeam] Looking for churches created by user ${req.user!.id}`);
          const churches = await storage.getChurchesByCreatedBy(req.user!.id);
          
          if (churches.length > 0) {
            // Use the first church found (most users will only have one)
            churchId = churches[0].id;
            console.log(`[API createTeam] Found church ${churchId} created by user ${req.user!.id}`);
          }
        }
        
        // If still no church association, check if user belongs to a team with a church
        if (!churchId) {
          console.log(`[API createTeam] Looking for teams user ${req.user!.id} belongs to`);
          const userTeams = await storage.getTeamsForUser(req.user!.id);
          
          for (const team of userTeams) {
            if (team.churchId) {
              churchId = team.churchId;
              console.log(`[API createTeam] Found church ${churchId} via user's team ${team.id}`);
              break;
            }
          }
        }
      }
      
      // Require a church association for team creation
      if (!churchId) {
        console.log(`[API createTeam] No church found for user ${req.user!.id}. Team creation blocked.`);
        return res.status(400).json({ 
          message: "Om een team aan te maken moet je eerst een kerk hebben. Maak eerst een kerkprofiel aan.",
          errorCode: "NO_CHURCH_ASSOCIATION"
        });
      }
      
      // Create team using manual SQL, with required churchId
      console.log(`[API createTeam] Creating team "${name}" with churchId: ${churchId}`);
      const sqlQuery = `
        INSERT INTO teams (name, created_by_id, plan, invite_code, church_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, created_by_id as "createdById", plan, invite_code as "inviteCode", church_id as "churchId"
      `;
      const params = [name, createdById, "free", inviteCode, churchId];
      
      const { rows } = await dbPool.query(sqlQuery, params);
      const team = rows[0];
      console.log(`[API createTeam] Team created:`, team);

      // Update the creator's role to teamleader if it's not already
      if (req.user!.role !== "teamleader") {
        await storage.updateUser(req.user!.id, { role: "teamleader" });
      }
      
      // Also ensure the user is associated with the church
      if (!req.user!.churchId) {
        await storage.updateUser(req.user!.id, { churchId });
        console.log(`[API createTeam] Updated user ${req.user!.id} with churchId ${churchId}`);
      }
      
      return res.status(201).json(team);
    } catch (error) {
      console.error("Create team error:", error);
      return res.status(400).json({ message: "Failed to create team" });
    }
  });

  // Get user's teams
  app.get("/api/users/:userId/teams", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Use a safer approach that handles missing columns
      let teams = [];
      try {
        teams = await storage.getTeamsByCreatedBy(userId);
      } catch (error) {
        // If there's a database schema error, return an empty array
        console.error("Database schema error in getTeamsByCreatedBy:", error);
        return res.status(200).json([]);
      }
      
      return res.status(200).json(teams);
    } catch (error) {
      console.error("Get teams error:", error);
      return res.status(400).json({ message: "Failed to get teams" });
    }
  });

  // Get team members and their profiles
  app.get("/api/teams/:teamId/members", isAuthenticated, async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      
      if (isNaN(teamId)) {
        return res.status(400).json({ 
          message: "Ongeldige team ID", 
          errorCode: "INVALID_TEAM_ID" 
        });
      }
      
      // Ensure database connection is active
      const connectionStatus = await ensureConnection();
      if (!connectionStatus) {
        console.error("Database connection error before retrieving team");
        return res.status(503).json({ 
          message: "Database verbindingsprobleem. Probeer het later opnieuw.", 
          errorCode: "DATABASE_CONNECTION_ERROR" 
        });
      }
      
      // First verify the team exists
      let team;
      try {
        team = await storage.getTeam(teamId);
      } catch (teamError) {
        console.error(`[API getTeamMembers] Error fetching team ${teamId}:`, teamError);
        return res.status(500).json({ 
          message: "Er is een fout opgetreden bij het ophalen van teamgegevens", 
          errorCode: "TEAM_FETCH_ERROR" 
        });
      }
      
      if (!team) {
        console.error(`[API getTeamMembers] Team ${teamId} does not exist`);
        return res.status(404).json({ 
          message: "Team niet gevonden", 
          errorCode: "TEAM_NOT_FOUND" 
        });
      }
      
      // Check if user has permission to view this team's members
      // Only the team creator or church admin should be able to see team members
      const isTeamCreator = team.createdById === req.user!.id;
      let isChurchAdmin = false;
      
      if (team.churchId && !isTeamCreator) {
        try {
          const church = await storage.getChurch(team.churchId);
          if (church && church.createdById === req.user!.id) {
            isChurchAdmin = true;
          }
        } catch (churchError) {
          console.error(`[API getTeamMembers] Error checking church permissions:`, churchError);
          // Continue with just the team creator check
        }
      }
      
      // If user is neither team creator nor church admin, check if they're a member
      let isTeamMember = false;
      if (!isTeamCreator && !isChurchAdmin) {
        try {
          const teamMembers = await storage.getUsersInTeam(teamId);
          isTeamMember = teamMembers.some(member => member.id === req.user!.id);
        } catch (membershipError) {
          console.error(`[API getTeamMembers] Error checking team membership:`, membershipError);
          // Fail secure - assume not a member
        }
      }
      
      // Block access if no permission
      if (!isTeamCreator && !isChurchAdmin && !isTeamMember) {
        console.error(`[API getTeamMembers] Access denied: User ${req.user!.id} is not authorized to view team ${teamId}`);
        return res.status(403).json({ 
          message: "Je hebt geen toegang tot dit team", 
          errorCode: "ACCESS_DENIED" 
        });
      }
      
      // Log requestor details
      console.log(`[API getTeamMembers] User ${req.user!.id} (${req.user!.email}) requesting members for team ${teamId} (${team.name})`);
      console.log(`[API getTeamMembers] Team created by: ${team.createdById}, with current user: ${req.user!.id}`);
      
      // Get all users on this team with enhanced error tracing
      console.log(`[API getTeamMembers] Fetching members for team ${teamId}`);
      // Use a more specific type to fix TypeScript errors
      type UserWithProfile = {
        id: number;
        email: string;
        username: string | null;
        password: string;
        name: string;
        teamId: number | null;
        [key: string]: any; // Allow for additional properties
      };
      
      let users: UserWithProfile[] = [];
      try {
        users = await storage.getUsersInTeam(teamId);
        console.log(`[API getTeamMembers] Found ${users.length} user(s) in team ${teamId}:`, 
          users.map((u: UserWithProfile) => ({ id: u.id, name: u.name, email: u.email, teamId: u.teamId })));
      } catch (teamMembersError) {
        console.error(`[API getTeamMembers] Error fetching team members: ${teamMembersError}`);
        
        // If we fail to get members through the storage interface, but want to continue rather than error out
        // we'll set users to an empty array and try a direct SQL query as a fallback
      }
      
      // If we couldn't find members but the team exists, do a direct database query as a fallback 
      // to check if there are users with this teamId
      if (users.length === 0 && process.env.DATABASE_URL) {
        console.log(`[API getTeamMembers] No users found via storage interface, trying direct SQL query for team ${teamId}`);
        try {
          const query = `
            SELECT id, email, username, first_name, last_name, name, team_id 
            FROM users 
            WHERE team_id = $1
          `;
          
          const { rows } = await dbPool.query(query, [teamId]);
          console.log(`[API getTeamMembers] Direct SQL found ${rows.length} users for team ${teamId}:`, 
            rows.map((r: any) => `ID: ${r.id}, Email: ${r.email}`));
            
          // If direct SQL found members but storage interface didn't, try to fix it
          if (rows.length > 0) {
            console.log(`[API getTeamMembers] ✓ Directly found users for team ${teamId}, attempting to update these users with SQL`);
            for (const row of rows) {
              try {
                const updateQuery = `
                  UPDATE users SET team_id = $1 WHERE id = $2
                `;
                await dbPool.query(updateQuery, [teamId, row.id]);
                console.log(`[API getTeamMembers] ✓ Re-enforced team_id ${teamId} for user ${row.id}`);
              } catch (updateError) {
                console.error(`[API getTeamMembers] Failed to update team_id for user ${row.id}:`, updateError);
              }
            }
          } else {
            // Check to see if the team creator is actually part of the team
            const creatorQuery = `
              SELECT id, email, team_id FROM users WHERE id = $1
            `;
            const creatorResult = await dbPool.query(creatorQuery, [team.createdById]);
            if (creatorResult.rows.length > 0) {
              const creator = creatorResult.rows[0];
              console.log(`[API getTeamMembers] Team creator has id ${creator.id}, email ${creator.email}, teamId ${creator.team_id}`);
              
              if (creator.team_id !== teamId) {
                console.log(`[API getTeamMembers] ⚠️ Team creator is not part of the team they created!`);
                console.log(`[API getTeamMembers] Attempting to add team creator to their own team...`);
                
                try {
                  const updateCreatorQuery = `
                    UPDATE users SET team_id = $1 WHERE id = $2 RETURNING *
                  `;
                  const updateResult = await dbPool.query(updateCreatorQuery, [teamId, creator.id]);
                  console.log(`[API getTeamMembers] ✓ Added team creator to team: ${JSON.stringify(updateResult.rows[0])}`);
                } catch (updateError) {
                  console.error(`[API getTeamMembers] Failed to add team creator to team:`, updateError);
                }
              }
            }
          }
        } catch (sqlError) {
          console.error(`[API getTeamMembers] Error running direct SQL query:`, sqlError);
        }
      }
      
      // After our fixes, try to get the users again if we didn't find any initially
      let finalUsers: UserWithProfile[] = [];
      try {
        finalUsers = (users && users.length > 0) ? users : await storage.getUsersInTeam(teamId);
      } catch (fetchError) {
        console.error(`[API getTeamMembers] Final error fetching team members:`, fetchError);
        return res.status(500).json({ 
          message: "Er is een fout opgetreden bij het ophalen van teamleden", 
          errorCode: "TEAM_MEMBERS_FETCH_ERROR" 
        });
      }
      
      if (!finalUsers || finalUsers.length === 0) {
        console.log(`[API getTeamMembers] Team ${teamId} has no members or there was an error fetching them`);
        // Return an empty array with a successful status, not an error
        return res.status(200).json([]);
      }
      
      // Get profiles for all team members
      let teamMembers;
      try {
        teamMembers = await Promise.all(
          finalUsers.map(async (user: UserWithProfile) => {
            let roleScore = null;
            try {
              // Try to get role score, but don't fail if it doesn't exist
              roleScore = await storage.getRoleScoreByUserId(user.id);
            } catch (roleError) {
              console.error(`[API getTeamMembers] Error fetching role score for user ${user.id}:`, roleError);
            }
            
            const { password, ...userWithoutPassword } = user;
            
            return {
              ...userWithoutPassword,
              profile: roleScore || null
            };
          })
        );
      } catch (profileError) {
        console.error(`[API getTeamMembers] Error mapping profiles to users:`, profileError);
        // If this fails, at least return the users without their profiles
        const sanitizedUsers = finalUsers.map((user: UserWithProfile) => {
          const { password, ...userWithoutPassword } = user;
          return {
            ...userWithoutPassword,
            profile: null
          };
        });
        
        console.log(`[API getTeamMembers] Returning ${sanitizedUsers.length} team members WITHOUT profiles due to error`);
        return res.status(200).json(sanitizedUsers);
      }
      
      console.log(`[API getTeamMembers] Returning ${teamMembers.length} team members with profiles`);
      return res.status(200).json(teamMembers);
    } catch (error) {
      console.error("[API getTeamMembers] Unhandled error:", error);
      return res.status(500).json({ 
        message: "Er is een fout opgetreden bij het ophalen van teamleden", 
        errorCode: "SERVER_ERROR",
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      });
    }
  });

  // Get team by invite code (public endpoint for verifying invite codes)
  // Support both URL formats for compatibility
  app.get(["/api/teams/invite/:inviteCode", "/api/teams/by-invite/:inviteCode"], async (req, res) => {
    try {
      const { inviteCode } = req.params;
      
      if (!inviteCode) {
        return res.status(400).json({ 
          message: "Uitnodigingscode is vereist", 
          errorCode: "MISSING_INVITE_CODE" 
        });
      }
      
      console.log(`[API getTeamByInviteCode] Looking up team with invite code: ${inviteCode}`);
      
      // Ensure database connection is active
      const connectionStatus = await ensureConnection();
      if (!connectionStatus) {
        console.error("[API getTeamByInviteCode] Database connection error");
        return res.status(503).json({ 
          message: "Database verbindingsprobleem. Probeer het later opnieuw.", 
          errorCode: "DATABASE_CONNECTION_ERROR" 
        });
      }
      
      // Find team by invite code
      let team;
      try {
        team = await storage.getTeamByInviteCode(inviteCode);
      } catch (dbError) {
        console.error(`[API getTeamByInviteCode] Database error finding team with invite code:`, dbError);
        return res.status(500).json({ 
          message: "Er is een fout opgetreden bij het zoeken naar het team. Probeer het later opnieuw.",
          errorCode: "TEAM_LOOKUP_ERROR"
        });
      }
      
      if (!team) {
        console.log(`[API getTeamByInviteCode] No team found for invite code: ${inviteCode}`);
        return res.status(404).json({ 
          message: "Team niet gevonden. Controleer de uitnodigingscode en probeer opnieuw.", 
          errorCode: "INVALID_INVITE_CODE" 
        });
      }
      
      // If fuzzy matching was used, log the corrected code
      if (team.inviteCode.toLowerCase() !== inviteCode.toLowerCase()) {
        console.log(`[API getTeamByInviteCode] Invite code was corrected using fuzzy matching from ${inviteCode} to ${team.inviteCode}`);
      }
      
      console.log(`[API getTeamByInviteCode] Successfully found team for invite code ${inviteCode}:`, team);
      
      // Return in the format expected by the frontend
      return res.status(200).json({ 
        teamId: team.id, 
        teamName: team.name, 
        // Also include the same properties in the legacy format for backward compatibility
        id: team.id,
        name: team.name,
        inviteCode: team.inviteCode,
        plan: team.plan,
        churchId: team.churchId,
        createdById: team.createdById
      });
    } catch (error) {
      console.error("[API getTeamByInviteCode] Unhandled error:", error);
      return res.status(500).json({ 
        message: "Er is een fout opgetreden bij het ophalen van het team", 
        errorCode: "SERVER_ERROR",
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      });
    }
  });
  
  // Get church by invite code (public endpoint for verifying church invite codes)
  app.get("/api/churches/by-invite/:inviteCode", async (req, res) => {
    try {
      const { inviteCode } = req.params;
      console.log(`[API getChurchByInviteCode] Looking up church with invite code: ${inviteCode}`);
      
      if (!inviteCode) {
        return res.status(400).json({ 
          message: "Uitnodigingscode is vereist", 
          errorCode: "MISSING_INVITE_CODE" 
        });
      }
      
      // Ensure database connection is active
      const connectionStatus = await ensureConnection();
      if (!connectionStatus) {
        console.error("[API getChurchByInviteCode] Database connection error");
        return res.status(503).json({ 
          message: "Database verbindingsprobleem. Probeer het later opnieuw.", 
          errorCode: "DATABASE_CONNECTION_ERROR" 
        });
      }
      
      // Find church by invite code
      let church;
      try {
        church = await storage.getChurchByInviteCode(inviteCode);
      } catch (dbError) {
        console.error(`[API getChurchByInviteCode] Database error finding church with invite code:`, dbError);
        return res.status(500).json({ 
          message: "Er is een fout opgetreden bij het zoeken naar de kerk. Probeer het later opnieuw.",
          errorCode: "CHURCH_LOOKUP_ERROR"
        });
      }
      
      if (!church) {
        console.log(`[API getChurchByInviteCode] No church found for invite code: ${inviteCode}`);
        return res.status(404).json({ 
          message: "Kerk niet gevonden. Controleer de uitnodigingscode en probeer opnieuw.", 
          errorCode: "INVALID_INVITE_CODE" 
        });
      }
      
      // If fuzzy matching was used, log the corrected code
      if (church.inviteCode && church.inviteCode.toLowerCase() !== inviteCode.toLowerCase()) {
        console.log(`[API getChurchByInviteCode] Invite code was corrected using fuzzy matching from ${inviteCode} to ${church.inviteCode}`);
      }
      
      console.log(`[API getChurchByInviteCode] Found church ${church.id} (${church.name}) for invite code: ${inviteCode}`);
      
      // Format church to match team response format for the UI component
      return res.status(200).json({ 
        teamId: church.id, // Use teamId since the component expects it
        teamName: church.name, // Use teamName since the component expects it
        id: church.id,
        name: church.name,
        location: church.location,
        denomination: church.denomination,
        logoUrl: church.logoUrl,
        inviteCode: church.inviteCode,
        createdById: church.createdById,
        isChurch: true // Add a flag to indicate this is a church
      });
    } catch (error) {
      console.error("[API getChurchByInviteCode] Unhandled error:", error);
      return res.status(500).json({ 
        message: "Er is een fout opgetreden bij het ophalen van de kerk", 
        errorCode: "SERVER_ERROR",
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      });
    }
  });

  // Join a team with a teamId
  app.post("/api/teams/:teamId/join", isAuthenticated, async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const userId = req.user!.id;
      
      console.log(`[API joinTeamById] User ${userId} attempting to join team with ID ${teamId}`);
      
      if (isNaN(teamId)) {
        return res.status(400).json({ 
          message: "Ongeldige team ID", 
          errorCode: "INVALID_TEAM_ID" 
        });
      }
      
      // Ensure database connection is active
      const connectionStatus = await ensureConnection();
      if (!connectionStatus) {
        console.error("[API joinTeamById] Database connection error");
        return res.status(503).json({ 
          message: "Database verbindingsprobleem. Probeer het later opnieuw.", 
          errorCode: "DATABASE_CONNECTION_ERROR" 
        });
      }
      
      // Find team by ID
      let team;
      try {
        team = await storage.getTeam(teamId);
      } catch (dbError) {
        console.error(`[API joinTeamById] Database error finding team with ID ${teamId}:`, dbError);
        return res.status(500).json({ 
          message: "Er is een fout opgetreden bij het zoeken naar het team. Probeer het later opnieuw.",
          errorCode: "TEAM_LOOKUP_ERROR"
        });
      }
      
      if (!team) {
        console.error(`[API joinTeamById] Team with ID ${teamId} not found`);
        return res.status(404).json({ 
          message: "Team niet gevonden", 
          errorCode: "TEAM_NOT_FOUND" 
        });
      }
      
      console.log(`[API joinTeamById] Found team ${team.id} (${team.name})`);
      
      // Check if the user is already a member of this team
      try {
        const existingTeamMembers = await storage.getUsersInTeam(team.id);
        const isAlreadyMember = existingTeamMembers.some(member => member.id === userId);
        
        if (isAlreadyMember) {
          console.log(`[API joinTeamById] User ${userId} is already a member of team ${team.id}`);
          return res.status(409).json({ 
            message: "Je bent al lid van dit team",
            errorCode: "ALREADY_TEAM_MEMBER",
            team: {
              id: team.id,
              name: team.name
            }
          });
        }
      } catch (memberCheckError) {
        console.error(`[API joinTeamById] Error checking team membership:`, memberCheckError);
        // Continue anyway - not critical for the join operation
      }
      
      // Check if the team belongs to a church and log it
      let church = null;
      if (team.churchId) {
        console.log(`[API joinTeamById] Team ${team.id} belongs to church ${team.churchId}`);
        
        // Get church details if available
        try {
          church = await storage.getChurch(team.churchId);
          if (church) {
            console.log(`[API joinTeamById] Associated church is ${church.name} (${church.id})`);
          }
        } catch (churchError) {
          console.error(`[API joinTeamById] Error fetching church ${team.churchId}:`, churchError);
          // Continue anyway - this is not critical for joining a team
        }
      } else {
        console.log(`[API joinTeamById] Team ${team.id} doesn't belong to any church`);
      }
      
      // Verify the user exists before joining the team
      let userToUpdate;
      try {
        userToUpdate = await storage.getUser(userId);
        
        if (!userToUpdate) {
          console.error(`[API joinTeamById] Failed to find user ${userId} when trying to join team ${teamId}`);
          return res.status(404).json({ 
            message: "Gebruiker niet gevonden", 
            errorCode: "USER_NOT_FOUND" 
          });
        }
      } catch (userError) {
        console.error(`[API joinTeamById] Error fetching user:`, userError);
        return res.status(500).json({ 
          message: "Er is een fout opgetreden bij het ophalen van gebruikersgegevens", 
          errorCode: "USER_LOOKUP_ERROR" 
        });
      }
      
      // Join the team using the joinTeam method
      console.log(`[API joinTeamById] Attempting to join user ${userId} to team ${teamId}`);
      let updatedUser;
      try {
        updatedUser = await storage.joinTeam(userId, teamId);
      } catch (joinError) {
        console.error(`[API joinTeamById] Error joining team:`, joinError);
        return res.status(500).json({ 
          message: "Er is een fout opgetreden bij het lid worden van het team. Probeer het later opnieuw.",
          errorCode: "JOIN_TEAM_ERROR"
        });
      }
      
      if (!updatedUser) {
        console.error(`[API joinTeamById] Failed to join team ${teamId} for user ${userId}`);
        return res.status(500).json({ 
          message: "Er is een fout opgetreden bij het lid worden van het team",
          errorCode: "JOIN_TEAM_FAILED" 
        });
      }
      
      console.log(`[API joinTeamById] User ${userId} successfully joined team ${teamId}`);
      
      // Include information about church association in the response if available
      let responseData: any = { 
        message: "Successfully joined team", 
        user: updatedUser,
        team: {
          id: team.id,
          name: team.name
        }
      };
      
      // Add church information if team belongs to a church
      if (church) {
        responseData.message = "Successfully joined team and associated church";
        responseData.church = {
          id: church.id,
          name: church.name
        };
        console.log(`[API joinTeamById] Also associated user with church ${church.name} (${church.id})`);
      }
      
      return res.status(200).json(responseData);
    } catch (error) {
      console.error("[API joinTeamById] Unhandled error:", error);
      return res.status(500).json({ 
        message: "Er is een fout opgetreden bij het lid worden van het team",
        errorCode: "SERVER_ERROR",
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      });
    }
  });
  
  // Join a team with an invite code - additional route for frontend compatibility
  app.post("/api/teams/join/:inviteCode", isAuthenticated, async (req, res) => {
    try {
      const { inviteCode } = req.params;
      const userId = req.user!.id;
      
      console.log(`[API joinTeamByInvite] User ${userId} attempting to join team with invite code ${inviteCode}`);
      
      // Validate invite code
      if (!inviteCode) {
        return res.status(400).json({ 
          message: "Uitnodigingscode is vereist", 
          errorCode: "MISSING_INVITE_CODE" 
        });
      }
      
      // Ensure database connection is active
      const connectionStatus = await ensureConnection();
      if (!connectionStatus) {
        console.error("[API joinTeamByInvite] Database connection error");
        return res.status(503).json({ 
          message: "Database verbindingsprobleem. Probeer het later opnieuw.", 
          errorCode: "DATABASE_CONNECTION_ERROR" 
        });
      }
      
      // Find team by invite code
      let team;
      try {
        team = await storage.getTeamByInviteCode(inviteCode);
      } catch (dbError) {
        console.error(`[API joinTeamByInvite] Database error finding team with invite code:`, dbError);
        return res.status(500).json({ 
          message: "Er is een fout opgetreden bij het zoeken naar het team. Probeer het later opnieuw.",
          errorCode: "TEAM_LOOKUP_ERROR"
        });
      }
      
      if (!team) {
        console.error(`[API joinTeamByInvite] Team not found with the provided invite code: ${inviteCode}`);
        return res.status(404).json({ 
          message: "Team niet gevonden met de opgegeven uitnodigingscode. Controleer de code en probeer opnieuw.",
          errorCode: "INVALID_INVITE_CODE"
        });
      }
      
      // If fuzzy matching was used, log the corrected code
      if (team.inviteCode.toLowerCase() !== inviteCode.toLowerCase()) {
        console.log(`[API joinTeamByInvite] Invite code was corrected using fuzzy matching from ${inviteCode} to ${team.inviteCode}`);
      }
      
      console.log(`[API joinTeamByInvite] Found team ${team.id} (${team.name}) for invite code ${inviteCode}`);
      
      // Check if the user is already a member of this team
      const existingTeamMembers = await storage.getUsersInTeam(team.id);
      const isAlreadyMember = existingTeamMembers.some(member => member.id === userId);
      
      if (isAlreadyMember) {
        console.log(`[API joinTeamByInvite] User ${userId} is already a member of team ${team.id}`);
        return res.status(409).json({ 
          message: "Je bent al lid van dit team",
          errorCode: "ALREADY_TEAM_MEMBER",
          team: {
            id: team.id,
            name: team.name
          }
        });
      }
      
      // Check if the team belongs to a church and log it
      let church = null;
      if (team.churchId) {
        console.log(`[API joinTeamByInvite] Team ${team.id} belongs to church ${team.churchId}`);
        
        // Get church details if available
        try {
          church = await storage.getChurch(team.churchId);
          if (church) {
            console.log(`[API joinTeamByInvite] Associated church is ${church.name} (${church.id})`);
          }
        } catch (churchError) {
          console.error(`[API joinTeamByInvite] Error fetching church ${team.churchId}:`, churchError);
          // Continue anyway - this is not critical for joining a team
        }
      } else {
        console.log(`[API joinTeamByInvite] Team ${team.id} doesn't belong to any church`);
      }
      
      // Verify the user exists before joining the team
      const userToUpdate = await storage.getUser(userId);
      
      if (!userToUpdate) {
        console.error(`[API joinTeamByInvite] Failed to find user ${userId} when trying to join team ${team.id}`);
        return res.status(404).json({ 
          message: "Gebruiker niet gevonden", 
          errorCode: "USER_NOT_FOUND" 
        });
      }
      
      // Join the team using the joinTeam method (which now also handles church association)
      console.log(`[API joinTeamByInvite] Attempting to join user ${userId} to team ${team.id}`);
      let updatedUser;
      try {
        updatedUser = await storage.joinTeam(userId, team.id);
      } catch (joinError) {
        console.error(`[API joinTeamByInvite] Error joining team:`, joinError);
        return res.status(500).json({ 
          message: "Er is een fout opgetreden bij het lid worden van het team. Probeer het later opnieuw.",
          errorCode: "JOIN_TEAM_ERROR"
        });
      }
      
      if (!updatedUser) {
        console.error(`[API joinTeamByInvite] Failed to join team ${team.id} for user ${userId}`);
        return res.status(500).json({ 
          message: "Er is een fout opgetreden bij het lid worden van het team",
          errorCode: "JOIN_TEAM_FAILED" 
        });
      }
      
      console.log(`[API joinTeamByInvite] User ${userId} successfully joined team ${team.id}`);
      
      // Include information about church association in the response if available
      let responseData: any = { 
        message: "Successfully joined team", 
        user: updatedUser,
        team: {
          id: team.id,
          name: team.name,
          inviteCode: team.inviteCode
        }
      };
      
      // Add church information if team belongs to a church
      if (church) {
        responseData.message = "Successfully joined team and associated church";
        responseData.church = {
          id: church.id,
          name: church.name
        };
        console.log(`[API joinTeamByInvite] Also associated user with church ${church.name} (${church.id})`);
      }
      
      return res.status(200).json(responseData);
    } catch (error) {
      console.error("[API joinTeamByInvite] Error:", error);
      return res.status(500).json({ 
        message: "Er is een fout opgetreden bij het lid worden van het team",
        errorCode: "SERVER_ERROR",
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      });
    }
  });

  // Create a new church
  app.post("/api/churches", isAuthenticated, async (req, res) => {
    try {
      const churchData = req.body;
      const createdById = req.user!.id;
      
      console.log(`[API createChurch] User ${createdById} is attempting to create a new church`);
      
      // Ensure database connection is active
      const connectionStatus = await ensureConnection();
      if (!connectionStatus) {
        console.error("[API createChurch] Database connection error");
        return res.status(503).json({ 
          message: "Database verbindingsprobleem. Probeer het later opnieuw.", 
          errorCode: "DATABASE_CONNECTION_ERROR" 
        });
      }
      
      // Validate church data using zod schema
      const validatedData = insertChurchSchema.safeParse({
        ...churchData,
        createdById
      });
      
      if (!validatedData.success) {
        console.error(`[API createChurch] Validation failed:`, validatedData.error.errors);
        return res.status(400).json({ 
          message: "Ongeldige kerkgegevens. Controleer de ingevoerde informatie.", 
          errors: validatedData.error.errors,
          errorCode: "VALIDATION_ERROR"
        });
      }
      
      // Check required fields even if they pass the schema
      if (!validatedData.data.name || validatedData.data.name.trim() === '') {
        return res.status(400).json({ 
          message: "Kerknaam is verplicht.", 
          errorCode: "MISSING_NAME" 
        });
      }
      
      if (!validatedData.data.location || validatedData.data.location.trim() === '') {
        return res.status(400).json({ 
          message: "Locatie is verplicht.", 
          errorCode: "MISSING_LOCATION" 
        });
      }
      
      // Check if a church with this name already exists (case-insensitive)
      if (validatedData.data.name) {
        console.log(`[API createChurch] Checking if church name "${validatedData.data.name}" already exists`);
        
        try {
          // Use direct SQL query through the pool to check for existing church with same name (case-insensitive)
          const { rows } = await dbPool.query(
            "SELECT id, name FROM churches WHERE LOWER(name) = LOWER($1)",
            [validatedData.data.name]
          );
          
          if (rows.length > 0) {
            console.log(`[API createChurch] Church name "${validatedData.data.name}" already exists (ID: ${rows[0].id}) - rejecting`);
            return res.status(409).json({ 
              message: "Een kerk met deze naam bestaat al. Kies een andere naam.",
              errorCode: "DUPLICATE_NAME"
            });
          } else {
            console.log(`[API createChurch] Church name "${validatedData.data.name}" is unique - proceeding`);
          }
        } catch (dbError) {
          console.error(`[API createChurch] Database error checking for duplicate name:`, dbError);
          return res.status(500).json({ 
            message: "Er is een fout opgetreden bij het controleren van de kerknaam. Probeer het later opnieuw.",
            errorCode: "DATABASE_ERROR"
          });
        }
      }
      
      // Always generate an invite code for a new church
      const inviteCode = storage.generateInviteCode();
      console.log(`[API createChurch] Generated invite code: ${inviteCode}`);
      
      // Create the church
      let church;
      try {
        church = await storage.createChurch({
          ...validatedData.data,
          inviteCode
        });
      } catch (createError) {
        console.error(`[API createChurch] Error creating church:`, createError);
        return res.status(500).json({ 
          message: "Er is een fout opgetreden bij het aanmaken van de kerk. Probeer het later opnieuw.",
          errorCode: "CHURCH_CREATION_ERROR"
        });
      }
      
      if (!church) {
        console.error(`[API createChurch] Failed to create church - no error thrown but no church returned`);
        return res.status(500).json({ 
          message: "Er is een fout opgetreden bij het aanmaken van de kerk.",
          errorCode: "CHURCH_CREATION_FAILED"
        });
      }
      
      console.log(`[API createChurch] Successfully created church "${church.name}" (ID: ${church.id}) with invite code ${inviteCode}`);
      
      // Return the created church
      return res.status(201).json({
        ...church,
        message: "Kerk succesvol aangemaakt"
      });
    } catch (error) {
      console.error("[API createChurch] Unhandled error:", error);
      return res.status(500).json({ 
        message: "Er is een fout opgetreden bij het aanmaken van de kerk", 
        errorCode: "SERVER_ERROR",
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      });
    }
  });

  // Update church
  app.patch("/api/churches/:churchId", isAuthenticated, async (req, res) => {
    try {
      const churchId = parseInt(req.params.churchId);
      const updateData = req.body;
      
      if (isNaN(churchId)) {
        return res.status(400).json({ message: "Invalid church ID" });
      }
      
      const existingChurch = await storage.getChurch(churchId);
      
      if (!existingChurch) {
        return res.status(404).json({ message: "Church not found" });
      }
      
      // Check if user has permission (is creator)
      if (existingChurch.createdById !== req.user!.id) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      // If the name is being updated, check for duplicates
      if (updateData.name && updateData.name !== existingChurch.name) {
        console.log(`Checking if updated church name "${updateData.name}" already exists (current: ${existingChurch.name})`);
        
        // Use direct SQL query through the pool to check for existing church with same name (case-insensitive)
        const { rows } = await dbPool.query(
          "SELECT id, name FROM churches WHERE LOWER(name) = LOWER($1) AND id != $2",
          [updateData.name, churchId]
        );
        
        if (rows.length > 0) {
          console.log(`Church name "${updateData.name}" already exists (ID: ${rows[0].id}) - rejecting update`);
          return res.status(400).json({ 
            message: "Een kerk met deze naam bestaat al. Kies een andere naam.",
            error: "DUPLICATE_NAME"
          });
        } else {
          console.log(`Church name "${updateData.name}" is unique - proceeding with update`);
        }
      }
      
      // Update the church
      const updatedChurch = await storage.updateChurch(churchId, updateData);
      
      return res.status(200).json(updatedChurch);
    } catch (error) {
      console.error("Update church error:", error);
      return res.status(400).json({ message: "Failed to update church" });
    }
  });
  
  // Associate a team with a church
  app.patch("/api/teams/:teamId/church", isAuthenticated, async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const { churchId } = req.body;
      
      if (isNaN(teamId)) {
        return res.status(400).json({ message: "Invalid team ID" });
      }
      
      if (!churchId || isNaN(parseInt(churchId))) {
        return res.status(400).json({ message: "Valid church ID is required" });
      }
      
      const churchIdNum = parseInt(churchId);
      
      // Verify team exists
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // Check if user has permission (is team creator)
      if (team.createdById !== req.user!.id) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      // Verify church exists
      const church = await storage.getChurch(churchIdNum);
      
      if (!church) {
        return res.status(404).json({ message: "Church not found" });
      }
      
      // Check if user has permission (is church creator)
      if (church.createdById !== req.user!.id) {
        return res.status(403).json({ message: "Insufficient permissions to associate with this church" });
      }
      
      // Update the team's church association directly with SQL
      const sqlQuery = `
        UPDATE teams 
        SET church_id = $1
        WHERE id = $2
        RETURNING id, name, created_by_id as "createdById", plan, invite_code as "inviteCode", church_id as "churchId"
      `;
      
      console.log(`[API associateTeamWithChurch] Associating team ${teamId} with church ${churchIdNum}`);
      
      const { rows } = await dbPool.query(sqlQuery, [churchIdNum, teamId]);
      
      if (rows.length === 0) {
        return res.status(404).json({ message: "Failed to update team" });
      }
      
      const updatedTeam = rows[0];
      console.log(`[API associateTeamWithChurch] Team updated:`, updatedTeam);
      
      return res.status(200).json(updatedTeam);
    } catch (error) {
      console.error("Update team church association error:", error);
      return res.status(400).json({ message: "Failed to update team's church association" });
    }
  });

  // Upload church logo
  app.post("/api/churches/:churchId/logo", isAuthenticated, upload.single('logo'), uploadChurchLogo);

  // Get User's Churches - Get churches created by the user
  app.get("/api/users/:userId/churches", isAuthenticated, async (req, res) => {
    try {
      console.log(`[API getUserChurches] Request to get churches for user ID: ${req.params.userId} from user ${req.user!.id}`);
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        console.log(`[API getUserChurches] Invalid user ID: ${req.params.userId}`);
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Verify the user is requesting their own data
      if (userId !== req.user!.id) {
        console.log(`[API getUserChurches] Permission denied: User ${req.user!.id} trying to access user ${userId}'s churches`);
        return res.status(403).json({ message: "You can only request your own churches" });
      }
      
      console.log(`[API getUserChurches] Getting churches created by user ${userId}`);
      const churches = await storage.getChurchesByCreatedBy(userId);
      console.log(`[API getUserChurches] Found ${churches.length} churches for user ${userId}:`, churches);
      
      // Additional debugging - check if we found a church
      if (churches.length === 0) {
        console.log(`[API getUserChurches] No churches found for user ${userId}, checking for teams with church associations`);
        
        // Get all teams created by the user
        const userTeams = await storage.getTeamsByCreatedBy(userId);
        console.log(`[API getUserChurches] User ${userId} has ${userTeams.length} teams`);
        
        // Find any teams with church associations
        const teamsWithChurches = userTeams.filter(team => team.churchId !== null);
        console.log(`[API getUserChurches] Found ${teamsWithChurches.length} teams with church associations`);
        
        if (teamsWithChurches.length > 0) {
          // Convert Set to Array and filter out null values for type safety
          const churchIdsSet = new Set(teamsWithChurches.map(team => team.churchId));
          const churchIds = Array.from(churchIdsSet).filter((id): id is number => id !== null);
          console.log(`[API getUserChurches] Found associated church IDs: ${churchIds.join(", ")}`);
          
          // Get all unique churches
          const associatedChurches = [];
          for (const churchId of churchIds) {
            if (churchId !== null) {
              const church = await storage.getChurch(churchId);
              if (church) {
                associatedChurches.push(church);
              }
            }
          }
          
          console.log(`[API getUserChurches] Found ${associatedChurches.length} associated churches:`, associatedChurches);
          return res.status(200).json(associatedChurches);
        }
      }
      
      return res.status(200).json(churches);
    } catch (error) {
      console.error("Get user churches error:", error);
      return res.status(400).json({ message: "Failed to get user churches" });
    }
  });
  
  // Get current user's church - Used by church profile page

  app.get("/api/churches/my", isAuthenticated, async (req, res) => {
    try {
      console.log(`[API getMyChurch] Request from user ${req.user!.id}`);
      
      if (req.user!.role !== "teamleader") {
        console.log(`[API getMyChurch] User ${req.user!.id} is not a team leader`);
        return res.status(403).json({ message: "Only team leaders can have a church" });
      }
      
      // Get churches created by the current user
      const churches = await storage.getChurchesByCreatedBy(req.user!.id);
      console.log(`[API getMyChurch] Found ${churches.length} churches for user ${req.user!.id}`);
      
      if (churches.length > 0) {
        // Return the first church (most users will only have one)
        return res.status(200).json(churches[0]);
      }
      
      // If no churches found, check if the user has teams with church associations
      console.log(`[API getMyChurch] No churches found for user ${req.user!.id}, checking for teams with church associations`);
      
      // Get all teams created by the user
      const userTeams = await storage.getTeamsByCreatedBy(req.user!.id);
      console.log(`[API getMyChurch] User ${req.user!.id} has ${userTeams.length} teams`);
      
      // Find any teams with church associations
      const teamsWithChurches = userTeams.filter(team => team.churchId !== null);
      console.log(`[API getMyChurch] Found ${teamsWithChurches.length} teams with church associations`);
      
      if (teamsWithChurches.length > 0) {
        // Get the church from the first team
        const firstTeamWithChurch = teamsWithChurches[0];
        
        if (firstTeamWithChurch.churchId) {
          const church = await storage.getChurch(firstTeamWithChurch.churchId);
          
          if (church) {
            console.log(`[API getMyChurch] Found associated church:`, church);
            return res.status(200).json(church);
          }
        }
      }
      
      console.log(`[API getMyChurch] No churches found for user ${req.user!.id}, not even through team associations`);
      return res.status(404).json({ message: "No church found" });
    } catch (error) {
      console.error("Get my church error:", error);
      return res.status(400).json({ message: "Failed to get church information" });
    }
  });
  
  // Get all churches for the current user - Used by members page
  app.get("/api/churches/my-churches", isAuthenticated, async (req, res) => {
    try {
      console.log(`[API getMyChurches] IMPORTANT: Request from user ${req.user!.id}, headers: ${JSON.stringify(req.headers['content-type'])}`);
      
      // Set Content-Type header explicitly before any processing
      res.setHeader('Content-Type', 'application/json');
      console.log(`[API getMyChurches] Set Content-Type header to application/json`);
      
      if (req.user!.role !== "teamleader") {
        console.log(`[API getMyChurches] User ${req.user!.id} is not a team leader`);
        return sendJsonResponse(res, 403, { message: "Only team leaders can access churches" });
      }
      
      // Get churches created by the current user
      const userCreatedChurches = await storage.getChurchesByCreatedBy(req.user!.id);
      console.log(`[API getMyChurches] Found ${userCreatedChurches.length} churches created by user ${req.user!.id}`);
      
      // If we found churches, return them
      if (userCreatedChurches.length > 0) {
        console.log(`[API getMyChurches] Returning ${userCreatedChurches.length} churches:`, 
          userCreatedChurches.map(c => ({ id: c.id, name: c.name, inviteCode: c.inviteCode }))
        );
        return sendJsonResponse(res, 200, userCreatedChurches);
      }
      
      // If no churches found, check for teams with church associations
      console.log(`[API getMyChurches] No churches found for user ${req.user!.id}, checking teams...`);
      
      // Get all teams created by the user
      const userTeams = await storage.getTeamsByCreatedBy(req.user!.id);
      console.log(`[API getMyChurches] User ${req.user!.id} has ${userTeams.length} teams`);
      
      // Find teams with church associations
      const teamsWithChurches = userTeams.filter(team => team.churchId !== null);
      console.log(`[API getMyChurches] Found ${teamsWithChurches.length} teams with church associations`);
      
      if (teamsWithChurches.length > 0) {
        // Get unique church IDs - convert Set to Array and filter out null values for type safety
        const churchIdsSet = new Set(teamsWithChurches.map(team => team.churchId));
        const churchIds = Array.from(churchIdsSet).filter((id): id is number => id !== null);
        console.log(`[API getMyChurches] Found unique church IDs: ${churchIds.join(", ")}`);
        
        // Get all unique churches
        const associatedChurches = [];
        for (const churchId of churchIds) {
          if (churchId !== null) {
            const church = await storage.getChurch(churchId);
            if (church) {
              console.log(`[API getMyChurches] Found associated church: ${church.id} (${church.name}) with inviteCode: ${church.inviteCode}`);
              associatedChurches.push(church);
            }
          }
        }
        
        console.log(`[API getMyChurches] Returning ${associatedChurches.length} associated churches`);
        return sendJsonResponse(res, 200, associatedChurches);
      }
      
      // No churches found at all
      console.log(`[API getMyChurches] No churches found for user ${req.user!.id} - returning empty array`);
      return sendJsonResponse(res, 200, []);
    } catch (error) {
      console.error("[API getMyChurches] Error:", error);
      return sendJsonResponse(res, 500, { message: "Failed to get churches" });
    }
  });
  
  // Generate invite code for a church
  app.post("/api/churches/:churchId/generate-invite-code", isAuthenticated, async (req, res) => {
    try {
      console.log(`[API generateChurchInviteCode] Request for church ID: ${req.params.churchId} by user ${req.user!.id}`);
      const churchId = parseInt(req.params.churchId);
      
      if (isNaN(churchId)) {
        console.log(`[API generateChurchInviteCode] Invalid church ID: ${req.params.churchId}`);
        return sendJsonResponse(res, 400, { message: "Invalid church ID" });
      }
      
      // Get the church to check if it exists and if the user has permission
      const church = await storage.getChurch(churchId);
      if (!church) {
        console.log(`[API generateChurchInviteCode] Church not found: ${churchId}`);
        return sendJsonResponse(res, 404, { message: "Church not found" });
      }
      
      // Only the church creator can generate an invite code
      if (church.createdById !== req.user!.id) {
        console.log(`[API generateChurchInviteCode] Permission denied: User ${req.user!.id} is not the creator of church ${churchId}`);
        return sendJsonResponse(res, 403, { message: "You must be the church creator to generate an invite code" });
      }
      
      // Generate a new invite code
      const inviteCode = storage.generateInviteCode();
      console.log(`[API generateChurchInviteCode] Generated new invite code: ${inviteCode} for church ${churchId}`);
      
      // Update the church with the new invite code
      const updatedChurch = await storage.updateChurch(churchId, { inviteCode });
      if (!updatedChurch) {
        console.log(`[API generateChurchInviteCode] Failed to update church ${churchId} with new invite code`);
        return sendJsonResponse(res, 500, { message: "Failed to update church with new invite code" });
      }
      
      console.log(`[API generateChurchInviteCode] Successfully updated church ${churchId} with invite code: ${inviteCode}`);
      return sendJsonResponse(res, 200, updatedChurch);
    } catch (error) {
      console.error(`[API generateChurchInviteCode] Error:`, error);
      return sendJsonResponse(res, 500, { message: "Failed to generate invite code" });
    }
  });
  
  // Get Church Dashboard Summary
  app.get("/api/churches/:churchId/dashboard", isAuthenticated, async (req, res) => {
    console.log("========== DASHBOARD ENDPOINT CALLED ==========");
    console.log(`Dashboard request for church ID: ${req.params.churchId} by user ${req.user!.id}`);
    try {
      console.log(`[API getChurchDashboard] Request for church ID: ${req.params.churchId} by user ${req.user!.id}`);
      const churchId = parseInt(req.params.churchId);
      
      if (isNaN(churchId)) {
        console.log(`[API getChurchDashboard] Invalid church ID: ${req.params.churchId}`);
        return res.status(400).json({ message: "Invalid church ID" });
      }
      
      console.log(`[API getChurchDashboard] Getting church with ID: ${churchId}`);
      const church = await storage.getChurch(churchId);
      
      if (!church) {
        console.log(`[API getChurchDashboard] Church not found with ID: ${churchId}`);
        return res.status(404).json({ message: "Church not found" });
      }
      
      console.log(`[API getChurchDashboard] Church found:`, church);
      
      // Check if user has permission (only the church creator can access the dashboard)
      if (church.createdById !== req.user!.id) {
        console.log(`[API getChurchDashboard] Permission denied: Church created by ${church.createdById}, requested by ${req.user!.id}`);
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      console.log(`[API getChurchDashboard] User ${req.user!.id} is the creator of church ${churchId}, allowing access`);
      
      // Get all teams in the church
      console.log(`[API getChurchDashboard] Getting teams for church ${churchId}`);
      const teams = await storage.getTeamsByChurchId(churchId);
      console.log(`[API getChurchDashboard] Found ${teams.length} teams for church ${churchId}:`, teams);
      
      // Get all users in the church
      console.log(`[API getChurchDashboard] Getting members for church ${churchId}`);
      const members = await storage.getUsersInChurch(churchId);
      console.log(`[API getChurchDashboard] Found ${members.length} members for church ${churchId}`);
      
      // Get church role scores
      console.log(`[API getChurchDashboard] Getting role scores for church ${churchId}`);
      const roleScores = await storage.getChurchRoleScores(churchId);
      console.log(`[API getChurchDashboard] Found ${roleScores.length} role scores for church ${churchId}`);
      
      // Calculate aggregated role scores (both total and average)
      const totalScores = {
        [ROLES.APOSTLE]: 0,
        [ROLES.PROPHET]: 0,
        [ROLES.EVANGELIST]: 0,
        [ROLES.HERDER]: 0,
        [ROLES.TEACHER]: 0
      };
      
      // Sum up all scores
      roleScores.forEach(score => {
        totalScores[ROLES.APOSTLE] += score.apostle;
        totalScores[ROLES.PROPHET] += score.prophet;
        totalScores[ROLES.EVANGELIST] += score.evangelist;
        totalScores[ROLES.HERDER] += score.herder;
        totalScores[ROLES.TEACHER] += score.teacher;
      });
      
      // Calculate average scores
      const averageScores = {
        [ROLES.APOSTLE]: 0,
        [ROLES.PROPHET]: 0,
        [ROLES.EVANGELIST]: 0,
        [ROLES.HERDER]: 0,
        [ROLES.TEACHER]: 0
      };
      
      // Only calculate averages if we have scores
      if (roleScores.length > 0) {
        averageScores[ROLES.APOSTLE] = parseFloat((totalScores[ROLES.APOSTLE] / roleScores.length).toFixed(2));
        averageScores[ROLES.PROPHET] = parseFloat((totalScores[ROLES.PROPHET] / roleScores.length).toFixed(2));
        averageScores[ROLES.EVANGELIST] = parseFloat((totalScores[ROLES.EVANGELIST] / roleScores.length).toFixed(2));
        averageScores[ROLES.HERDER] = parseFloat((totalScores[ROLES.HERDER] / roleScores.length).toFixed(2));
        averageScores[ROLES.TEACHER] = parseFloat((totalScores[ROLES.TEACHER] / roleScores.length).toFixed(2));
      }
      
      // For backward compatibility
      const aggregatedScores = totalScores;
      
      // Prepare team summaries
      console.log(`[API getChurchDashboard] Preparing team summaries for church ${churchId}`);
      const teamSummaries = await Promise.all(teams.map(async (team) => {
        console.log(`[API getChurchDashboard] Processing team ${team.id} (${team.name})`);
        const teamMembers = await storage.getUsersInTeam(team.id);
        
        // Get role scores for each member in this team
        const memberRoleScores = await Promise.all(
          teamMembers.map(async (member) => {
            return await storage.getRoleScoreByUserId(member.id);
          })
        );
        
        // Filter out null scores (members without profiles)
        const validRoleScores = memberRoleScores.filter(score => score !== undefined);
        
        console.log(`[API getChurchDashboard] Team ${team.id} has ${teamMembers.length} members, ${validRoleScores.length} have role scores`);
        
        // Calculate team role distribution
        const roleDistribution = {
          [ROLES.APOSTLE]: 0,
          [ROLES.PROPHET]: 0,
          [ROLES.EVANGELIST]: 0,
          [ROLES.HERDER]: 0,
          [ROLES.TEACHER]: 0
        };
        
        validRoleScores.forEach(score => {
          if (score) {
            roleDistribution[ROLES.APOSTLE] += score.apostle;
            roleDistribution[ROLES.PROPHET] += score.prophet;
            roleDistribution[ROLES.EVANGELIST] += score.evangelist;
            roleDistribution[ROLES.HERDER] += score.herder;
            roleDistribution[ROLES.TEACHER] += score.teacher;
          }
        });
        
        return {
          id: team.id,
          name: team.name,
          memberCount: teamMembers.length,
          roleDistribution
        };
      }));
      
      // Prepare church summary
      const churchSummary = {
        id: church.id,
        name: church.name,
        logoUrl: church.logoUrl,
        totalTeams: teams.length,
        totalMembers: members.length,
        denomination: church.denomination,
        location: church.location // Church already has a location field
      };
      
      console.log(`[API getChurchDashboard] Successfully prepared dashboard for church ${churchId}`);
      return sendJsonResponse(res, 200, {
        church: churchSummary,
        teams: teamSummaries,
        aggregatedScores,
        totalScores,
        averageScores
      });
    } catch (error) {
      console.error("[API getChurchDashboard] Error:", error);
      return sendJsonResponse(res, 400, { message: "Failed to get church dashboard data" });
    }
  });
  
  // Get Church Teams
  app.get("/api/churches/:churchId/teams", isAuthenticated, async (req, res) => {
    try {
      const churchId = parseInt(req.params.churchId);
      
      if (isNaN(churchId)) {
        return sendJsonResponse(res, 400, { message: "Invalid church ID" });
      }
      
      const church = await storage.getChurch(churchId);
      
      if (!church) {
        return sendJsonResponse(res, 404, { message: "Church not found" });
      }
      
      // Check if user has permission (is admin or creator)
      if (church.createdById !== req.user!.id) {
        // Check if the user has any teams in this church
        const userTeams = await storage.getTeamsByCreatedBy(req.user!.id);
        const userHasTeamInChurch = userTeams.some(team => team.churchId === churchId);
        
        if (!userHasTeamInChurch) {
          return sendJsonResponse(res, 403, { message: "Insufficient permissions" });
        }
      }
      
      // Get all teams in the church
      const teams = await storage.getTeamsByChurchId(churchId);
      
      return sendJsonResponse(res, 200, teams);
    } catch (error) {
      console.error("Get church teams error:", error);
      return sendJsonResponse(res, 400, { message: "Failed to get church teams" });
    }
  });
  
  // Get Church Members
  app.get("/api/churches/:churchId/members", isAuthenticated, async (req, res) => {
    try {
      const churchId = parseInt(req.params.churchId);
      
      if (isNaN(churchId)) {
        return sendJsonResponse(res, 400, { message: "Invalid church ID" });
      }
      
      const church = await storage.getChurch(churchId);
      
      if (!church) {
        return sendJsonResponse(res, 404, { message: "Church not found" });
      }
      
      // Check if user has permission (is admin or creator)
      if (church.createdById !== req.user!.id) {
        // Check if the user has any teams in this church
        const userTeams = await storage.getTeamsByCreatedBy(req.user!.id);
        const userHasTeamInChurch = userTeams.some(team => team.churchId === churchId);
        
        if (!userHasTeamInChurch) {
          return sendJsonResponse(res, 403, { message: "Insufficient permissions" });
        }
      }
      
      // Get all users in the church
      const users = await storage.getUsersInChurch(churchId);
      
      // Get profiles for all church members
      const churchMembers = await Promise.all(
        users.map(async (user) => {
          const roleScore = await storage.getRoleScoreByUserId(user.id);
          const { password, ...userWithoutPassword } = user;
          
          return {
            ...userWithoutPassword,
            profile: roleScore || null
          };
        })
      );
      
      return sendJsonResponse(res, 200, churchMembers);
    } catch (error) {
      console.error("Get church members error:", error);
      return sendJsonResponse(res, 400, { message: "Failed to get church members" });
    }
  });
  
  // Get Church Role Distribution
  app.get("/api/churches/:churchId/role-distribution", isAuthenticated, async (req, res) => {
    try {
      const churchId = parseInt(req.params.churchId);
      
      if (isNaN(churchId)) {
        return sendJsonResponse(res, 400, { message: "Invalid church ID" });
      }
      
      const church = await storage.getChurch(churchId);
      
      if (!church) {
        return sendJsonResponse(res, 404, { message: "Church not found" });
      }
      
      // Check if user has permission (is admin or creator)
      if (church.createdById !== req.user!.id) {
        // Check if the user has any teams in this church
        const userTeams = await storage.getTeamsByCreatedBy(req.user!.id);
        const userHasTeamInChurch = userTeams.some(team => team.churchId === churchId);
        
        if (!userHasTeamInChurch) {
          return sendJsonResponse(res, 403, { message: "Insufficient permissions" });
        }
      }
      
      // Get church role scores
      const roleScores = await storage.getChurchRoleScores(churchId);
      
      if (roleScores.length === 0) {
        return sendJsonResponse(res, 200, {
          [ROLES.APOSTLE]: 0,
          [ROLES.PROPHET]: 0,
          [ROLES.EVANGELIST]: 0,
          [ROLES.HERDER]: 0,
          [ROLES.TEACHER]: 0,
          total: 0,
          memberCount: 0
        });
      }
      
      // Calculate aggregated role scores
      const totals = {
        [ROLES.APOSTLE]: 0,
        [ROLES.PROPHET]: 0,
        [ROLES.EVANGELIST]: 0,
        [ROLES.HERDER]: 0,
        [ROLES.TEACHER]: 0
      };
      
      roleScores.forEach(score => {
        totals[ROLES.APOSTLE] += score.apostle;
        totals[ROLES.PROPHET] += score.prophet;
        totals[ROLES.EVANGELIST] += score.evangelist;
        totals[ROLES.HERDER] += score.herder;
        totals[ROLES.TEACHER] += score.teacher;
      });
      
      const memberCount = roleScores.length;
      const totalScore = Object.values(totals).reduce((sum, val) => sum + val, 0);
      
      return sendJsonResponse(res, 200, {
        ...totals,
        total: totalScore,
        memberCount
      });
    } catch (error) {
      console.error("Get church role distribution error:", error);
      return sendJsonResponse(res, 400, { message: "Failed to get church role distribution" });
    }
  });
  
  // Get Church Stats for the Church Profile page
  app.get("/api/churches/stats", isAuthenticated, async (req, res) => {
    try {
      const { churchId } = req.query;
      
      if (!churchId || isNaN(parseInt(churchId as string))) {
        return sendJsonResponse(res, 400, { message: "Valid church ID is required" });
      }
      
      const churchIdNum = parseInt(churchId as string);
      
      // Verify church exists
      const church = await storage.getChurch(churchIdNum);
      
      if (!church) {
        return sendJsonResponse(res, 404, { message: "Church not found" });
      }
      
      // Check if user has permission (is creator)
      if (church.createdById !== req.user!.id) {
        // Check if the user has any teams in this church
        const userTeams = await storage.getTeamsByCreatedBy(req.user!.id);
        const userHasTeamInChurch = userTeams.some(team => team.churchId === churchIdNum);
        
        if (!userHasTeamInChurch) {
          return sendJsonResponse(res, 403, { message: "Insufficient permissions" });
        }
      }
      
      // Get all teams in the church
      const teams = await storage.getTeamsByChurchId(churchIdNum);
      
      // Get all users in the church
      const members = await storage.getUsersInChurch(churchIdNum);
      
      // Get church role scores
      const roleScores = await storage.getChurchRoleScores(churchIdNum);
      
      // Calculate aggregated role scores
      const aggregatedRoleScores = {
        [ROLES.APOSTLE]: 0,
        [ROLES.PROPHET]: 0,
        [ROLES.EVANGELIST]: 0,
        [ROLES.HERDER]: 0,
        [ROLES.TEACHER]: 0
      };
      
      roleScores.forEach(score => {
        aggregatedRoleScores[ROLES.APOSTLE] += score.apostle;
        aggregatedRoleScores[ROLES.PROPHET] += score.prophet;
        aggregatedRoleScores[ROLES.EVANGELIST] += score.evangelist;
        aggregatedRoleScores[ROLES.HERDER] += score.herder;
        aggregatedRoleScores[ROLES.TEACHER] += score.teacher;
      });
      
      return sendJsonResponse(res, 200, {
        totalMembers: members.length,
        totalTeams: teams.length,
        aggregatedRoleScores
      });
    } catch (error) {
      console.error("Get church stats error:", error);
      return sendJsonResponse(res, 400, { message: "Failed to get church statistics" });
    }
  });

  // User profile routes
  app.patch("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { firstName, lastName, country, city, currentSector, preferredSector, referralSource } = req.body;
      
      // Update user profile
      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(), // Update the full name field
        country,
        city,
        currentSector,
        preferredSector,
        referralSource
      });
      
      return res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Update profile error:", error);
      return res.status(500).json({ message: "Failed to update profile" });
    }
  });
  
  // Setup file upload routes
  app.post("/api/upload/profile", isAuthenticated, upload.single('image'), handleMulterError, uploadProfileImage);
  app.post("/api/upload/church/:churchId/logo", isAuthenticated, upload.single('image'), handleMulterError, uploadChurchLogo);
  
  // Set up static file serving for uploads
  setupUploadsRoutes(app);
  
  // Get all members of a church
  app.get("/api/churches/:churchId/members", isAuthenticated, async (req, res) => {
    try {
      console.log(`[API getChurchMembers] Request for church members for church ID: ${req.params.churchId}`);
      
      const churchId = parseInt(req.params.churchId);
      
      // Check if user has access to this church (is creator or member of a team in this church)
      const userChurches = await storage.getChurchesByCreatedBy(req.user!.id);
      const userHasAccess = userChurches.some(church => church.id === churchId);
      
      if (!userHasAccess) {
        return sendJsonResponse(res, 403, { message: "You do not have access to this church's members" });
      }
      
      // Get all members (users) in this church
      const members = await storage.getUsersInChurch(churchId);
      console.log(`[API getChurchMembers] Found ${members.length} members for church ${churchId}`);
      
      // Get teams in this church for team name lookups
      const teamsInChurch = await storage.getTeamsByChurchId(churchId);
      const teamsMap = new Map(teamsInChurch.map(team => [team.id, team]));
      
      // Format member data with team and profile status
      const formattedMembers = await Promise.all(members.map(async member => {
        // Get role score to determine if profile is complete
        const roleScore = await storage.getRoleScoreByUserId(member.id);
        const hasProfile = !!roleScore;
        
        // Get team name if applicable
        const teamName = member.teamId && teamsMap.has(member.teamId) 
          ? teamsMap.get(member.teamId)?.name 
          : null;
        
        return {
          id: member.id,
          name: member.name || member.firstName && member.lastName ? `${member.firstName} ${member.lastName}`.trim() : null,
          email: member.email,
          teamId: member.teamId,
          teamName,
          role: member.role || "user",
          hasProfile,
          currentSector: member.currentSector,
          preferredSector: member.preferredSector
        };
      }));
      
      return sendJsonResponse(res, 200, formattedMembers);
    } catch (error) {
      console.error("[API getChurchMembers] Error:", error);
      return sendJsonResponse(res, 500, { message: "Error fetching church members" });
    }
  });
  
  // Get all teams of a church
  app.get("/api/churches/:churchId/teams", isAuthenticated, async (req, res) => {
    try {
      console.log(`[API getChurchTeams] Request for church teams for church ID: ${req.params.churchId}`);
      
      const churchId = parseInt(req.params.churchId);
      
      // Check if user has access to this church (is creator or member of a team in this church)
      const userChurches = await storage.getChurchesByCreatedBy(req.user!.id);
      const userHasAccess = userChurches.some(church => church.id === churchId);
      
      if (!userHasAccess) {
        return sendJsonResponse(res, 403, { message: "You do not have access to this church's teams" });
      }
      
      // Get teams in this church
      const teamsInChurch = await storage.getTeamsByChurchId(churchId);
      
      // Format team data with member counts
      const formattedTeams = await Promise.all(teamsInChurch.map(async team => {
        // Get member count
        const teamMembers = await storage.getUsersInTeam(team.id);
        
        return {
          id: team.id,
          name: team.name,
          memberCount: teamMembers.length
        };
      }));
      
      return sendJsonResponse(res, 200, formattedTeams);
    } catch (error) {
      console.error("[API getChurchTeams] Error:", error);
      return sendJsonResponse(res, 500, { message: "Error fetching church teams" });
    }
  });
  
  // Get church invite code
  app.get("/api/churches/:churchId/invite", isAuthenticated, async (req, res) => {
    try {
      console.log(`[API getChurchInviteCode] Request for church invite code for church ID: ${req.params.churchId}`);
      
      const churchId = parseInt(req.params.churchId);
      
      // Check if user has access to this church (is creator)
      const userChurches = await storage.getChurchesByCreatedBy(req.user!.id);
      const userHasAccess = userChurches.some(church => church.id === churchId);
      
      if (!userHasAccess) {
        return sendJsonResponse(res, 403, { message: "You do not have permission to get invite codes for this church" });
      }
      
      // Get the church
      const church = await storage.getChurch(churchId);
      
      if (!church) {
        return sendJsonResponse(res, 404, { message: "Church not found" });
      }
      
      // Generate or retrieve invite code
      let inviteCode = church.inviteCode;
      
      if (!inviteCode) {
        // Generate a new invite code
        inviteCode = storage.generateInviteCode();
        
        // Update the church with the new invite code
        await storage.updateChurch(churchId, { inviteCode });
      }
      
      return sendJsonResponse(res, 200, { inviteCode });
    } catch (error) {
      console.error("[API getChurchInviteCode] Error:", error);
      return sendJsonResponse(res, 500, { message: "Error fetching church invite code" });
    }
  });
  
  // Get church members
  app.get("/api/churches/:churchId/members", isAuthenticated, async (req, res) => {
    try {
      console.log(`[API getChurchMembers] Request for members of church ID: ${req.params.churchId}`);
      
      const churchId = parseInt(req.params.churchId);
      
      // Verify the church exists
      const church = await storage.getChurch(churchId);
      if (!church) {
        console.log(`[API getChurchMembers] Church not found with ID: ${churchId}`);
        return res.status(404).json({ message: "Church not found" });
      }
      
      console.log(`[API getChurchMembers] Found church: ${church.name} (${church.id})`);
      console.log(`[API getChurchMembers] Church invite code: ${church.inviteCode || 'undefined'}`);
      
      // Check if user has access (is creator of church or a team leader)
      const isCreator = church.createdById === req.user!.id;
      const isTeamLeader = req.user!.role === "teamleader";
      
      console.log(`[API getChurchMembers] User ${req.user!.id} access check - isCreator: ${isCreator}, isTeamLeader: ${isTeamLeader}`);
      
      if (!isCreator && !isTeamLeader) {
        return res.status(403).json({ message: "Access denied: Only church administrators can view members" });
      }
      
      // Get all members of the church
      const churchMembers = await storage.getUsersInChurch(churchId);
      console.log(`[API getChurchMembers] Found ${churchMembers.length} members in church ID: ${churchId}`);
      
      // Get role scores for all members
      const userIds = churchMembers.map(user => user.id);
      const allRoleScoresPromises = userIds.map(userId => storage.getRoleScoreByUserId(userId));
      const allRoleScores = await Promise.all(allRoleScoresPromises);
      
      // Combine users with their role scores
      const membersWithRoles = churchMembers.map(member => {
        const roleScore = allRoleScores.find(score => score?.userId === member.id);
        if (!roleScore) return member;
        
        // Calculate primary and secondary roles
        const scores = {
          apostle: roleScore.apostle || 0,
          prophet: roleScore.prophet || 0, 
          evangelist: roleScore.evangelist || 0,
          shepherd: roleScore.herder || 0, // Note: herder in DB, but we use shepherd in the UI
          teacher: roleScore.teacher || 0
        };
        
        // Find the highest and second highest scores
        const roleEntries = Object.entries(scores) as [string, number][];
        roleEntries.sort((a, b) => b[1] - a[1]);
        
        const primaryRole = roleEntries[0][1] > 0 ? roleEntries[0][0] : undefined;
        const secondaryRole = 
          roleEntries.length > 1 && 
          roleEntries[1][1] > 0 && 
          roleEntries[1][1] < roleEntries[0][1] 
            ? roleEntries[1][0] 
            : undefined;
        
        // Return member with role scores
        return {
          ...member,
          roleScores: {
            ...scores,
            primaryRole,
            secondaryRole
          }
        };
      });
      
      return res.status(200).json(membersWithRoles);
    } catch (error) {
      console.error("[API getChurchMembers] Error:", error);
      return res.status(500).json({ message: "Error getting church members" });
    }
  });
  
  // Invite a user to join a church
  app.post("/api/churches/:churchId/invite", isAuthenticated, async (req, res) => {
    try {
      console.log(`[API inviteToChurch] Request to invite user to church ID: ${req.params.churchId}`);
      
      const churchId = parseInt(req.params.churchId);
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Verify the church exists
      const church = await storage.getChurch(churchId);
      if (!church) {
        return res.status(404).json({ message: "Church not found" });
      }
      
      // Verify user is the church admin
      if (church.createdById !== req.user!.id) {
        return res.status(403).json({ message: "Only church administrators can send invites" });
      }
      
      // Generate an invite code if the church doesn't have one
      let inviteCode = church.inviteCode;
      if (!inviteCode) {
        inviteCode = storage.generateInviteCode();
        await storage.updateChurch(churchId, { inviteCode });
      }
      
      // TODO: Send email invitation with the church invite code
      // For now, just return success message
      console.log(`[API inviteToChurch] Invitation to ${email} for church ID: ${churchId} with code: ${inviteCode}`);
      
      return res.status(200).json({ 
        message: "Invitation sent",
        inviteCode
      });
    } catch (error) {
      console.error("[API inviteToChurch] Error:", error);
      return res.status(500).json({ message: "Error sending church invitation" });
    }
  });
  
  // Add a user directly to a church
  app.post("/api/churches/:churchId/add-user", isAuthenticated, async (req, res) => {
    try {
      console.log(`[API addUserToChurch] Request to add user to church ID: ${req.params.churchId}`);
      
      const churchId = parseInt(req.params.churchId);
      const userData = req.body;
      
      // Verify the church exists
      const church = await storage.getChurch(churchId);
      if (!church) {
        return res.status(404).json({ message: "Church not found" });
      }
      
      // Verify user is the church admin
      if (church.createdById !== req.user!.id) {
        return res.status(403).json({ message: "Only church administrators can add members" });
      }
      
      // Check if user with this email already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      // Create the new user with the church ID
      const newUser = await storage.createUser({
        ...userData,
        name: `${userData.firstName} ${userData.lastName}`,
        username: null,
        churchId,
        profileImageUrl: null,
        birthDate: null,
        country: null,
        city: null,
        currentSector: null,
        preferredSector: null,
        referralSource: null
      });
      
      console.log(`[API addUserToChurch] Created user ID: ${newUser.id} for church ID: ${churchId}`);
      
      return res.status(201).json(newUser);
    } catch (error) {
      console.error("[API addUserToChurch] Error:", error);
      return res.status(500).json({ message: "Error adding church member" });
    }
  });
  
  // Remove a user from a church
  app.delete("/api/churches/:churchId/members/:userId", isAuthenticated, async (req, res) => {
    try {
      console.log(`[API removeUserFromChurch] Request to remove user ID: ${req.params.userId} from church ID: ${req.params.churchId}`);
      
      const churchId = parseInt(req.params.churchId);
      const userId = parseInt(req.params.userId);
      
      // Verify the church exists
      const church = await storage.getChurch(churchId);
      if (!church) {
        return res.status(404).json({ message: "Church not found" });
      }
      
      // Verify user is the church admin
      if (church.createdById !== req.user!.id) {
        return res.status(403).json({ message: "Only church administrators can remove members" });
      }
      
      // Verify the member exists
      const member = await storage.getUser(userId);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      // Update the user to remove the church association
      const updatedUser = await storage.updateUser(userId, { churchId: null });
      
      console.log(`[API removeUserFromChurch] Removed user ID: ${userId} from church ID: ${churchId}`);
      
      return res.status(200).json({ message: "Member removed from church", user: updatedUser });
    } catch (error) {
      console.error("[API removeUserFromChurch] Error:", error);
      return res.status(500).json({ message: "Error removing church member" });
    }
  });
  
  // Add member to a team
  app.post("/api/teams/:teamId/add-member", isAuthenticated, async (req, res) => {
    try {
      console.log(`[API addMemberToTeam] Request to add member to team ID: ${req.params.teamId}`);
      
      const teamId = parseInt(req.params.teamId);
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Check if user has access to this team (is creator)
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      if (team.createdById !== req.user!.id) {
        return res.status(403).json({ message: "You do not have permission to add members to this team" });
      }
      
      // Add the user to the team
      const updatedUser = await storage.joinTeam(userId, teamId);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User added to team successfully", user: updatedUser });
    } catch (error) {
      console.error("[API addMemberToTeam] Error:", error);
      res.status(500).json({ message: "Error adding member to team" });
    }
  });
  
  // Add existing member to a team by userId (for church admin)
  app.post("/api/teams/:teamId/members/:userId", isAuthenticated, async (req, res) => {
    try {
      console.log(`[API addExistingMemberToTeam] Request to add user ${req.params.userId} to team ${req.params.teamId}`);
      
      const teamId = parseInt(req.params.teamId);
      const userId = parseInt(req.params.userId);
      
      if (isNaN(teamId) || isNaN(userId)) {
        return sendJsonResponse(res, 400, { message: "Invalid team ID or user ID" });
      }
      
      // Check if team exists
      const team = await storage.getTeam(teamId);
      if (!team) {
        return sendJsonResponse(res, 404, { message: "Team not found" });
      }
      
      // Check if team belongs to a church
      if (!team.churchId) {
        return sendJsonResponse(res, 400, { message: "This team is not associated with a church" });
      }
      
      // Check if user has admin access to the church
      const userChurches = await storage.getChurchesByCreatedBy(req.user!.id);
      const hasAccess = userChurches.some(church => church.id === team.churchId);
      
      if (!hasAccess) {
        return sendJsonResponse(res, 403, { message: "You do not have permission to manage members of this church" });
      }
      
      // Check if user exists
      const userToAdd = await storage.getUser(userId);
      if (!userToAdd) {
        return sendJsonResponse(res, 404, { message: "User not found" });
      }
      
      // Add the user to the team
      const updatedUser = await storage.joinTeam(userId, teamId);
      
      if (!updatedUser) {
        return sendJsonResponse(res, 500, { message: "Failed to add user to team" });
      }
      
      return sendJsonResponse(res, 200, { 
        message: "User successfully added to team", 
        user: updatedUser 
      });
    } catch (error) {
      console.error("[API addExistingMemberToTeam] Error:", error);
      return sendJsonResponse(res, 500, { message: "Error adding member to team" });
    }
  });
  
  // Join church with invite code
  app.post("/api/churches/join/:inviteCode", isAuthenticated, async (req, res) => {
    try {
      console.log(`[API joinChurch] User ${req.user!.id} attempting to join church with invite code ${req.params.inviteCode}`);
      
      const inviteCode = req.params.inviteCode;
      
      // Validate invite code
      if (!inviteCode) {
        return res.status(400).json({ 
          message: "Uitnodigingscode is vereist", 
          errorCode: "MISSING_INVITE_CODE" 
        });
      }
      
      // Ensure database connection is active
      const connectionStatus = await ensureConnection();
      if (!connectionStatus) {
        console.error("[API joinChurch] Database connection error");
        return res.status(503).json({ 
          message: "Database verbindingsprobleem. Probeer het later opnieuw.", 
          errorCode: "DATABASE_CONNECTION_ERROR" 
        });
      }
      
      // Find the church with this invite code using the dedicated method
      let church;
      try {
        church = await storage.getChurchByInviteCode(inviteCode);
      } catch (dbError) {
        console.error(`[API joinChurch] Database error finding church with invite code:`, dbError);
        return res.status(500).json({ 
          message: "Er is een fout opgetreden bij het zoeken naar de kerk. Probeer het later opnieuw.",
          errorCode: "CHURCH_LOOKUP_ERROR"
        });
      }
      
      if (!church) {
        console.error(`[API joinChurch] Church not found with invite code: ${inviteCode}`);
        return res.status(404).json({ 
          message: "Ongeldige uitnodigingscode of kerk niet gevonden. Controleer de code en probeer opnieuw.", 
          errorCode: "INVALID_INVITE_CODE" 
        });
      }
      
      console.log(`[API joinChurch] Found church ${church.id} (${church.name}) for invite code ${inviteCode}`);
      
      // Check if user is already a member of this church
      if (req.user!.churchId === church.id) {
        console.log(`[API joinChurch] User ${req.user!.id} is already a member of church ${church.id}`);
        return res.status(409).json({ 
          message: "Je bent al lid van deze kerk", 
          errorCode: "ALREADY_CHURCH_MEMBER",
          church: {
            id: church.id,
            name: church.name
          }
        });
      }
      
      // Get the user before joining to do additional checks
      let user;
      try {
        user = await storage.getUser(req.user!.id);
        if (!user) {
          console.error(`[API joinChurch] User ${req.user!.id} not found`);
          return res.status(404).json({ 
            message: "Gebruiker niet gevonden", 
            errorCode: "USER_NOT_FOUND" 
          });
        }
      } catch (userError) {
        console.error(`[API joinChurch] Error fetching user:`, userError);
        return res.status(500).json({ 
          message: "Er is een fout opgetreden bij het ophalen van gebruikersgegevens", 
          errorCode: "USER_LOOKUP_ERROR" 
        });
      }
      
      // Check if the user already has a team in this church
      let userTeamInChurch = null;
      if (user.teamId) {
        try {
          const team = await storage.getTeam(user.teamId);
          if (team && team.churchId === church.id) {
            userTeamInChurch = team;
            console.log(`[API joinChurch] User ${req.user!.id} already belongs to team ${team.id} in church ${church.id}`);
          }
        } catch (teamError) {
          console.error(`[API joinChurch] Error checking team membership:`, teamError);
          // Non-critical error, continue anyway
        }
      }
      
      // Use the dedicated method to join the church
      let updatedUser;
      try {
        updatedUser = await storage.joinChurch(req.user!.id, church.id);
      } catch (joinError) {
        console.error(`[API joinChurch] Error joining church:`, joinError);
        return res.status(500).json({ 
          message: "Er is een fout opgetreden bij het lid worden van de kerk. Probeer het later opnieuw.",
          errorCode: "JOIN_CHURCH_ERROR"
        });
      }
      
      if (!updatedUser) {
        console.error(`[API joinChurch] Failed to join church ${church.id} for user ${req.user!.id}`);
        return res.status(500).json({ 
          message: "Gebruiker niet gevonden of kon geen lid worden van de kerk",
          errorCode: "JOIN_CHURCH_FAILED" 
        });
      }
      
      // Simple response data, we don't expose teams to members
      const responseData: any = {
        message: "Je bent succesvol lid geworden van de kerk", 
        churchId: church.id,
        churchName: church.name
      };
      
      // If the user is already part of a team in this church, include that info in logs only
      if (userTeamInChurch) {
        console.log(`[API joinChurch] User ${req.user!.id} is already part of team ${userTeamInChurch.id} (${userTeamInChurch.name}) in this church`);
      } else {
        console.log(`[API joinChurch] User ${req.user!.id} joined church ${church.id} but is not part of any team yet`);
        // Team assignment is the responsibility of team leaders, not members
      }
      
      res.json(responseData);
    } catch (error) {
      console.error("[API joinChurch] Error:", error);
      res.status(500).json({ 
        message: "Er is een fout opgetreden bij het lid worden van de kerk",
        errorCode: "SERVER_ERROR",
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}