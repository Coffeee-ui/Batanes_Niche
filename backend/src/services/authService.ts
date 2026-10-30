import { User } from '@prisma/client';
import { prisma } from '../database/client';
import { UserRepository, UserWithProfiles } from '../repositories/userRepository';
import { TokenRepository } from '../repositories/tokenRepository';
import { PasswordResetRepository } from '../repositories/passwordResetRepository';
import { AuditService } from './auditService';
import { EmailDeliveryService } from './emailDeliveryService';
import { GeographyService } from './geographyService';
import { settings } from '../core/config';
import {
  createAccessToken,
  generateRefreshToken,
  generateSixDigitOtp,
  getPasswordHash,
  hashOtp,
  hashRefreshToken,
  verifyOtp,
  verifyPassword,
} from '../core/security';
import { Token, UserLogin, UserRegister } from '../schemas/auth';
import { HttpError } from '../core/errors';

export class AuthService {
  static async issueTokens(user: User): Promise<Token> {
    const { token: accessJwt } = createAccessToken(user.id, user.username, user.role);
    const { rawToken, tokenHash, expiresAt } = generateRefreshToken();

    await TokenRepository.createRefreshToken({
      user: { connect: { id: user.id } },
      token_hash: tokenHash,
      expires_at: expiresAt,
      revoked: false,
    });

    return {
      access_token: accessJwt,
      refresh_token: rawToken,
      token_type: 'bearer',
      role: user.role,
      username: user.username,
    };
  }

  static async registerUser(regData: UserRegister): Promise<{ user: UserWithProfiles; token: Token }> {
    const roleClean = regData.role.trim().toLowerCase();
    if (roleClean !== 'job_seeker' && roleClean !== 'employer') {
      throw new HttpError(400, "Public registration accepts only 'job_seeker' or 'employer' roles.");
    }

    const locResult = GeographyService.validateLocation(regData.municipality, regData.barangay);
    if (!locResult.isValid || !locResult.canonicalMunicipality) {
      throw new HttpError(400, `Invalid Batanes location: '${regData.municipality}', '${regData.barangay}'.`);
    }

    const existingUsername = await UserRepository.getByUsername(regData.username);
    if (existingUsername) {
      throw new HttpError(400, 'Username is already registered.');
    }

    const existingEmail = await UserRepository.getByEmail(regData.email);
    if (existingEmail) {
      throw new HttpError(400, 'Email is already registered.');
    }

    const passwordHash = getPasswordHash(regData.password);

    let employerProfileData: { company_name: string; company_address: string; company_description?: string; business_type: string } | undefined;
    let jobSeekerProfileData: { bio?: string; education?: string; experience_years: number } | undefined;

    if (roleClean === 'job_seeker') {
      jobSeekerProfileData = {
        bio: regData.bio?.trim() || undefined,
        education: regData.education?.trim() || undefined,
        experience_years: regData.experience_years ?? 0,
      };
    } else if (roleClean === 'employer') {
      employerProfileData = {
        company_name: (regData.company_name || `${regData.full_name}'s Enterprise`).trim(),
        company_address: (regData.company_address || `${locResult.canonicalMunicipality}, Batanes`).trim(),
        company_description: regData.company_description?.trim() || undefined,
        business_type: (regData.business_type || 'General Enterprise').trim(),
      };
    }

    const user = await UserRepository.create(
      {
        username: regData.username.trim(),
        email: regData.email.trim().toLowerCase(),
        password_hash: passwordHash,
        full_name: regData.full_name.trim(),
        phone_number: regData.phone_number?.trim() || null,
        municipality: locResult.canonicalMunicipality,
        barangay: locResult.canonicalBarangay,
        skills: regData.skills?.trim() || null,
        role: roleClean,
        account_status: 'active',
      },
      employerProfileData,
      jobSeekerProfileData
    );

    const token = await this.issueTokens(user);
    return { user, token };
  }

  static async authenticateUser(loginData: UserLogin): Promise<{ user: UserWithProfiles; token: Token }> {
    const user = await UserRepository.getByUsernameOrEmail(loginData.username_or_email);
    if (!user || !verifyPassword(loginData.password, user.password_hash)) {
      throw new HttpError(401, 'Invalid credentials.');
    }

    if (user.account_status === 'suspended') {
      throw new HttpError(403, 'Your account has been suspended. Please contact administration.');
    }

    if (user.account_status !== 'active') {
      throw new HttpError(403, 'Account is inactive.');
    }

    const token = await this.issueTokens(user);
    return { user, token };
  }

