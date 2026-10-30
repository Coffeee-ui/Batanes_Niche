import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env from backend first, fallback to root
const localEnvPath = path.resolve(__dirname, '../../.env');
const rootEnvPath = path.resolve(__dirname, '../../../.env');

if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
}
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}

function parseAllowedOrigins(val: string | undefined): string[] {
  if (!val) {
    return ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];
  }
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    return val.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [val];
}

function parseBool(val: string | undefined, defaultVal: boolean): boolean {
  if (val === undefined || val === '') return defaultVal;
  return val.toLowerCase() === 'true' || val === '1';
}

function resolveProvider(rawUrl: string, explicitProvider?: string): 'sqlite' | 'postgresql' {
  const p = (explicitProvider || '').trim().toLowerCase();
  if (p === 'postgres' || p === 'postgresql') return 'postgresql';
  if (p === 'sqlite') return 'sqlite';
  if (rawUrl.startsWith('postgres://') || rawUrl.startsWith('postgresql://')) return 'postgresql';
  return 'sqlite';
}

export class Settings {
  public readonly PORT: number = parseInt(process.env.PORT || '8000', 10);
  public readonly ENVIRONMENT: string = process.env.ENVIRONMENT || 'development';
  public readonly DEBUG: boolean = parseBool(process.env.DEBUG, true);
  public readonly APP_NAME: string = process.env.APP_NAME || 'Batanes Niche Job Portal';
  public readonly BASE_URL: string = process.env.BASE_URL || 'http://localhost:8000';

  public readonly DEMO_MODE: boolean = parseBool(process.env.DEMO_MODE, false);

  // Database Configuration
  public readonly DATABASE_URL: string = process.env.DATABASE_URL || 'file:../../Database/batanes_niche.db';
  public readonly DIRECT_URL: string | undefined = process.env.DIRECT_URL?.trim() || undefined;
  public readonly DB_PROVIDER: 'sqlite' | 'postgresql' = resolveProvider(this.DATABASE_URL, process.env.DB_PROVIDER);
  public readonly DB_POOL_MIN: number = parseInt(process.env.DB_POOL_MIN || '2', 10);
  public readonly DB_POOL_MAX: number = parseInt(process.env.DB_POOL_MAX || '10', 10);
  public readonly DB_TIMEOUT_SEC: number = parseInt(process.env.DB_TIMEOUT_SEC || '30', 10);
  public readonly DB_SSL: boolean = parseBool(process.env.DB_SSL, false);

  public readonly JWT_SECRET_KEY: string =
    process.env.JWT_SECRET_KEY || 'batanes-niche-local-development-secret-key-super-secure-high-entropy-64chars-minimum';
  public readonly JWT_ALGORITHM: string = process.env.JWT_ALGORITHM || 'HS256';
  public readonly ACCESS_TOKEN_EXPIRE_MINUTES: number = parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || '15', 10);
  public readonly REFRESH_TOKEN_EXPIRE_DAYS: number = parseInt(process.env.REFRESH_TOKEN_EXPIRE_DAYS || '7', 10);

  public readonly ALLOWED_ORIGINS: string[] = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);

  public readonly MAIL_HOST: string = process.env.MAIL_HOST || 'smtp.gmail.com';
  public readonly MAIL_PORT: number = parseInt(process.env.MAIL_PORT || '587', 10);
  public readonly MAIL_USERNAME: string = process.env.MAIL_USERNAME || '';
  public readonly MAIL_PASSWORD: string = process.env.MAIL_PASSWORD || '';
  public readonly MAIL_FROM: string = process.env.MAIL_FROM || 'noreply@batanesniche.ph';
  public readonly MAIL_FROM_NAME: string = process.env.MAIL_FROM_NAME || 'Batanes Niche Job Portal';
  public readonly MAIL_STARTTLS: boolean = parseBool(process.env.MAIL_STARTTLS, true);
  public readonly MAIL_SSL_TLS: boolean = parseBool(process.env.MAIL_SSL_TLS, false);

  public readonly ADMIN_SESSION_SECRET: string =
    process.env.ADMIN_SESSION_SECRET || 'batanes-niche-admin-session-local-secret-super-secure-high-entropy-64chars';

  public get is_demo_mode_active(): boolean {
    const isDev = ['development', 'dev', 'local', 'test', 'testing'].includes(this.ENVIRONMENT.toLowerCase());
    return isDev && Boolean(this.DEMO_MODE);
  }

  public validateDatabaseConfig(): void {
    if (this.DB_PROVIDER === 'postgresql') {
      if (!this.DATABASE_URL.startsWith('postgres://') && !this.DATABASE_URL.startsWith('postgresql://')) {
        throw new Error(
          `[Config Error] DB_PROVIDER is set to '${this.DB_PROVIDER}', but DATABASE_URL does not start with 'postgres://' or 'postgresql://'. Received: ${this.DATABASE_URL}`
        );
      }
      // Supabase pooler validation helper
      if (this.DATABASE_URL.includes(':6543') && !this.DATABASE_URL.includes('pgbouncer=true')) {
        console.warn(
          '[Config Warning] Supabase connection pooler detected on port 6543, but query param ?pgbouncer=true is missing. In transaction pooling mode, please append ?pgbouncer=true to DATABASE_URL.'
        );
      }
    }
  }
}

export const settings = new Settings();
settings.validateDatabaseConfig();
