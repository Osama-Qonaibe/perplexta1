import { pool, getLedgerPool } from '../db/index.js';
import { deductFromWallet, refundToWallet, getUserWallet } from './wallet.js';
import { createNotification } from './notifications.js';
import { io } from '../config/socket.js';

export async function purchaseSubscription(userId: string, planId: string, billingCycle: 'monthly' | 'annual' | 'daily') {
  if (!pool) throw new Error('Database initializing');

  const planRes = await pool.query('SELECT * FROM plans WHERE id = $1 AND is_active = true', [planId]);
  if (planRes.rows.length === 0) throw new Error('Plan not found or inactive');
  const plan = planRes.rows[0];

  const isMonthlyEnabled = plan.is_monthly_enabled !== false;
  const isAnnualEnabled = plan.is_annual_enabled !== false;
  const isDailyEnabled = Boolean(plan.is_daily_enabled);

  // Strict Cycle Validation
  if (billingCycle === 'daily') {
    if (!isDailyEnabled) {
      throw new Error('Daily / Custom period billing is not enabled for this plan');
    }
  } else if (billingCycle === 'annual') {
    if (!isAnnualEnabled) {
      throw new Error('Annual billing is not enabled for this plan');
    }
  } else if (billingCycle === 'monthly') {
    if (!isMonthlyEnabled) {
      throw new Error('Monthly billing is not enabled for this plan');
    }
  } else {
    throw new Error('Invalid billing cycle');
  }

  let price = 0;
  let cycleDays = 30;

  if (billingCycle === 'daily') {
    price = Number(plan.daily_price || 0);
    cycleDays = Number(plan.daily_days || 7);
  } else if (billingCycle === 'annual') {
    price = Number(plan.annual_price || 0);
    cycleDays = 365;
  } else {
    // monthly
    price = Number(plan.monthly_price || 0);
    cycleDays = 30;
  }

  if (price > 0) {
    try {
      await deductFromWallet(userId, price, 'subscription_payment', `Payment for ${plan.name_en} (${billingCycle})`);
    } catch (err: any) {
      if (err.message === 'Insufficient balance') throw err;
      throw new Error('Failed to process payment');
    }
  }

  try {
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + cycleDays);

    let allocatedCredits = 0;
    if (billingCycle === 'daily') {
      allocatedCredits = Number(plan.daily_credits) > 0 
        ? Number(plan.daily_credits) 
        : Math.round(Number(plan.daily_price || 0) * 1000);
    } else if (billingCycle === 'annual') {
      allocatedCredits = Number(plan.annual_credits) > 0 
        ? Number(plan.annual_credits) 
        : (Number(plan.monthly_credits) > 0 ? Number(plan.monthly_credits) * 12 : Math.round(Number(plan.annual_price || 0) * 1000));
    } else {
      allocatedCredits = Number(plan.monthly_credits) > 0 
        ? Number(plan.monthly_credits) 
        : Math.round(Number(plan.monthly_price || 0) * 1000);
    }

    await pool.query(`
      INSERT INTO subscriptions (user_id, plan_id, status, billing_period, current_period_end, cycle_credits, used_credits, last_reset_at)
      VALUES ($1, $2, 'active', $3, $4, $5, 0, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        plan_id = EXCLUDED.plan_id,
        status = 'active',
        billing_period = EXCLUDED.billing_period,
        current_period_end = EXCLUDED.current_period_end,
        cycle_credits = EXCLUDED.cycle_credits,
        used_credits = 0,
        last_reset_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    `, [userId, planId, billingCycle, periodEnd, allocatedCredits]);

    const periodLabelEn = billingCycle === 'daily' ? `${cycleDays} Days` : (billingCycle === 'annual' ? 'Annual' : 'Monthly');
    const periodLabelAr = billingCycle === 'daily' ? `${cycleDays} يوم` : (billingCycle === 'annual' ? 'سنوي' : 'شهري');

    await createNotification(
      userId, 
      'success',
      'Subscription Activated',
      'تم تفعيل الاشتراك',
      `Your ${plan.name_en} (${periodLabelEn}) subscription is now active.`,
      `اشتراكك في باقة ${plan.name_ar} (${periodLabelAr}) فعال الآن.`
    );
    
    if (io) {
      io.to(`user_${userId}`).emit('user_profile_updated');
      io.to(`user_${userId}`).emit('quota_reset', { reason: 'subscription_activated', planId });
    }

    return { success: true, message: 'Subscription activated' };
  } catch (error) {
    console.error('[SubscriptionService] Core DB update failed, attempting refund:', error);
    if (price > 0) {
      try {
        await refundToWallet(userId, price, 'subscription_refund', `Refund due to system error during ${plan.name_en} activation`);
      } catch (refundErr) {
        console.error('[SubscriptionService] CRITICAL: Refund failed after Core DB error:', refundErr);
      }
    }
    throw new Error('Failed to update subscription. Payment was refunded.');
  }
}

export async function getSubscriptionStatus(userId: string) {
  if (!pool) throw new Error('Database initializing');
  const result = await pool.query(`
    SELECT s.*, p.name_en as plan_name_en, p.name_ar as plan_name_ar, p.limits, p.color as plan_color
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.user_id = $1 AND s.status = 'active' AND (s.current_period_end IS NULL OR s.current_period_end > NOW())
  `, [userId]);

  return result.rows[0] || null;
}