  static async demoAuthenticate(role: string): Promise<Token> {
    if (!settings.is_demo_mode_active) {
      throw new HttpError(404, 'Demo login is unavailable in this environment.');
    }

    const roleClean = role.trim().toLowerCase();
    if (roleClean !== 'job_seeker' && roleClean !== 'employer') {
      throw new HttpError(400, "Invalid demo role requested. Allowed roles: 'job_seeker', 'employer'.");
    }

    const canonicalUsernames: Record<string, string> = {
      employer: 'batanes_inn',
      job_seeker: 'ivatan_guide',
    };

    const targetUsername = canonicalUsernames[roleClean];
    let user = targetUsername ? await UserRepository.getByUsername(targetUsername) : null;

    if (!user) {
      // Fallback to any active account with requested role
      const users = await UserRepository.listUsersForAdmin(null, roleClean, 'active', 1, 0);
      user = users[0] || null;
    }

    if (!user) {
      throw new HttpError(
        404,
        `No active demo account found for role '${roleClean}'. Please seed development data.`
      );
    }

    if (user.account_status !== 'active') {
      throw new HttpError(403, 'The requested demo account is inactive or suspended.');
    }

    const token = await this.issueTokens(user);

    await AuditService.logEvent(
      'DEMO_LOGIN',
      user.role,
      user.id,
      null,
      'user',
      user.id,
      { demo_role: roleClean, username: user.username }
    );

    return token;
  }

  static async rotateRefreshToken(rawRefreshToken: string): Promise<Token> {
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const storedToken = await TokenRepository.getRefreshTokenByHash(tokenHash);

    if (!storedToken) {
      throw new HttpError(401, 'Invalid refresh token.');
    }

    // Compromise detection
    if (storedToken.revoked) {
      await TokenRepository.revokeAllUserRefreshTokens(storedToken.user_id);
      await AuditService.logEvent(
        'REFRESH_TOKEN_COMPROMISE_DETECTED',
        'system',
        storedToken.user_id,
        null,
        'auth',
        storedToken.user_id,
        { reason: 'Revoked refresh token presented. All user sessions invalidated.' }
      );
      throw new HttpError(401, 'Refresh token reuse detected. All sessions terminated for security.');
    }

    // Expiration check
    const now = new Date();
    if (storedToken.expires_at < now) {
      await TokenRepository.revokeRefreshToken(storedToken.id);
      throw new HttpError(401, 'Refresh token has expired.');
    }

    const user = await UserRepository.getById(storedToken.user_id);
    if (!user || user.account_status !== 'active') {
      await TokenRepository.revokeRefreshToken(storedToken.id);
      throw new HttpError(401, 'User account is no longer active.');
    }

    // Revoke old refresh token (Rotation)
    await TokenRepository.revokeRefreshToken(storedToken.id);

    // Issue new tokens
    return this.issueTokens(user);
  }

  static async logout(user: User, jti?: string | null, rawRefreshToken?: string | null): Promise<void> {
    if (rawRefreshToken) {
      const tokenHash = hashRefreshToken(rawRefreshToken);
      const stored = await TokenRepository.getRefreshTokenByHash(tokenHash);
      if (stored && stored.user_id === user.id) {
        await TokenRepository.revokeRefreshToken(stored.id);
      }
    }

    if (jti) {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await TokenRepository.addRevokedJti(jti, expiresAt);
    }
  }

  static async requestPasswordReset(email: string): Promise<void> {
    const user = await UserRepository.getByEmail(email);
    if (!user || user.account_status !== 'active') {
      // Generic response to prevent account enumeration
      return;
    }

    // Invalidate prior active OTPs
    await PasswordResetRepository.invalidateActiveTokensForUser(user.id);

    const plainOtp = generateSixDigitOtp();
    const hashedOtp = hashOtp(plainOtp);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await PasswordResetRepository.createToken({
      user: { connect: { id: user.id } },
      identifier: user.email,
      otp_hash: hashedOtp,
      expires_at: expiresAt,
      used: false,
      attempts_count: 0,
    });

    await EmailDeliveryService.sendOtpEmail(user.email, plainOtp);
  }

  static async resetPassword(email: string, otpCode: string, newPassword: string): Promise<void> {
    const user = await UserRepository.getByEmail(email);
    if (!user || user.account_status !== 'active') {
      throw new HttpError(400, 'Invalid or expired reset code.');
    }

    const resetToken = await PasswordResetRepository.getLatestActiveByIdentifier(user.email);
    if (!resetToken) {
      throw new HttpError(400, 'Invalid or expired reset code.');
    }

    if (!verifyOtp(otpCode, resetToken.otp_hash)) {
      const attempts = await PasswordResetRepository.incrementAttempts(resetToken);
      if (attempts >= 5) {
        throw new HttpError(400, 'Too many failed attempts. This reset code has been invalidated.');
      }
      throw new HttpError(400, 'Invalid or expired reset code.');
    }

    const newPasswordHash = getPasswordHash(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password_hash: newPasswordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
      prisma.refreshToken.updateMany({
        where: { user_id: user.id, revoked: false },
        data: { revoked: true },
      }),
    ]);

    await AuditService.logEvent(
      'PASSWORD_RESET_COMPLETE',
      user.role,
      user.id,
      null,
      'user',
      user.id,
      { email: user.email }
    );
  }
}
