import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

export const BCRYPT_ROUNDS = 10;

/**
 * Securely hashes a plain text password with bcryptjs.
 */
export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, BCRYPT_ROUNDS);
}

/**
 * Enforces SQLite foreign key constraints explicitly.
 */
export async function enableSqliteForeignKeys(prisma: PrismaClient): Promise<void> {
  try {
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;');
  } catch {
    // If running against PostgreSQL or non-SQLite, PRAGMA is quietly ignored
  }
}

/**
 * Resolves and normalizes SQLite DB file path and Prisma URL.
 */
export function resolveSqlitePaths(customPath?: string): {
  filePath: string;
  prismaUrl: string;
  isCustom: boolean;
} {
  const rootDir = path.resolve(__dirname, '../../..');

  let raw = customPath || process.env.DATABASE_URL || 'file:../../Database/batanes_niche.db';

  let filePath = '';
  const isCustom = Boolean(customPath);

  if (raw.startsWith('file:')) {
    const sub = raw.replace(/^file:/, '');
    if (path.isAbsolute(sub)) {
      filePath = sub;
    } else {
      // Relative to backend-ts/prisma
      filePath = path.resolve(rootDir, 'backend-ts', 'prisma', sub);
    }
  } else if (raw.startsWith('sqlite:///')) {
    const sub = raw.replace(/^sqlite:\/\/\//, '');
    filePath = path.isAbsolute(sub) ? sub : path.resolve(rootDir, sub);
  } else if (raw.startsWith('sqlite://')) {
    const sub = raw.replace(/^sqlite:\/\//, '');
    filePath = path.isAbsolute(sub) ? sub : path.resolve(rootDir, sub);
  } else {
    filePath = path.isAbsolute(raw) ? raw : path.resolve(rootDir, raw);
  }

  // Normalise backslashes on Windows for Prisma URL
  const normalizedFile = filePath.replace(/\\/g, '/');
  const prismaUrl = `file:${normalizedFile}`;

  return { filePath, prismaUrl, isCustom };
}

/**
 * Ensures parent directory exists.
 */
export function ensureParentDirectory(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`[DB Setup] Created database directory: ${dir}`);
  }
}
