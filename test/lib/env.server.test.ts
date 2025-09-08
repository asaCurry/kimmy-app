import { describe, it, expect } from "vitest";
import { validateEnv, getValidatedEnv } from "~/lib/env.server";

describe("Environment Validation", () => {
  describe("validateEnv", () => {
    it("should validate correct environment", () => {
      const validEnv = {
        DB: { mock: "database" },
        SESSION_SECRET: "a-very-long-secret-that-meets-minimum-requirements",
        ENVIRONMENT: "development",
        RESEND_API_KEY: "test-key",
      };

      const result = validateEnv(validEnv);

      expect(result).toEqual({
        DB: { mock: "database" },
        SESSION_SECRET: "a-very-long-secret-that-meets-minimum-requirements",
        ENVIRONMENT: "development",
        RESEND_API_KEY: "test-key",
        RATE_LIMIT_KV: undefined,
      });
    });

    it("should use default environment when not specified", () => {
      const validEnv = {
        DB: { mock: "database" },
        SESSION_SECRET: "a-very-long-secret-that-meets-minimum-requirements",
      };

      const result = validateEnv(validEnv);

      expect(result.ENVIRONMENT).toBe("development");
    });

    it("should reject short SESSION_SECRET", () => {
      const invalidEnv = {
        DB: { mock: "database" },
        SESSION_SECRET: "short", // Too short
        ENVIRONMENT: "development",
      };

      expect(() => validateEnv(invalidEnv)).toThrow(
        "Environment validation failed: SESSION_SECRET: SESSION_SECRET must be at least 32 characters"
      );
    });

    it("should reject invalid ENVIRONMENT values", () => {
      const invalidEnv = {
        DB: { mock: "database" },
        SESSION_SECRET: "a-very-long-secret-that-meets-minimum-requirements",
        ENVIRONMENT: "invalid-env",
      };

      expect(() => validateEnv(invalidEnv)).toThrow(
        "Environment validation failed: ENVIRONMENT: Invalid enum value"
      );
    });

    it("should allow missing optional fields", () => {
      const minimalEnv = {
        DB: { mock: "database" },
        SESSION_SECRET: "a-very-long-secret-that-meets-minimum-requirements",
      };

      const result = validateEnv(minimalEnv);

      expect(result.RATE_LIMIT_KV).toBeUndefined();
      expect(result.RESEND_API_KEY).toBeUndefined();
    });

    it("should provide clear error messages for multiple issues", () => {
      const invalidEnv = {
        // Missing DB
        SESSION_SECRET: "short", // Too short
        ENVIRONMENT: "invalid", // Invalid enum
      };

      expect(() => validateEnv(invalidEnv)).toThrow(
        "Environment validation failed:"
      );
    });
  });

  describe("getValidatedEnv", () => {
    it("should extract and validate environment from context", () => {
      const context = {
        cloudflare: {
          env: {
            DB: { mock: "database" },
            SESSION_SECRET:
              "a-very-long-secret-that-meets-minimum-requirements",
            ENVIRONMENT: "production",
          },
        },
      };

      const result = getValidatedEnv(context);

      expect(result).toEqual({
        DB: { mock: "database" },
        SESSION_SECRET: "a-very-long-secret-that-meets-minimum-requirements",
        ENVIRONMENT: "production",
        RATE_LIMIT_KV: undefined,
        RESEND_API_KEY: undefined,
      });
    });

    it("should handle missing context gracefully", () => {
      expect(() => getValidatedEnv(null)).toThrow(
        "Environment validation failed:"
      );
    });

    it("should handle missing cloudflare property", () => {
      const context = {
        someOtherProperty: "value",
      };

      expect(() => getValidatedEnv(context)).toThrow(
        "Environment validation failed:"
      );
    });
  });
});
