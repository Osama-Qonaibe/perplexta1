import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { pool } from '../db/index.js';
import { escapeHtml } from '../utils/security.js';

const router = express.Router();

async function checkMessageOwnership(messageId: string | number, userId: string | number): Promise<{ success: boolean; status?: number; error?: string }> {
  if (!pool) throw new Error('Database initializing');
  
  const checkRes = await pool.query(`
    SELECT m.id, c.user_id 
    FROM messages m
    JOIN chats c ON m.chat_id = c.id
    WHERE m.id = $1
  `, [messageId]);

  if (checkRes.rows.length === 0) {
    return { success: false, status: 404, error: 'Message not found' };
  }

  const chatOwnerId = checkRes.rows[0].user_id;
  if (chatOwnerId !== parseInt(userId as string) && chatOwnerId !== userId) {
    return { success: false, status: 403, error: 'Unauthorized to modify this message' };
  }

  return { success: true };
}

router.patch("/:messageId/pin", authenticateToken, async (req: any, res) => {
  try {
    const { messageId } = req.params;
    const { is_pinned } = req.body;
    const userId = req.user.id;

    const authCheck = await checkMessageOwnership(messageId, userId);
    if (!authCheck.success) {
      return res.status(authCheck.status!).json({ error: authCheck.error });
    }

    await pool.query('UPDATE messages SET is_pinned = $1 WHERE id = $2', [is_pinned, messageId]);
    res.json({ success: true, is_pinned });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to pin message' });
  }
});

