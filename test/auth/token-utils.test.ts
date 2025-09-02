import { describe, it, expect, vi } from "vitest";
import {
  generateSecureToken,
  generateSessionToken,
  generateInviteCode,
} from "~/lib/token-utils";

describe("Token Utils", () => {
  describe("generateSecureToken", () => {
    it("should generate token of correct length", () => {
      const token = generateSecureToken(16);
      // Base64 encoding with URL-safe chars, length varies but should be reasonable
      expect(token.length).toBeGreaterThan(15);
      expect(token.length).toBeLessThan(30);
    });

    it("should generate default 32-byte token", () => {
      const token = generateSecureToken();
      expect(token.length).toBeGreaterThan(40); // Base64 encoded 32 bytes
    });

    it("should generate URL-safe base64", () => {
      const token = generateSecureToken();
      // Should not contain +, / characters (= may appear at end but is stripped)
      expect(token).not.toMatch(/[+/]/);
      expect(token).toMatch(/^[A-Za-z0-9\-_]*=*$/); // Allow trailing = padding
    });

    it("should generate different tokens each call", () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      const token3 = generateSecureToken();

      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });

    it("should use crypto.getRandomValues when available", () => {
      const getRandomValuesSpy = vi.spyOn(crypto, "getRandomValues");

      generateSecureToken();

      expect(getRandomValuesSpy).toHaveBeenCalled();
    });

    it("should handle different lengths correctly", () => {
      const lengths = [1, 8, 16, 32, 64, 128];

      for (const length of lengths) {
        const token = generateSecureToken(length);
        expect(token).toBeTruthy();
        expect(typeof token).toBe("string");
      }
    });
  });

  describe("generateSessionToken", () => {
    beforeEach(() => {
      // Use fake timers for consistent timestamp testing
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2023-01-01T00:00:00Z"));
    });

    it("should have correct prefix", () => {
      const sessionToken = generateSessionToken();
      expect(sessionToken).toMatch(/^sess_/);
    });

    // TODO: Fix session token format expectations
    it.skip("should include timestamp component", () => {
      const sessionToken = generateSessionToken();
      const parts = sessionToken.split("_");

      expect(parts.length).toBeGreaterThanOrEqual(3);
      expect(parts[0]).toBe("sess");
      expect(parts[1]).toBeTruthy(); // timestamp part
      expect(parts[2]).toBeTruthy(); // random part
    });

    it("should have consistent format", () => {
      const sessionToken = generateSessionToken();
      expect(sessionToken).toMatch(/^sess_[a-z0-9]+_[A-Za-z0-9\-_]*=*$/);
    });

    it("should generate unique tokens", () => {
      const tokens = Array.from({ length: 10 }, () => generateSessionToken());
      const uniqueTokens = new Set(tokens);

      expect(uniqueTokens.size).toBe(tokens.length);
    });

    it("should include readable timestamp for debugging", () => {
      const now = Date.now();
      const sessionToken = generateSessionToken();
      const parts = sessionToken.split("_");
      const timestamp = parseInt(parts[1], 36);

      // Should be close to current time (within reasonable range)
      expect(timestamp).toBeGreaterThanOrEqual(now - 1000);
      expect(timestamp).toBeLessThanOrEqual(now + 1000);
    });
  });

  describe("generateInviteCode", () => {
    it("should generate 8-character code", () => {
      const inviteCode = generateInviteCode();
      expect(inviteCode).toHaveLength(8);
    });

    it("should only contain uppercase alphanumeric characters", () => {
      const inviteCode = generateInviteCode();
      expect(inviteCode).toMatch(/^[A-Z0-9]{8}$/);
    });

    it("should generate different codes each call", () => {
      const codes = Array.from({ length: 20 }, () => generateInviteCode());
      const uniqueCodes = new Set(codes);

      // Should have good uniqueness (allowing for small chance of collision)
      expect(uniqueCodes.size).toBeGreaterThan(15);
    });

    it("should use crypto.getRandomValues when available", () => {
      const getRandomValuesSpy = vi.spyOn(crypto, "getRandomValues");

      generateInviteCode();

      expect(getRandomValuesSpy).toHaveBeenCalled();
    });

    it("should handle edge cases in character selection", () => {
      // Generate many codes to test character distribution
      const codes = Array.from({ length: 100 }, () => generateInviteCode());
      const allChars = codes.join("");

      // Should contain both letters and numbers
      expect(allChars).toMatch(/[A-Z]/);
      expect(allChars).toMatch(/[0-9]/);

      // Should not contain lowercase or special characters
      expect(allChars).not.toMatch(/[a-z]/);
      expect(allChars).not.toMatch(/[^A-Z0-9]/);
    });
  });

  describe("crypto fallback behavior", () => {
    it("should warn when crypto is not available", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const originalCrypto = global.crypto;

      // Temporarily remove crypto to test fallback
      // @ts-ignore - Intentionally testing fallback
      delete global.crypto;

      try {
        const token = generateSecureToken();
        expect(token).toBeTruthy();
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("crypto.getRandomValues not available")
        );
      } finally {
        // Restore crypto
        global.crypto = originalCrypto;
        consoleSpy.mockRestore();
      }
    });

    it("should still generate reasonable tokens in fallback mode", () => {
      const originalCrypto = global.crypto;
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // @ts-ignore - Testing fallback
      delete global.crypto;

      try {
        const token = generateSecureToken(16);
        expect(token).toBeTruthy();
        expect(token.length).toBeGreaterThan(10);
        expect(typeof token).toBe("string");
      } finally {
        global.crypto = originalCrypto;
        consoleSpy.mockRestore();
      }
    });
  });
});
