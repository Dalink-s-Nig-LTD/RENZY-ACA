import { v } from "convex/values";
import { action } from "./_generated/server";

// Send a reply email via Resend
export const sendReply = action({
  args: {
    submissionId: v.id("submissions"),
    replyMessage: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate session
    const session = await ctx.runQuery(
      "auth:validateSession" as any,
      { token: args.token }
    );

    // We need to validate manually since actions can't query directly
    // Instead, fetch the submission and send the email
    const submission = await ctx.runQuery(
      "submissions:getById" as any,
      { id: args.submissionId, token: args.token }
    );

    if (!submission) {
      return { success: false, error: "Submission not found or unauthorized" };
    }

    // Send email via Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return { success: false, error: "Resend API key not configured" };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || "Renzy Academy <info@renzyacademy.org>",
          to: [process.env.NODE_ENV !== "production" ? "eduplusconsultzoom@gmail.com" : submission.email],
          subject: `Re: Your ${submission.type === "enrollment" ? "Enrollment Application" : "Support Request"} — Renzy Academy`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #E31B23 0%, #ff6b3d 100%); padding: 32px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Renzy Academy</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">PMI-ACP Certification Training</p>
              </div>
              <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">Dear ${submission.name},</p>
                <div style="color: #374151; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${args.replyMessage}</div>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                <p style="color: #6b7280; font-size: 14px;">
                  Best regards,<br />
                  <strong>Renzy Academy Team</strong><br />
                  📧 info@renzyacademy.org<br />
                  📞 +234 901 069 2401
                </p>
              </div>
              <div style="background: #f9fafb; padding: 16px 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
                  © 2026 Renzy Academy. All rights reserved.
                </p>
              </div>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        return { success: false, error: `Resend error: ${errorData}` };
      }

      // Mark submission as replied in DB
      await ctx.runMutation(
        "submissions:markReplied" as any,
        {
          id: args.submissionId,
          replyMessage: args.replyMessage,
          token: args.token,
        }
      );

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
      };
    }
  },
});
