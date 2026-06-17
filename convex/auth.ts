import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Simple hash function for passwords (SHA-256 based)
// In production you'd use bcrypt, but Convex doesn't support Node crypto natively,
// so we use a deterministic hash with a salt prefix.
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode("renzy_salt_v1:" + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Seed the initial admin user — call once from the Convex dashboard
export const seedAdmin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if admin already exists
    const existing = await ctx.db
      .query("adminUsers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      // Update password
      const passwordHash = await hashPassword(args.password);
      await ctx.db.patch(existing._id, { passwordHash });
      return { success: true, message: "Admin password updated" };
    }

    const passwordHash = await hashPassword(args.password);
    await ctx.db.insert("adminUsers", {
      email: args.email,
      passwordHash,
    });
    return { success: true, message: "Admin user created" };
  },
});

// Login — validates credentials, returns session token
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("adminUsers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      return { success: false, error: "Invalid email or password" };
    }

    const passwordHash = await hashPassword(args.password);
    if (user.passwordHash !== passwordHash) {
      return { success: false, error: "Invalid email or password" };
    }

    // Create session token (expires in 24 hours)
    const token = generateToken();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    await ctx.db.insert("adminSessions", {
      token,
      adminUserId: user._id,
      expiresAt,
    });

    return { success: true, token };
  },
});

// Validate session — checks if token is valid and not expired
export const validateSession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (!args.token) return { valid: false };

    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) return { valid: false };
    if (session.expiresAt < Date.now()) return { valid: false };

    return { valid: true };
  },
});

// Logout — deletes the session
export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }
    return { success: true };
  },
});
