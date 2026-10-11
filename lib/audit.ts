import type { Prisma } from "@prisma/client";
import { db } from "./db";

export interface AuditInput {
  actorId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: unknown;
  ip?: string;
}

/**
 * Write an audit log entry. Failures are swallowed so that audit logging
 * never breaks the main request flow.
 */
export async function logAudit(input: AuditInput): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        details: (input.details ?? null) as Prisma.InputJsonValue,
        ipAddress: input.ip ?? null,
      },
    });
  } catch (error) {
    console.error("Audit log failed:", error);
  }
}
