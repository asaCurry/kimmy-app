import { Hono } from "hono";
import { createRequestHandler } from "react-router";

const app = new Hono();

// Handle Chrome DevTools well-known route to prevent console errors
app.get("/.well-known/appspecific/com.chrome.devtools.json", (c) => {
  return c.json({ message: "Chrome DevTools integration not available" }, 404);
});

// React Router handles all other routes
app.all("*", (c) => {
  const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE,
  );

  return requestHandler(c.req.raw, {
    cloudflare: { env: c.env, ctx: c.executionCtx },
  });
});

export default app;
