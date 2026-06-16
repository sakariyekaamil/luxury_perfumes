import { AuditAction } from '@prisma/client';
import { prisma } from '../config/database';

export class AuditService {
  static async log(
    userId: string | null,
    action: AuditAction,
    entity: string,
    entityId?: string,
    details?: string,
    ipAddress?: string
  ) {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details,
        ipAddress,
      },
    });
  }
}
