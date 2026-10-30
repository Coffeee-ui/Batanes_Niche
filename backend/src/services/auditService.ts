import { AuditLog } from '@prisma/client';
import { AuditLogRepository } from '../repositories/auditLogRepository';

export class AuditService {
  static async logEvent(
    action: string,
    actorRole: string,
    actorId?: number | null,
    ipAddress?: string | null,
    targetType?: string | null,
    targetId?: number | null,
    details?: Record<string, unknown> | null
  ): Promise<AuditLog> {
    let sanitizedDetails: string | null = null;
    if (details) {
      const cleaned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(details)) {
        if (['password', 'token', 'otp', 'secret', 'hash'].some(term => k.toLowerCase().includes(term))) {
          cleaned[k] = '[REDACTED]';
        } else {
          cleaned[k] = v;
        }
      }
      sanitizedDetails = JSON.stringify(cleaned);
    }

    return AuditLogRepository.create({
      action,
      actor_role: actorRole,
      actor: actorId ? { connect: { id: actorId } } : undefined,
      ip_address: ipAddress || null,
      target_type: targetType || null,
      target_id: targetId || null,
      details: sanitizedDetails,
    });
  }
}
