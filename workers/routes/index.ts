import { Hono } from "hono";
import { createSuccessResponse } from "../utils/api-helpers";

const apiRouter = new Hono();

// Health check endpoint
apiRouter.get("/health", (c) => {
  return createSuccessResponse(c, {
    message: "API is running",
    version: "1.0.0"
  });
});

export { apiRouter };
