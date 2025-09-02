import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createSecureToken,
  verifySecureToken,
  createSessionCookie,
  parseSessionCookie,
  createClearSessionCookie,
  extractSecureSession,
  type SecureSessionData,
  type SessionConfig,
} from "~/lib/secure-session";

describe("Secure Session", () => {
  const mockSecret = "test-secret-key-for-testing-only-32-chars";
  const mockSessionData = {
    userId: 123,
    email: "test@example.com",
    name: "Test User",
    currentHouseholdId: "household-123",
    role: "admin" as const,
  };

  const defaultConfig: SessionConfig = {
    secret: mockSecret,
    maxAge: 3600, // 1 hour for testing
    secure: false, // Test environment
    sameSite: "Strict",
    httpOnly: true,
  };

  beforeEach(() => {
    // Reset time for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2023-01-01T00:00:00Z"));
  });

  describe("createSecureToken", () => {
    it("should create a valid JWT-like token", async () => {
      const token = await createSecureToken(mockSessionData, defaultConfig);

      // JWT format: header.payload.signature
      const parts = token.split(".");
      expect(parts).toHaveLength(3);

      // Check header
      const header = JSON.parse(atob(parts[0]));
      expect(header).toEqual({ alg: "HS256", typ: "JWT" });

      // Check payload structure
      const payload = JSON.parse(atob(parts[1]));
      expect(payload).toMatchObject(mockSessionData);
      expect(payload).toHaveProperty("iat");
      expect(payload).toHaveProperty("exp");
    });

    it("should set correct timestamps", async () => {
      const token = await createSecureToken(mockSessionData, defaultConfig);
      const parts = token.split(".");
      const payload = JSON.parse(atob(parts[1]));

      const expectedIat = Math.floor(Date.now() / 1000);
      const expectedExp = expectedIat + 3600;

      expect(payload.iat).toBe(expectedIat);
      expect(payload.exp).toBe(expectedExp);
    });

    it("should use default maxAge when not provided", async () => {
      const configWithoutMaxAge = { ...defaultConfig };
      delete configWithoutMaxAge.maxAge;

      const token = await createSecureToken(
        mockSessionData,
        configWithoutMaxAge
      );
      const parts = token.split(".");
      const payload = JSON.parse(atob(parts[1]));

      const expectedExp = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24 hours
      expect(payload.exp).toBe(expectedExp);
    });

    it("should create URL-safe base64 encoding", async () => {
      const token = await createSecureToken(mockSessionData, defaultConfig);

      // JWT should not contain +, /, or = characters (URL-safe base64)
      expect(token).not.toMatch(/[+/=]/);
      expect(token).toMatch(
        /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
      );
    });
  });

  describe("verifySecureToken", () => {
    it("should verify and decode valid token", async () => {
      const token = await createSecureToken(mockSessionData, defaultConfig);
      const decoded = await verifySecureToken(token, mockSecret);

      expect(decoded).toMatchObject(mockSessionData);
      expect(decoded?.iat).toBeDefined();
      expect(decoded?.exp).toBeDefined();
    });

    it("should reject token with wrong secret", async () => {
      // Create mock that returns false for wrong secret
      const mockVerify = vi
        .spyOn(crypto.subtle, "verify")
        .mockResolvedValue(false);

      const token = await createSecureToken(mockSessionData, defaultConfig);
      const decoded = await verifySecureToken(token, "wrong-secret");

      expect(decoded).toBeNull();
      mockVerify.mockRestore();
    });

    it("should reject expired token", async () => {
      const token = await createSecureToken(mockSessionData, {
        ...defaultConfig,
        maxAge: 1,
      });

      // Move time forward past expiration
      vi.advanceTimersByTime(2000); // 2 seconds

      const decoded = await verifySecureToken(token, mockSecret);
      expect(decoded).toBeNull();
    });

    it("should reject malformed token", async () => {
      const malformedTokens = [
        "not.a.jwt",
        "missing.part",
        "too.many.parts.here",
        "invalid-base64!@#",
        "",
      ];

      for (const badToken of malformedTokens) {
        const decoded = await verifySecureToken(badToken, mockSecret);
        expect(decoded).toBeNull();
      }
    });

    it("should handle corrupted signature", async () => {
      const token = await createSecureToken(mockSessionData, defaultConfig);
      const parts = token.split(".");
      const corruptedToken = `${parts[0]}.${parts[1]}.corrupted-signature`;

      const decoded = await verifySecureToken(corruptedToken, mockSecret);
      expect(decoded).toBeNull();
    });
  });

  describe("cookie handling", () => {
    describe("createSessionCookie", () => {
      it("should create properly formatted cookie string", () => {
        const token = "test-token-123";
        const cookie = createSessionCookie(token, defaultConfig);

        expect(cookie).toContain("kimmy_session=test-token-123");
        expect(cookie).toContain("Path=/");
        expect(cookie).toContain("Max-Age=3600");
        expect(cookie).toContain("SameSite=Strict");
        expect(cookie).toContain("HttpOnly");
      });

      it("should include Secure flag when secure=true", () => {
        const token = "test-token";
        const secureConfig = { ...defaultConfig, secure: true };
        const cookie = createSessionCookie(token, secureConfig);

        expect(cookie).toContain("Secure");
      });

      it("should exclude HttpOnly when httpOnly=false", () => {
        const token = "test-token";
        const noHttpOnlyConfig = { ...defaultConfig, httpOnly: false };
        const cookie = createSessionCookie(token, noHttpOnlyConfig);

        expect(cookie).not.toContain("HttpOnly");
      });
    });

    describe("parseSessionCookie", () => {
      it("should extract session token from cookie header", () => {
        const cookieHeader =
          "kimmy_session=abc123; other_cookie=value; another=test";
        const token = parseSessionCookie(cookieHeader);

        expect(token).toBe("abc123");
      });

      it("should return null for missing session cookie", () => {
        const cookieHeader = "other_cookie=value; another=test";
        const token = parseSessionCookie(cookieHeader);

        expect(token).toBeNull();
      });

      it("should return null for empty cookie header", () => {
        expect(parseSessionCookie("")).toBeNull();
        expect(parseSessionCookie(null as any)).toBeNull();
      });

      it("should handle malformed cookies gracefully", () => {
        const malformedHeaders = [
          "kimmy_session=",
          "=missing-key",
          "kimmy_session",
          "malformed cookie string",
        ];

        for (const header of malformedHeaders) {
          const token = parseSessionCookie(header);
          // Should either extract correctly or return null, not throw
          expect(token).toBeNull();
        }
      });
    });

    describe("createClearSessionCookie", () => {
      it("should create cookie that clears session", () => {
        const clearCookie = createClearSessionCookie();

        expect(clearCookie).toContain("kimmy_session=");
        expect(clearCookie).toContain("Max-Age=0");
        expect(clearCookie).toContain("Secure");
        expect(clearCookie).toContain("HttpOnly");
        expect(clearCookie).toContain("SameSite=Strict");
      });
    });
  });

  describe("extractSecureSession", () => {
    it("should extract and validate session from request", async () => {
      const token = await createSecureToken(mockSessionData, defaultConfig);
      const cookie = `kimmy_session=${token}; other=value`;

      const request = new Request("https://example.com", {
        headers: { Cookie: cookie },
      });

      const session = await extractSecureSession(request, mockSecret);
      expect(session).toMatchObject(mockSessionData);
    });

    it("should return null when no cookie header", async () => {
      const request = new Request("https://example.com");
      const session = await extractSecureSession(request, mockSecret);

      expect(session).toBeNull();
    });

    it("should return null when no session cookie", async () => {
      const request = new Request("https://example.com", {
        headers: { Cookie: "other_cookie=value" },
      });

      const session = await extractSecureSession(request, mockSecret);
      expect(session).toBeNull();
    });

    it("should return null for invalid token", async () => {
      const request = new Request("https://example.com", {
        headers: { Cookie: "kimmy_session=invalid-token" },
      });

      const session = await extractSecureSession(request, mockSecret);
      expect(session).toBeNull();
    });
  });
});
