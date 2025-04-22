// sessions.ts (or wherever you handle session middleware)

import session from "express-session";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";

// Create Redis client using your env var
const redisClient = createClient({
  url: process.env.REDIS_URL,
  legacyMode: true, // needed for connect-redis compatibility
});

redisClient.connect().catch(console.error);

export const sessionMiddleware = session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.REDIS_SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production", // true if using HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
});
