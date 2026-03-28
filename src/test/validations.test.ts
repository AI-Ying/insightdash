import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema, workspaceSchema } from "@/lib/validations";

describe("loginSchema", () => {
  it("accepts valid login input", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts valid registration input", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short name", () => {
    const result = registerSchema.safeParse({
      name: "J",
      email: "john@example.com",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = registerSchema.safeParse({
      name: "John",
      email: "john@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });
});

describe("workspaceSchema", () => {
  it("accepts valid workspace name", () => {
    const result = workspaceSchema.safeParse({ name: "My Team" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = workspaceSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name over 50 chars", () => {
    const result = workspaceSchema.safeParse({ name: "a".repeat(51) });
    expect(result.success).toBe(false);
  });
});
