import { db } from '@/lib/db';

export async function logAudit(params: {
  adminUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
}) {
  await db.auditLog.create({ data: params });
}
