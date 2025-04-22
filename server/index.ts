import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth } from "./auth";
import { sessionMiddleware } from "./session";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//redis stuff
app.use(sessionMiddleware);

// Cache-Control middleware to enhance API response caching
app.use((req, res, next) => {
  // Only apply to GET requests to API endpoints
  if (req.method === "GET" && req.path.startsWith("/api")) {
    // Apply different cache settings based on resource type
    if (req.path.includes("/teams") && req.path.includes("/members")) {
      // Team members data - moderate caching (2 minutes)
      res.set("Cache-Control", "public, max-age=120");
    } else if (req.path.includes("/teams") || req.path.includes("/churches")) {
      // Team and church data - moderate caching (5 minutes)
      res.set("Cache-Control", "public, max-age=300");
    } else if (req.path.includes("/user")) {
      // User data - shorter cache (1 minute)
      res.set("Cache-Control", "private, max-age=60");
    } else {
      // Other API resources - default caching (10 minutes)
      res.set("Cache-Control", "public, max-age=600");
    }

    // Enable automatic ETag generation
    res.set("ETag", "enable");
  }

  next();
});

// Response logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Setup authentication
  setupAuth(app);

  // Register API routes
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();