export async function activateStripeSubscription(userId: string, planId: string, subscriptionId: string, billingCycle: string, stripeCustomerId?: string) {
  if (!pool) return;

  const planRes = await pool.query('SELECT name_en, name_ar, monthly_price, annual_price, daily_price, daily_days, daily_credits, monthly_credits, annual_credits FROM plans WHERE id = $1', [planId]);
  const plan = planRes.rows[0];
  const planNameEn = plan?.name_en || 'Premium Plan';
  const planNameAr = plan?.name_ar || 'الباقة المميزة';

  let cycleDays = 30;
  let chargedPrice = 0;
  let allocatedCredits = 0;
  if (billingCycle === 'annual') {
    cycleDays = 365;
    chargedPrice = Number(plan?.annual_price || 0);
    allocatedCredits = Number(plan?.annual_credits) > 0 
      ? Number(plan?.annual_credits) 
      : (Number(plan?.monthly_credits) > 0 ? Number(plan?.monthly_credits) * 12 : Math.round(chargedPrice * 1000));
  } else if (billingCycle === 'daily') {
    cycleDays = Number(plan?.daily_days) || 7;
    chargedPrice = Number(plan?.daily_price || 0);
    allocatedCredits = Number(plan?.daily_credits) > 0 
      ? Number(plan?.daily_credits) 
      : Math.round(chargedPrice * 1000);
  } else {
    cycleDays = 30;
    chargedPrice = Number(plan?.monthly_price || 0);
    allocatedCredits = Number(plan?.monthly_credits) > 0 
      ? Number(plan?.monthly_credits) 
      : Math.round(chargedPrice * 1000);
  }

  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + cycleDays);

  await pool.query(`
    INSERT INTO subscriptions (user_id, plan_id, status, billing_period, current_period_end, last_period_start, stripe_subscription_id, stripe_customer_id, cycle_credits, used_credits, last_reset_at)
    VALUES ($1, $2, 'active', $3, $4, CURRENT_TIMESTAMP, $5, $6, $7, 0, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id) DO UPDATE SET
      plan_id = EXCLUDED.plan_id,
      status = 'active',
      billing_period = EXCLUDED.billing_period,
      current_period_end = EXCLUDED.current_period_end,
      last_period_start = CURRENT_TIMESTAMP,
      stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, subscriptions.stripe_customer_id),
      cycle_credits = EXCLUDED.cycle_credits,
      used_credits = 0,
      last_reset_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  `, [userId, planId, billingCycle, periodEnd, subscriptionId, stripeCustomerId || null, allocatedCredits]);

  // Log in ledger database
  const ledger = getLedgerPool();
  if (ledger && chargedPrice > 0) {
    try {
      const client = await ledger.connect();
      try {
        await client.query('BEGIN');
        const wallet = await getUserWallet(userId, client);
        await client.query(`
          INSERT INTO ledger_transactions (user_id, wallet_id, amount, points, transaction_type, status, reference_id, description, metadata)
          VALUES ($1, $2, $3, 0, 'subscription_stripe', 'success', $4, $5, $6)
        `, [
          userId,
          wallet.id,
          -chargedPrice,
          subscriptionId || `stripe_sub_${Date.now()}`,
          `Credit Card Subscription: ${planNameEn} (${billingCycle})`,
          JSON.stringify({ planId, billingCycle, subscriptionId, stripeCustomerId })
        ]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        console.warn('[Stripe Subscription] Ledger recording skipped or rolled back:', err);
      } finally {
        client.release();
      }
    } catch {}
  }

  const cycleLabelEn = billingCycle === 'annual' ? 'Annual' : (billingCycle === 'daily' ? `${cycleDays} Days` : 'Monthly');
  const cycleLabelAr = billingCycle === 'annual' ? 'سنوي' : (billingCycle === 'daily' ? `${cycleDays} يوم` : 'شهري');

  await createNotification(
    userId, 
    'success',
    'Subscription Activated via Card',
    'تم تفعيل الاشتراك بالبطاقة بنجاح',
    `Your subscription for ${planNameEn} (${cycleLabelEn}) has been activated successfully via Credit Card (Stripe).`,
    `تم تفعيل اشتراكك في باقة ${planNameAr} (${cycleLabelAr}) بنجاح وفورياً عبر بطاقة الائتمان (Stripe).`
  );

  if (io) {
    io.to(`user_${userId}`).emit('user_profile_updated');
    io.to(`user_${userId}`).emit('quota_reset', { reason: 'stripe_activation', planId, subscriptionId });
    io.to(`user_${userId}`).emit('subscription_activated', { planId, billingCycle, current_period_end: periodEnd });
  }
}

export async function cancelSubscription(userId: string) {
  if (!pool) return;
  
  await pool.query(`
    UPDATE subscriptions 
    SET status = 'canceled', updated_at = CURRENT_TIMESTAMP 
    WHERE user_id = $1
  `, [userId]);

  await createNotification(
    userId, 
    'warning',
    'Subscription Canceled',
    'تم إلغاء الاشتراك',
    `Your subscription has been canceled or expired. Access to premium tools has been revoked.`,
    `تم إلغاء اشتراكك أو انتهت صلاحيته. تم سحب الوصول إلى الأدوات المتميزة.`
  );

  if (io) {
    io.to(`user_${userId}`).emit('user_profile_updated');
    io.to(`user_${userId}`).emit('subscription_canceled', { userId });
  }
}
