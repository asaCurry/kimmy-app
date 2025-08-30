import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import { handleCorsRequest, addSecurityHeaders, type SecurityHeadersConfig } from "../app/lib/security-headers";

const app = new Hono();

// Security configuration
const securityConfig: SecurityHeadersConfig = {
  corsOrigins: [
    'https://kimmy-app.workers.dev',
    'https://kimmy-app.com' // Add your production domain here
  ],
  isDevelopment: import.meta.env.MODE === 'development'
};

// Handle Chrome DevTools well-known route to prevent console errors
app.get("/.well-known/appspecific/com.chrome.devtools.json", c => {
  return c.json({ message: "Chrome DevTools integration not available" }, 404);
});

// Security middleware
app.use("*", async (c, next) => {
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

export default app;
