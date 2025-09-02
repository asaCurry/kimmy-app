import { describe, it, expect } from "vitest";
import { cn } from "~/lib/utils";

describe("Utils", () => {
  describe("cn function", () => {
    it("should merge class names correctly", () => {
      const result = cn("px-4", "py-2", "bg-blue-500");
      expect(result).toBe("px-4 py-2 bg-blue-500");
    });

    it("should handle conditional classes", () => {
      const condition = true;
      const result = cn("base-class", condition && "conditional-class");
      expect(result).toBe("base-class conditional-class");
    });

    it("should handle undefined values", () => {
      const result = cn("base-class", undefined, "other-class");
      expect(result).toBe("base-class other-class");
    });
  });
});
