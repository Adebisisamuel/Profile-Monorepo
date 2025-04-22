import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Determine if we're running in a secure environment
  const isSecureEnvironment = process.env.NODE_ENV === "production" || !!process.env.REPLIT_CLUSTER;
  
  // Configure session settings with correct cookie options for Replit
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "bedieningenprofiel-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      sameSite: "lax", // Using lax instead of none for better compatibility
      secure: isSecureEnvironment
    },
    // Add error handling for sessi store
    unset: 'destroy',
    rolling: true
  };
  
  // Add retry logic for session store errors
  if (storage.sessionStore) {
    storage.sessionStore.on('error', function(error) {
      console.error('Session store error:', error);
      // Don't crash the application on session store errors
    });
  }

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    }, async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);

        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Registration
  app.post("/api/register", async (req, res, next) => {
    try {
      // Extend the insert schema for registration validation
      const registerSchema = z.object({
        firstName: z.string().min(2, "Voornaam moet ten minste 2 tekens bevatten"),
        lastName: z.string().min(2, "Achternaam moet ten minste 2 tekens bevatten"),
        name: z.string().optional(), // Will be set based on firstName + lastName if not provided
        email: z.string().email("Ongeldig e-mailadres"),
        password: z.string().min(6, "Wachtwoord moet ten minste 6 tekens bevatten"),
        birthDate: z.string().optional().nullable(),
        country: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        currentSector: z.string().optional().nullable(),
        preferredSector: z.string().optional().nullable(),
        referralSource: z.string().optional().nullable(),
        role: z.enum(["user", "teamleader"]).default("user"),
        teamId: z.number().optional().nullable(),
        inviteCode: z.string().optional() // Used when joining a team during registration
      }).transform(data => {
        // Ensure name is always set
        return {
          ...data,
          name: data.name || `${data.firstName} ${data.lastName}`
        };
      });

      // Validate input
      let validatedData = registerSchema.parse(req.body);

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "E-mailadres bestaat al" });
      }

      // Username has been completely removed from registration process

      // If invite code is provided, get the team ID
      if (validatedData.inviteCode) {
        console.log(`Processing registration with invite code: ${validatedData.inviteCode}`);
        const team = await storage.getTeamByInviteCode(validatedData.inviteCode);
        if (team) {
          console.log(`Found team ${team.id} (${team.name}) for invite code ${validatedData.inviteCode}`);
          validatedData.teamId = team.id;
        } else {
          console.log(`No team found for invite code: ${validatedData.inviteCode}`);
        }
      }

      // Create user with hashed password
      const user = await storage.createUser({
        ...validatedData,
        username: validatedData.email, // Set username to be the same as email (legacy field)
        password: await hashPassword(validatedData.password),
        createdAt: new Date().toISOString()
      });

      // If user has a teamId from invite code, explicitly join them to the team
      if (validatedData.teamId) {
        console.log(`Joining newly registered user ${user.id} to team ${validatedData.teamId}`);
        try {
          // Use the joinTeam method instead of direct update to ensure proper team association
          const updatedUser = await storage.joinTeam(user.id, validatedData.teamId);
          
          if (updatedUser) {
            console.log(`Successfully joined user ${user.id} to team ${validatedData.teamId}`);
            // Update the user reference with the latest data
            Object.assign(user, updatedUser);
          } else {
            console.error(`Failed to join user ${user.id} to team ${validatedData.teamId}`);
          }
        } catch (joinError) {
          console.error('Error joining team during registration:', joinError);
          // Continue with login even if team joining fails
        }
      }

      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        // Return user data without password
        const { password, ...userData } = user;
        res.status(201).json(userData);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validatiefout", errors: error.errors });
      }
      next(error);
    }
  });

  // Login
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Ongeldig e-mailadres of wachtwoord" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        // Return user data without password
        const { password, ...userData } = user;
        return res.json(userData);
      });
    })(req, res, next);
  });

  // Logout
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      console.log("[API user] User not authenticated");
      return res.status(401).json({ message: "Niet geauthenticeerd" });
    }
    
    console.log("[API user] User authenticated:", req.user?.id);
    // Return user data without password
    const { password, ...userData } = req.user;
    res.json(userData);
  });
  
  // Add debug endpoint
  app.get("/api/debug/auth", (req, res) => {
    console.log("[API debug/auth] Session:", req.session);
    console.log("[API debug/auth] isAuthenticated:", req.isAuthenticated());
    console.log("[API debug/auth] User:", req.user);
    
    res.json({
      authenticated: req.isAuthenticated(),
      sessionID: req.sessionID,
      user: req.user ? {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        name: req.user.name
      } : null
    });
  });
}
