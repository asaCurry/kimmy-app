import { describe, it, expect, beforeEach, vi } from "vitest";
import { z } from "zod";
import {
  createValidatedAction,
  createAuthenticatedAction,
  createValidatedLoader,
  createAuthenticatedLoader,
} from "~/lib/validation-layer.server";

// Mock dependencies
vi.mock("~/lib/env.server", () => ({
  getValidatedEnv: vi.fn(() => ({
    DB: "mock-db",
    ENVIRONMENT: "test",
    SESSION_SECRET: "test-secret-that-is-long-enough-for-validation",
  })),
}));

vi.mock("~/lib/db-utils", () => ({
  getDatabase: vi.fn(() => ({ mock: "database" })),
  getSession: vi.fn(() => ({
    userId: 123,
    currentHouseholdId: "test-household",
  })),
}));

describe("Validation Layer", () => {
  const mockContext = {
    cloudflare: {
      env: {
        DB: "mock-db",
        ENVIRONMENT: "test",
        SESSION_SECRET: "test-secret-that-is-long-enough-for-validation",
      },
    },
  };

  describe("createValidatedAction", () => {
    const testSchema = z.object({
      name: z.string().min(1, "Name is required"),
      age: z
        .string()
        .transform(val => parseInt(val))
        .pipe(z.number().min(0, "Age must be positive")),
    });

    it("should validate and transform form data successfully", async () => {
      const mockHandler = vi
        .fn()
        .mockResolvedValue(Response.json({ success: true }));
      const action = createValidatedAction(testSchema, mockHandler);

      const formData = new FormData();
      formData.append("name", "John");
      formData.append("age", "25");

      const mockRequest = {
        formData: vi.fn().mockResolvedValue(formData),
      };

      const mockArgs = {
        request: mockRequest,
        context: mockContext,
        params: {},
      };

      const response = await action(mockArgs);

      expect(mockHandler).toHaveBeenCalledWith(
        { name: "John", age: 25 },
        expect.objectContaining({
          env: expect.objectContaining({ DB: "mock-db" }),
          db: expect.objectContaining({ mock: "database" }),
        }),
        mockArgs
      );

      expect(response).toBeInstanceOf(Response);
    });

    it("should return validation errors for invalid data", async () => {
      const mockHandler = vi.fn();
      const action = createValidatedAction(testSchema, mockHandler);

      const formData = new FormData();
      formData.append("name", ""); // Invalid - empty string
      formData.append("age", "-5"); // Invalid - negative number

      const mockRequest = {
        formData: vi.fn().mockResolvedValue(formData),
      };

      const mockArgs = {
        request: mockRequest,
        context: mockContext,
        params: {},
      };

      const response = await action(mockArgs);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Validation failed");
      expect(data.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["name"],
            message: "Required",
          }),
          expect.objectContaining({
            path: ["age"],
            message: "Age must be positive",
          }),
        ])
      );
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("should handle FormData null values by converting to undefined", async () => {
      const mockHandler = vi
        .fn()
        .mockResolvedValue(Response.json({ success: true }));
      const optionalSchema = z.object({
        name: z.string().min(1),
        optional: z.string().optional(),
      });
      const action = createValidatedAction(optionalSchema, mockHandler);

      const formData = new FormData();
      formData.append("name", "John");
      // Don't append optional field - FormData.get() returns null

      const mockRequest = {
        formData: vi.fn().mockResolvedValue(formData),
      };

      const mockArgs = {
        request: mockRequest,
        context: mockContext,
        params: {},
      };

      await action(mockArgs);

      expect(mockHandler).toHaveBeenCalledWith(
        { name: "John", optional: undefined },
        expect.any(Object),
        mockArgs
      );
    });

    it("should re-throw non-Zod errors", async () => {
      const mockHandler = vi
        .fn()
        .mockRejectedValue(new Error("Database error"));
      const action = createValidatedAction(testSchema, mockHandler);

      const formData = new FormData();
      formData.append("name", "John");
      formData.append("age", "25");

      const mockRequest = {
        formData: vi.fn().mockResolvedValue(formData),
      };

      const mockArgs = {
        request: mockRequest,
        context: mockContext,
        params: {},
      };

      await expect(action(mockArgs)).rejects.toThrow("Database error");
    });
  });

  describe("createAuthenticatedAction", () => {
    const testSchema = z.object({
      message: z.string().min(1, "Message is required"),
    });

    it("should provide session data to handler", async () => {
      const mockHandler = vi
        .fn()
        .mockResolvedValue(Response.json({ success: true }));
      const action = createAuthenticatedAction(testSchema, mockHandler);

      const formData = new FormData();
      formData.append("message", "Hello world");

      const mockRequest = {
        formData: vi.fn().mockResolvedValue(formData),
      };

      const mockArgs = {
        request: mockRequest,
        context: mockContext,
        params: {},
      };

      await action(mockArgs);

      expect(mockHandler).toHaveBeenCalledWith(
        { message: "Hello world" },
        expect.objectContaining({
          env: expect.objectContaining({ DB: "mock-db" }),
          db: expect.objectContaining({ mock: "database" }),
          session: expect.objectContaining({ userId: 123 }),
        }),
        mockArgs
      );
    });
  });

  describe("createValidatedLoader", () => {
    it("should provide validated context to handler", async () => {
      const mockHandler = vi
        .fn()
        .mockResolvedValue(Response.json({ data: "test" }));
      const loader = createValidatedLoader(mockHandler);

      const mockArgs = {
        request: new Request("http://localhost/test"),
        context: mockContext,
        params: {},
      };

      await loader(mockArgs);

      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          env: expect.objectContaining({ DB: "mock-db" }),
          db: expect.objectContaining({ mock: "database" }),
        }),
        mockArgs
      );
    });

    it("should re-throw errors (like redirects)", async () => {
      const redirectError = new Response("", { status: 302 });
      const mockHandler = vi.fn().mockRejectedValue(redirectError);
      const loader = createValidatedLoader(mockHandler);

      const mockArgs = {
        request: new Request("http://localhost/test"),
        context: mockContext,
        params: {},
      };

      await expect(loader(mockArgs)).rejects.toBe(redirectError);
    });
  });

  describe("createAuthenticatedLoader", () => {
    it("should provide session data to loader handler", async () => {
      const mockHandler = vi
        .fn()
        .mockResolvedValue(Response.json({ data: "test" }));
      const loader = createAuthenticatedLoader(mockHandler);

      const mockArgs = {
        request: new Request("http://localhost/test"),
        context: mockContext,
        params: {},
      };

      await loader(mockArgs);

      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          env: expect.objectContaining({ DB: "mock-db" }),
          db: expect.objectContaining({ mock: "database" }),
          session: expect.objectContaining({ userId: 123 }),
        }),
        mockArgs
      );
    });
  });
});
