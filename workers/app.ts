import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import {
  handleCorsRequest,
  addSecurityHeaders,
  type SecurityHeadersConfig,
} from "../app/lib/security-headers";
import { processInsightsRequests } from "../app/lib/insights-processor";
import {
  createBotProtectionMiddleware,
  handleRobotsTxt,
  type BotProtectionConfig,
} from "../app/lib/bot-protection";

type ExportedHandlerScheduledHandler = (
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext
) => Promise<void>;

const app = new Hono();

// Security configuration
const securityConfig: SecurityHeadersConfig = {
  corsOrigins: [
    "https://kimmy-app.workers.dev",
    "https://kimmy-app.com", // Add your production domain here
  ],
  isDevelopment: import.meta.env.MODE === "development",
};

// Bot protection configuration
const botProtectionConfig: BotProtectionConfig = {
  enabled: true,
  logBlocked: true,
  rateLimitEnabled: true,
  customBlockedPaths: [
    "/env",
    "/.env.local",
    "/.env.production",
    "/config.json",
    "/package.json",
  ],
  whitelist: [
    // Add your monitoring service IPs here if needed
  ],
};

// Create bot protection middleware
const botProtection = createBotProtectionMiddleware(botProtectionConfig);

// Handle robots.txt specifically
app.get("/robots.txt", c => {
  return handleRobotsTxt();
});

// Handle Chrome DevTools well-known route to prevent console errors
app.get("/.well-known/appspecific/com.chrome.devtools.json", c => {
  return c.json({ message: "Chrome DevTools integration not available" }, 404);
});

// Security middleware
app.use("*", async (c, next) => {
  // Bot protection first
  const botResponse = await botProtection(c.req.raw, c.env);
  if (botResponse) {
    return botResponse;
  }

  // Handle CORS preflight requests
  const corsResponse = handleCorsRequest(c.req.raw, securityConfig);
  if (corsResponse) {
    return corsResponse;
  }

  await next();

  // Add security headers to all responses
  const response = c.res;
  return addSecurityHeaders(response, securityConfig);
});

// React Router handles all other routes
app.all("*", c => {
  const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE
  );

  return requestHandler(c.req.raw, {
    cloudflare: { env: c.env, ctx: c.executionCtx },
  });
});

// Scheduled worker for processing insights requests
export const scheduled: ExportedHandlerScheduledHandler = async (
  event,
  env,
  ctx
) => {
  try {
    console.log("Processing scheduled insights requests...");
    await processInsightsRequests(env);
    console.log("Insights processing completed");
  } catch (error) {
    console.error("Error in scheduled insights processing:", error);
  }
};

export default app;
