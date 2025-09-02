import { vi } from "vitest";

// Mock utility functions
export const mockIsDatabaseAvailable = vi.fn(env => {
  return env && env.DB;
});

export const mockParseCookies = vi.fn((cookieHeader: string | null) => {
  if (!cookieHeader) return {};

  return cookieHeader.split(";").reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, string>
  );
});
