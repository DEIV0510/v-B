'use server';

import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/require-admin';

export async function listAuditLog(limit = 50) {
  await requireAdmin();
  return db.auditLog.findMany({
    include: { adminUser: { select: { email: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}
