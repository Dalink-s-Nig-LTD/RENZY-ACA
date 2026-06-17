import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Public mutation — called by frontend forms (no auth required)
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    plan: v.optional(v.string()),
    message: v.optional(v.string()),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("submissions", {
      name: args.name,
      email: args.email,
      phone: args.phone ?? "",
      role: args.role ?? "",
      plan: args.plan ?? "",
      message: args.message ?? "",
      type: args.type,
      status: "Pending",
    });
    return id;
  },
});

// List all submissions — requires valid session token
export const list = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    // Validate session
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return [];
    }

    const submissions = await ctx.db.query("submissions").order("desc").collect();
    return submissions;
  },
});

// Get a single submission by ID
export const getById = query({
  args: { id: v.id("submissions"), token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    return await ctx.db.get(args.id);
  },
});

// Update submission status
export const updateStatus = mutation({
  args: {
    id: v.id("submissions"),
    status: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, { status: args.status });
    return { success: true };
  },
});

// Delete a submission
export const remove = mutation({
  args: {
    id: v.id("submissions"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Mark a submission as replied
export const markReplied = mutation({
  args: {
    id: v.id("submissions"),
    replyMessage: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, {
      repliedAt: Date.now(),
      replyMessage: args.replyMessage,
      status: "Contacted",
    });
    return { success: true };
  },
});

// Clear all submissions — requires valid session token
export const clearAll = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }

    const submissions = await ctx.db.query("submissions").collect();
    for (const sub of submissions) {
      await ctx.db.delete(sub._id);
    }
    return { success: true };
  },
});

