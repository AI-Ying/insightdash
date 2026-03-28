import { describe, it, expect } from "vitest";
import { generateSlug, generateUniqueSlug } from "@/lib/utils";

describe("generateSlug", () => {
  it("converts name to lowercase slug", () => {
    expect(generateSlug("My Workspace")).toBe("my-workspace");
  });

  it("removes special characters", () => {
    expect(generateSlug("Test @ Workspace!")).toBe("test-workspace");
  });

  it("trims leading and trailing hyphens", () => {
    expect(generateSlug("--hello--")).toBe("hello");
  });

  it("truncates to 48 characters", () => {
    const longName = "a".repeat(60);
    expect(generateSlug(longName).length).toBeLessThanOrEqual(48);
  });
});

describe("generateUniqueSlug", () => {
  it("generates slug with random suffix", () => {
    const slug = generateUniqueSlug("Test Workspace");
    expect(slug).toMatch(/^test-workspace-[a-z0-9]{4}$/);
  });

  it("generates different slugs each time", () => {
    const slug1 = generateUniqueSlug("Same Name");
    const slug2 = generateUniqueSlug("Same Name");
    expect(slug1).not.toBe(slug2);
  });
});
