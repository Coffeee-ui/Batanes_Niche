import { Prisma, RefreshToken, RevokedToken } from '@prisma/client';
import { prisma } from '../database/client';

export class TokenRepository {
  static async createRefreshToken(data: Prisma.RefreshTokenCreateInput): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data,
    });
  }

  static async getRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({
      where: { token_hash: tokenHash },
    });
  }

  static async revokeRefreshToken(id: number): Promise<void> {
    await prisma.refreshToken.update({
      where: { id },
      data: { revoked: true },
    });
  }

  static async revokeAllUserRefreshTokens(userId: number): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { user_id: userId, revoked: false },
      data: { revoked: true },
    });
  }

  static async addRevokedJti(jti: string, expiresAt: Date): Promise<RevokedToken> {
    return prisma.revokedToken.create({
      data: {
        token_jti: jti,
        expires_at: expiresAt,
      },
    });
  }

  static async isJtiRevoked(jti: string): Promise<boolean> {
    const existing = await prisma.revokedToken.findUnique({
      where: { token_jti: jti },
      select: { id: true },
    });
    return existing !== null;
  }

  static async cleanupExpiredTokens(): Promise<number> {
    const now = new Date();
    const res1 = await prisma.refreshToken.deleteMany({
      where: { expires_at: { lt: now } },
    });
    const res2 = await prisma.revokedToken.deleteMany({
      where: { expires_at: { lt: now } },
    });
    return res1.count + res2.count;
  }
}
