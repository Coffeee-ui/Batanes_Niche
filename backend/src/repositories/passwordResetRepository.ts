import { PasswordResetToken, Prisma } from '@prisma/client';
import { prisma } from '../database/client';

export class PasswordResetRepository {
  static async createToken(data: Prisma.PasswordResetTokenCreateInput): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.create({
      data,
    });
  }

  static async getLatestActiveByIdentifier(identifier: string): Promise<PasswordResetToken | null> {
    const now = new Date();
    const clean = identifier.trim().toLowerCase();
    // findFirst matching identifier, unused, not expired, attempts < 5
    const tokens = await prisma.passwordResetToken.findMany({
      where: {
        used: false,
        expires_at: { gt: now },
        attempts_count: { lt: 5 },
      },
      orderBy: { created_at: 'desc' },
    });
    return tokens.find(t => t.identifier.trim().toLowerCase() === clean) || null;
  }

  static async invalidateActiveTokensForUser(userId: number): Promise<void> {
    await prisma.passwordResetToken.updateMany({
      where: { user_id: userId, used: false },
      data: { used: true },
    });
  }

  static async incrementAttempts(token: PasswordResetToken): Promise<number> {
    const nextAttempts = token.attempts_count + 1;
    const isUsed = nextAttempts >= 5;
    const updated = await prisma.passwordResetToken.update({
      where: { id: token.id },
      data: {
        attempts_count: nextAttempts,
        used: isUsed ? true : token.used,
      },
    });
    return updated.attempts_count;
  }

  static async markUsed(id: number): Promise<void> {
    await prisma.passwordResetToken.update({
      where: { id },
      data: { used: true },
    });
  }

  static async cleanupExpiredResets(): Promise<number> {
    const now = new Date();
    const res = await prisma.passwordResetToken.deleteMany({
      where: { expires_at: { lt: now } },
    });
    return res.count;
  }
}
