import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/index.js';

export async function checkSubscriptionLimits(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return next();
    
    // Get user's subscription
    const subResult = await pool.query(
      `SELECT p.name as plan_name, s.status
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = $1 AND s.status = 'active'
       LIMIT 1`,
      [userId]
    );
    
    const planName = subResult.rows.length > 0 
      ? subResult.rows[0].plan_name.toLowerCase()
      : 'free';
    
    // Define limits per plan
    const limits: Record<string, { messagesPerDay: number; activeChats: number }> = {
      free: { messagesPerDay: 10, activeChats: 1 },
      pro: { messagesPerDay: 100, activeChats: 10 },
      enterprise: { messagesPerDay: 999999, activeChats: 999 }
    };
    
    const userLimits = limits[planName] || limits.free;
    
    // Attach to request for use in routes
    (req as any).subscriptionLimits = userLimits;
    
    next();
  } catch (error) {
    next(error);
  }
}
