import { describe, expect, it } from "vitest";
import { passwordChangeSchema } from "@/lib/auth/password-change";

describe("password change validation", () => {
  const valid = { currentPassword: "current password", newPassword: "a secure password", confirmPassword: "a secure password" };

  it("accepts a matching strong new password", () => {
    expect(passwordChangeSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects mismatches, short passwords, and reuse", () => {
    expect(passwordChangeSchema.safeParse({ ...valid, confirmPassword: "different password" }).success).toBe(false);
    expect(passwordChangeSchema.safeParse({ ...valid, newPassword: "short", confirmPassword: "short" }).success).toBe(false);
    expect(passwordChangeSchema.safeParse({ currentPassword: "same password", newPassword: "same password", confirmPassword: "same password" }).success).toBe(false);
  });
});
