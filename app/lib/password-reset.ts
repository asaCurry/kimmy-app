import { eq, and, gt } from "drizzle-orm";
import { users, passwordResetTokens } from "~/db/schema";
import type { 
  PasswordResetToken, 
  NewPasswordResetToken,
  User 
} from "~/db/schema";
import { generateSecureToken } from "./secure-session";

export class PasswordResetService {
  constructor(private db: any) {}

  /**
   * Generate a secure password reset token for a user
   */
  private generateResetToken(): string {
    // Generate a cryptographically secure random token
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Create a password reset token for a user
   * @param email - User's email address
   * @returns Token data if user exists, null otherwise
   */
  async createResetToken(email: string): Promise<{ token: string; user: User } | null> {
    // Find user by email
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      return null;
    }

    // Generate secure token
    const token = this.generateResetToken();
    
    // Set expiration time (30 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    // Store token in database
    await this.db.insert(passwordResetTokens).values({
      token,
      userId: user.id,
      email: user.email,
      used: 0,
      expiresAt: expiresAt.toISOString(),
    });

    return { token, user };
  }

  /**
   * Validate a password reset token
   * @param token - Reset token
   * @returns Token data if valid, null otherwise
   */
  async validateResetToken(token: string): Promise<{ tokenData: PasswordResetToken; user: User } | null> {
    const now = new Date().toISOString();

    // Find valid, unused, non-expired token
    const [tokenData] = await this.db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, 0),
          gt(passwordResetTokens.expiresAt, now)
        )
      )
      .limit(1);

    if (!tokenData) {
      return null;
    }

    // Get associated user
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, tokenData.userId))
      .limit(1);

    if (!user) {
      return null;
    }

    return { tokenData, user };
  }

  /**
   * Use a password reset token (mark as used)
   * @param token - Reset token
   */
  async useResetToken(token: string): Promise<boolean> {
    const result = await this.db
      .update(passwordResetTokens)
      .set({ used: 1 })
      .where(eq(passwordResetTokens.token, token));

    return result.changes > 0;
  }

  /**
   * Clean up expired tokens (should be run periodically)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const now = new Date().toISOString();
    
    const result = await this.db
      .delete(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.used, 0),
          gt(now, passwordResetTokens.expiresAt)
        )
      );

    return result.changes;
  }

  /**
   * Revoke all password reset tokens for a user
   * @param userId - User ID
   */
  async revokeAllUserTokens(userId: number): Promise<void> {
    await this.db
      .update(passwordResetTokens)
      .set({ used: 1 })
      .where(
        and(
          eq(passwordResetTokens.userId, userId),
          eq(passwordResetTokens.used, 0)
        )
      );
  }
}

/**
 * Email template for password reset
 */
export function generateResetEmailContent(
  userName: string, 
  resetToken: string, 
  baseUrl: string
): { subject: string; html: string; text: string } {
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
  
  const subject = "Reset Your Password - Hey, Kimmy";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Password Reset - Hey, Kimmy</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #3b82f6; margin: 0;">Hey, Kimmy</h1>
        <p style="color: #666; margin: 5px 0;">Family Record Management</p>
      </div>
      
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
        <h2 style="color: #1e293b; margin-top: 0;">Reset Your Password</h2>
        
        <p>Hi ${userName},</p>
        
        <p>We received a request to reset your password for your Hey, Kimmy account. If you didn't make this request, you can safely ignore this email.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          This link will expire in 30 minutes for security reasons.
        </p>
        
        <p style="font-size: 14px; color: #666;">
          If the button above doesn't work, you can copy and paste this URL into your browser:
          <br>
          <span style="word-break: break-all;">${resetUrl}</span>
        </p>
      </div>
      
      <div style="text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e2e8f0; padding-top: 20px;">
        <p>This is an automated email from Hey, Kimmy. Please don't reply to this email.</p>
        <p>If you're having trouble, contact us at support@kimmy-app.com</p>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    Hey, Kimmy - Password Reset
    
    Hi ${userName},
    
    We received a request to reset your password for your Hey, Kimmy account. If you didn't make this request, you can safely ignore this email.
    
    To reset your password, click the link below or copy and paste it into your browser:
    ${resetUrl}
    
    This link will expire in 30 minutes for security reasons.
    
    If you're having trouble, contact us at support@kimmy-app.com
    
    - The Hey, Kimmy Team
  `;
  
  return { subject, html, text };
}