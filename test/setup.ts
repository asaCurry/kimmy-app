import "@testing-library/jest-dom";
import { vi } from "vitest";
import { installCryptoMock } from "./mocks/crypto";
import { mockCloudflareEnv } from "./mocks/cloudflare";

// Install global mocks
global.fetch = global.fetch || vi.fn();

// Install Web Crypto API mock
installCryptoMock();

// Mock React Router location
Object.defineProperty(window, "location", {
  value: {
    href: "http://localhost:3000",
    origin: "http://localhost:3000",
    pathname: "/",
    search: "",
    hash: "",
  },
  writable: true,
});

// Mock Cloudflare Workers environment
global.__env = mockCloudflareEnv;

// Mock base64 encoding/decoding functions for Node.js compatibility
global.btoa =
  global.btoa ||
  ((str: string) => Buffer.from(str, "binary").toString("base64"));
global.atob =
  global.atob ||
  ((str: string) => Buffer.from(str, "base64").toString("binary"));
