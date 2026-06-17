import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  submissions: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    plan: v.optional(v.string()),
    message: v.optional(v.string()),
    type: v.string(), // "enrollment" | "live_chat"
    status: v.string(), // "Pending" | "Contacted" | "Approved" | "Rejected"
    repliedAt: v.optional(v.number()),
    replyMessage: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_type", ["type"]),

  adminUsers: defineTable({
    email: v.string(),
    passwordHash: v.string(),
  }).index("by_email", ["email"]),

  adminSessions: defineTable({
    token: v.string(),
    adminUserId: v.id("adminUsers"),
    expiresAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_expiry", ["expiresAt"]),
});