router.post("/:messageId/feedback", authenticateToken, async (req: any, res) => {
  try {
    const { messageId } = req.params;
    const { 
      feedback, // 1, -1, or 0
      rating,   // 1 to 5
      reason,   // string
      comment,  // string
      tags,     // string[]
      userPrompt,
      assistantResponse
    } = req.body;
    const userId = req.user.id;

    const authCheck = await checkMessageOwnership(messageId, userId);
    if (!authCheck.success) {
      return res.status(authCheck.status!).json({ error: authCheck.error });
    }

    // Ensure feedback columns exist on messages table
    await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS feedback_rating INTEGER DEFAULT 0`).catch(() => {});
    await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS feedback_reason TEXT`).catch(() => {});
    await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS feedback_comment TEXT`).catch(() => {});
    await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS feedback_submitted_at TIMESTAMP`).catch(() => {});

    // Ensure ai_feedback_logs table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_feedback_logs (
        id SERIAL PRIMARY KEY,
        message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
        chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        user_email VARCHAR(255),
        user_name VARCHAR(255),
        feedback_type VARCHAR(20) NOT NULL,
        rating INTEGER DEFAULT 5,
        reason VARCHAR(255),
        comment TEXT,
        tags JSONB DEFAULT '[]',
        user_prompt TEXT,
        assistant_response TEXT,
        email_sent BOOLEAN DEFAULT false,
        email_recipient VARCHAR(255),
        model_reinforced BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});

    const numRating = feedback === 1 ? (rating || 5) : (feedback === -1 ? (rating || 1) : 0);

    // Update messages record
    await pool.query(`
      UPDATE messages 
      SET feedback = $1,
          feedback_rating = $2,
          feedback_reason = $3,
          feedback_comment = $4,
          feedback_submitted_at = CURRENT_TIMESTAMP
      WHERE id = $5
    `, [
      feedback,
      numRating,
      reason || null,
      comment || null,
      messageId
    ]);

    if (feedback === 0) {
      return res.json({ success: true, feedback: 0 });
    }

    // Fetch message, chat, and user context
    const contextRes = await pool.query(`
      SELECT m.id, m.chat_id, m.content as assistant_content, c.title as chat_title,
             u.id as user_id, u.email as user_email, u.name as user_name
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE m.id = $1
    `, [messageId]);

    const ctx = contextRes.rows[0] || {};
    const chatId = ctx.chat_id;
    const userEmail = ctx.user_email || req.user.email || 'User';
    const userName = ctx.user_name || req.user.name || 'User';
    const finalPrompt = userPrompt || '';
    const finalAssistantResp = assistantResponse || ctx.assistant_content || '';
    const feedbackType = feedback === 1 ? 'like' : 'dislike';

    // 1. Reinforce Model / Continuous Learning Memory in chat_memories
    let memoryFact = '';
    if (feedback === 1) {
      const tagStr = Array.isArray(tags) && tags.length > 0 ? ` (الميزات المميزة: ${tags.join('، ')})` : '';
      const commentStr = comment ? ` - ملاحظة التقييم: "${comment}"` : '';
      memoryFact = `[AI Capability Reinforcement & Proven Strength]: قام المستخدم بتأكيد دقة وجودة الإجابة (التقييم: ${numRating}/5 نجوم)${tagStr}${commentStr}. يجب على النموذج الحفاظ على هذا المستوى العالي من الدقة والتنظيم والعمق في الإجابات التالية.`;
    } else {
      const reasonStr = reason ? `تصنيف الخطأ: "${reason}". ` : '';
      const commentStr = comment ? `توجيه التصحيح: "${comment}". ` : '';
      memoryFact = `[Assistant Correction & Lesson Learned]: أبلغ المستخدم عن ملاحظة عدم رضا. ${reasonStr}${commentStr}يجب على النموذج التعلم من هذا الخطأ بدقة وتجنب تكراره في أي رد قادم.`;
    }

    if (memoryFact && chatId) {
      await pool.query(`
        INSERT INTO chat_memories (user_id, chat_id, fact, category, source, importance)
        VALUES ($1, $2, $3, $4, 'feedback', $5)
      `, [userId, chatId, memoryFact, feedback === 1 ? 'capability_reinforcement' : 'model_correction', 5]).catch(async (err: any) => {
        // Fallback for older schema if importance column is being added
        if (err.message && err.message.includes('importance')) {
          await pool.query(`
            INSERT INTO chat_memories (user_id, chat_id, fact, category, source)
            VALUES ($1, $2, $3, $4, 'feedback')
          `, [userId, chatId, memoryFact, feedback === 1 ? 'capability_reinforcement' : 'model_correction']).catch(() => {});
        } else {
          console.warn('[Memory] Failed to save feedback memory:', err.message);
        }
      });
    }

    // 2. Fetch configured Admin Email in email_settings
    let adminEmail = process.env.ADMIN_EMAIL || 'admin@perplexta.com';
    let emailSettingsRow: any = null;
    try {
      const emailSettingsRes = await pool.query('SELECT * FROM email_settings LIMIT 1');
      if (emailSettingsRes.rows.length > 0) {
        emailSettingsRow = emailSettingsRes.rows[0];
        if (emailSettingsRow.sender_email) {
          adminEmail = emailSettingsRow.sender_email;
        }
      }
    } catch {}

    // 3. Send Email to Admin via sendEmail
    let emailSent = false;
    try {
      const { sendEmail } = await import('../services/email.js');
      const emailSubject = feedback === 1 
        ? `🌟 [Perplexta AI] تقييم إيجابي وإشادة بالمساعد الذكي (${numRating}★) من ${userName}`
        : `⚠️ [Perplexta AI] بلاغ عدم إعجاب وملاحظة تصحيح من ${userName}`;

      const starsHtml = '★'.repeat(numRating) + '☆'.repeat(5 - numRating);
      const emailHtml = `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 28px; border-radius: 16px; max-width: 650px; margin: 0 auto; border: 1px solid #1e293b;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px;">
            <h2 style="color: ${feedback === 1 ? '#10b981' : '#f43f5e'}; margin: 0; font-size: 20px;">
              ${feedback === 1 ? '🌟 تقييم إيجابي وإشادة بقدرات المساعد' : '⚠️ بلاغ عدم إعجاب وتصحيح للمساعد الذكي'}
            </h2>
            <span style="background: ${feedback === 1 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)'}; color: ${feedback === 1 ? '#10b981' : '#f43f5e'}; padding: 4px 12px; border-radius: 9999px; font-weight: bold; font-size: 13px;">
              ${feedback === 1 ? `${numRating} / 5 نجوم` : 'يحتاج مراجعة'}
            </span>
          </div>

          <div style="background: #1e293b; padding: 18px; border-radius: 12px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #94a3b8;"><strong>معلومات المستخدم:</strong></p>
            <p style="margin: 0 0 4px 0; font-size: 15px; color: #ffffff;">👤 <strong>الاسم:</strong> ${escapeHtml(userName)}</p>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #38bdf8;">✉️ <strong>البريد:</strong> ${escapeHtml(userEmail)}</p>
            <p style="margin: 0; font-size: 13px; color: #94a3b8;">🕒 <strong>التاريخ:</strong> ${new Date().toLocaleString('ar-SA')}</p>
          </div>

          ${feedback === 1 ? `
            <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); padding: 18px; border-radius: 12px; margin-bottom: 16px;">
              <p style="margin: 0 0 8px 0; font-size: 15px; color: #10b981;"><strong>التقييم:</strong> <span style="font-size: 18px; color: #fbbf24;">${starsHtml}</span></p>
              ${tags && tags.length ? `<p style="margin: 0 0 8px 0; font-size: 13px; color: #cbd5e1;"><strong>النقاط الإيجابية المحددة:</strong> ${tags.map((t: string) => escapeHtml(t)).join(' • ')}</p>` : ''}
              ${comment ? `<p style="margin: 0; font-size: 14px; color: #ffffff; line-height: 1.6;"><strong>ملاحظة المستخدم:</strong> "${escapeHtml(comment)}"</p>` : ''}
            </div>
          ` : `
            <div style="background: rgba(244, 63, 94, 0.08); border: 1px solid rgba(244, 63, 94, 0.25); padding: 18px; border-radius: 12px; margin-bottom: 16px;">
              ${reason ? `<p style="margin: 0 0 8px 0; font-size: 15px; color: #f43f5e;"><strong>سبب عدم الإعجاب:</strong> ${escapeHtml(reason)}</p>` : ''}
              ${comment ? `<p style="margin: 0; font-size: 14px; color: #ffffff; line-height: 1.6;"><strong>توجيه التصحيح والملاحظة:</strong> "${escapeHtml(comment)}"</p>` : ''}
            </div>
          `}

          ${finalPrompt ? `
            <div style="background: #1e293b; padding: 14px; border-radius: 10px; margin-bottom: 12px;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #94a3b8;"><strong>سؤال المستخدم الأصلي:</strong></p>
              <p style="margin: 0; font-size: 13px; color: #e2e8f0; max-height: 120px; overflow: hidden;">${escapeHtml(finalPrompt.slice(0, 300))}${finalPrompt.length > 300 ? '...' : ''}</p>
            </div>
          ` : ''}

          ${finalAssistantResp ? `
            <div style="background: #1e293b; padding: 14px; border-radius: 10px; margin-bottom: 16px;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #94a3b8;"><strong>إجابة المساعد:</strong></p>
              <p style="margin: 0; font-size: 13px; color: #e2e8f0; max-height: 150px; overflow: hidden;">${escapeHtml(finalAssistantResp.slice(0, 400))}${finalAssistantResp.length > 400 ? '...' : ''}</p>
            </div>
          ` : ''}

          <div style="border-top: 1px solid #334155; padding-top: 14px; text-align: center; font-size: 12px; color: #64748b;">
            تم إرسال هذا البريد تلقائياً من نظام التقييم وتعلّم النماذج في منصة Perplexta.
          </div>
        </div>
      `;

      if (emailSettingsRow?.smtp_host) {
        const sendResult = await sendEmail(adminEmail, emailSubject, emailHtml, null, emailSettingsRow);
        emailSent = !!sendResult.success;
      }
    } catch (err: any) {
      console.warn('[Email] Feedback email notice failed to send:', err.message);
    }

    // 4. Dispatch Admin Notification for all admin users & Socket Broadcast
    try {
      const adminUsers = await pool.query("SELECT id FROM users WHERE role = 'admin'");
      const { createNotification } = await import('../services/notifications.js');
      const { io } = await import('../config/socket.js');

      const titleAr = feedback === 1 
        ? `🌟 إشادة وتقييم إيجابي جديد للمساعد (${numRating}★)` 
        : `⚠️ تقرير عدم إعجاب وملاحظة تصحيح للمساعد`;
      const titleEn = feedback === 1 
        ? `🌟 New Positive AI Feedback (${numRating}★)` 
        : `⚠️ New AI Dislike & Correction Report`;

      const msgAr = feedback === 1
        ? `قام المستخدم (${userName}) بتقديم تقييم إيجابي (${numRating} نجوم): ${comment || (tags && tags.length ? tags.join('، ') : 'إشادة بالأداء')}`
        : `قام المستخدم (${userName}) بالإبلاغ عن مشكلة: ${reason || 'عدم رضا'} - ${comment || 'يرجى مراجعة التقرير'}`;
      const msgEn = feedback === 1
        ? `User (${userName}) rated response with ${numRating} stars: ${comment || (tags && tags.length ? tags.join(', ') : 'Great result')}`
        : `User (${userName}) reported an issue: ${reason || 'Unsatisfied'} - ${comment || 'Please review'}`;

      const metadataObj = {
        type: 'email_feedback',
        feedback_type: feedbackType,
        rating: numRating,
        reason: reason || null,
        comment: comment || null,
        tags: tags || [],
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        message_id: messageId,
        chat_id: chatId,
        email_sent: emailSent,
        email_recipient: adminEmail,
        created_at: new Date().toISOString()
      };

      for (const admin of adminUsers.rows) {
        await createNotification(admin.id, 'admin_email_feedback', titleEn, titleAr, msgEn, msgAr, metadataObj);
      }

      if (io) {
        io.emit('admin_email_feedback', metadataObj);
        io.to('admin').emit('notification', {
          type: 'admin_email_feedback',
          title_ar: titleAr,
          title_en: titleEn,
          message_ar: msgAr,
          message_en: msgEn,
          metadata: metadataObj,
          created_at: new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.warn('[Notification] Failed to dispatch admin feedback alert:', err.message);
    }

    // 5. Save in ai_feedback_logs
    await pool.query(`
      INSERT INTO ai_feedback_logs (
        message_id, chat_id, user_id, user_email, user_name, feedback_type,
        rating, reason, comment, tags, user_prompt, assistant_response,
        email_sent, email_recipient, model_reinforced
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    `, [
      messageId,
      chatId || null,
      userId,
      userEmail,
      userName,
      feedbackType,
      numRating,
      reason || null,
      comment || null,
      JSON.stringify(tags || []),
      finalPrompt || null,
      finalAssistantResp || null,
      emailSent,
      adminEmail,
      true
    ]).catch((err: any) => {
      console.warn('[Feedback Logs] Failed to record log entry:', err.message);
    });

    return res.json({
      success: true,
      feedback,
      rating: numRating,
      reinforced: true,
      emailSent,
      message: feedback === 1 
        ? 'تم تثبيت قدرات النموذج وإشعار الإدارة بنجاح' 
        : 'تم تزويد المساعد بالملاحظة ليتعلم منها وإشعار الإدارة'
    });
  } catch (error: any) {
    console.error('[Feedback API Error]:', error);
    res.status(500).json({ error: error.message || 'Failed to submit feedback' });
  }
});

router.delete("/:messageId", authenticateToken, async (req: any, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const authCheck = await checkMessageOwnership(messageId, userId);
    if (!authCheck.success) {
      return res.status(authCheck.status!).json({ error: authCheck.error });
    }

    await pool.query('DELETE FROM messages WHERE id = $1', [messageId]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete message' });
  }
});

router.delete("/branch/:chatId/:messageId", authenticateToken, async (req: any, res) => {
  try {
    const { chatId, messageId } = req.params;
    const userId = req.user.id;

    if (!pool) throw new Error('Database initializing');

    const chatCheck = await pool.query('SELECT user_id FROM chats WHERE id = $1', [chatId]);
    if (chatCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const chatOwnerId = chatCheck.rows[0].user_id;
    if (chatOwnerId !== parseInt(userId) && chatOwnerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await pool.query(`
      DELETE FROM messages 
      WHERE chat_id = $1 
        AND created_at >= (SELECT created_at FROM messages WHERE id = $2)
    `, [chatId, messageId]);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to truncate branch' });
  }
});

export default router;
