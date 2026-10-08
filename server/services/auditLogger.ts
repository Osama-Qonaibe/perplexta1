import { getSecurityPool } from '../db/index.js';

export async function logFinancialAudit(
  userId: number,
  action: 'deposit' | 'withdrawal' | 'transfer' | 'purchase',
  amount: number,
  metadata: Record<string, any> = {}
) {
  try {
    const secPool = getSecurityPool();
    await secPool.query(
      `INSERT INTO admin_audit_logs (admin_id, admin_email, action, target_resource, details, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        null,
        `system-financial-audit`,
        `financial:${action}`,
        `wallet:user:${userId}`,
        JSON.stringify({ userId, action, amount, ...metadata }),
        metadata.ip_address || 'system-internal',
        'financial-audit-service'
      ]
    );
  } catch (err) {
    console.error('[FinancialAudit] Failed to log audit event:', err);
  }
}
