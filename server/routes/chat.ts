import express from 'express';
import { pool } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { chatLimiter } from '../middleware/rateLimit.js';
import { verifyBillingFunds } from '../middleware/billing.js';
import { 
  generateChatTitle, 
  createChat, 
  getUserChats, 
  getUserChatById,
  getChatMessages, 
  addChatMessage, 
  getMessageCount,
  deleteUserChat,
  togglePinMessage,
  updateUserChatTitle,
  updateUserChatContextSummary
} from '../services/chat.js';
import { VideoResourceProvider } from '../services/videoResourceProvider.js';
import { validatePromptLength } from '../utils/security.js';
import { extractFollowUps, extractImmediateChatTitle } from '../utils/helpers.js';
import { getUserWallet } from '../services/wallet.js';
import { userLoader, subscriptionLoader } from '../db/queries.js';
import { getCache, setCache, delCache } from '../utils/cache.js';

const router = express.Router();

const checkActiveSubscription = async (userId: number): Promise<boolean> => {
  const [user, sub] = await Promise.all([
    userLoader.load(userId),
    subscriptionLoader.load(userId)
  ]);
  if (!user) return false;
  if (user.role === 'admin') return true;

  if (sub && sub.status === 'active' && (!sub.current_period_end || new Date(sub.current_period_end) > new Date())) {
    return true;
  }

  return false;
};

router.post("/", authenticateToken, chatLimiter, async (req: any, res) => {
  try {
    const hasActiveSub = await checkActiveSubscription(req.user.id);
    if (!hasActiveSub) {
      return res.status(403).json({ 
        error: 'subscription_required', 
        code: 'PLAN_REQUIRED',
        message: 'يرجى اختيار باقة اشتراك للبدء في استخدام المنصة.',
        message_en: 'Please choose a subscription plan to start using the platform.',
        redirect: '/subscription'
      });
    }
    const { title, message, tool } = req.body;
    if (message) {
      try {
        validatePromptLength(message);
      } catch (err: any) {
        return res.status(400).json(JSON.parse(err.message));
      }
    }
    const resolvedTitle = (title && title.trim()) ? title.trim() : (message ? extractImmediateChatTitle(message) : undefined);
    const chat = await createChat(req.user.id, resolvedTitle);
    delCache(`chats:user:${req.user.id}`);
    if (message) {
      await addChatMessage(chat.id, 'user', message, tool);
      generateChatTitle(chat.id, message, req.user.id).catch(err => {
        console.error('[ChatRoute] Background title generation fail on chat create:', err);
      });
    }
    res.json(chat);
  } catch (error: any) {
    const status = error.message === 'Database initializing' ? 503 : 500;
    res.status(status).json({ error: error.message || 'Failed to create chat' });
  }
});

router.get("/", authenticateToken, async (req: any, res) => {
  try {
    const cacheKey = `chats:user:${req.user.id}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    const chats = await getUserChats(req.user.id);
    await setCache(cacheKey, chats, 60);
    res.json(chats);
  } catch (error: any) {
    const status = error.message === 'Database initializing' ? 503 : 500;
    res.status(status).json({ error: error.message || 'Failed to fetch chats' });
  }
});

router.get("/:id", authenticateToken, async (req: any, res) => {
  try {
    const chat = await getUserChatById(req.params.id, req.user.id);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json(chat);
  } catch (error: any) {
    const status = error.message === 'Database initializing' ? 503 : 500;
    res.status(status).json({ error: error.message || 'Failed to fetch chat' });
  }
});

router.post("/:id/messages", authenticateToken, chatLimiter, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const limits = (req as any).subscriptionLimits || { messagesPerDay: 10, activeChats: 1 };
    
    // Check daily message limit
    const today = new Date().toISOString().split('T')[0];
    const msgCountResult = await pool.query(
      `SELECT COUNT(*) as count FROM messages m
       JOIN chats c ON m.chat_id = c.id
       WHERE c.user_id = $1 AND DATE(m.created_at) = $2`,
      [userId, today]
    );
    
    const msgCount = parseInt(msgCountResult.rows[0]?.count || '0');
    if (limits && limits.messagesPerDay && msgCount >= limits.messagesPerDay) {
      return res.status(403).json({
        error: 'daily_limit_exceeded',
        message: `Daily message limit exceeded (${limits.messagesPerDay} messages/day). Upgrade your plan for more.`
      });
    }

    const hasActiveSub = await checkActiveSubscription(req.user.id);
    if (!hasActiveSub) {
      return res.status(403).json({ 
        error: 'subscription_required', 
        code: 'PLAN_REQUIRED',
        message: 'يرجى اختيار باقة اشتراك لإرسال الرسائل.',
        message_en: 'An active subscription is required to send messages.',
        redirect: '/subscription'
      });
    }
    const { role: msgRole, content, tool } = req.body;
    if (msgRole === 'user' && content) {
      try {
        validatePromptLength(content);
      } catch (err: any) {
        return res.status(400).json(JSON.parse(err.message));
      }
    }
    const chatId = req.params.id;
    await addChatMessage(chatId, msgRole, content, tool);
    await delCache(`chat:messages:${chatId}:${req.user.id}`);
    res.json({ success: true });
    const count = await getMessageCount(chatId);
    if (count === 1 && msgRole === 'user') {
      generateChatTitle(chatId, content);
    }
  } catch (error: any) {
    const status = error.message === 'Database initializing' ? 503 : 500;
    res.status(status).json({ error: error.message || 'Failed to add message' });
  }
});

router.get("/:id/messages", authenticateToken, async (req: any, res) => {
  try {
    const cacheKey = `chat:messages:${req.params.id}:${req.user.id}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    const messages = await getChatMessages(req.params.id, req.user.id);
    if (!messages) return res.status(404).json({ error: 'Chat not found' });
    await setCache(cacheKey, messages, 30);
    res.json(messages);
  } catch (error: any) {
    const status = error.message === 'Database initializing' ? 503 : 500;
    res.status(status).json({ error: error.message || 'Failed to fetch messages' });
  }
});

router.post("/:id/messages/:messageId/pin", authenticateToken, async (req: any, res) => {
  try {
    const { id, messageId } = req.params;
    const result = await togglePinMessage(id, messageId, req.user.id);
    if (!result.success) {
      return res.status(403).json({ error: result.error });
    }
    res.json(result);
  } catch (error: any) {
    const status = error.message === 'Database initializing' ? 503 : 500;
    res.status(status).json({ error: error.message || 'Failed to toggle pin state' });
  }
});

router.delete("/:id", authenticateToken, async (req: any, res) => {
  try {
    const success = await deleteUserChat(req.params.id, req.user.id);
    if (!success) return res.status(404).json({ error: 'Chat not found' });
    delCache(`chats:user:${req.user.id}`);
    delCache(`chat:messages:${req.params.id}:${req.user.id}`);
    const { io } = await import('../config/socket.js');
    if (io) {
      io.to(`user_${req.user.id}`).emit('chat_updated', { chatId: req.params.id, deleted: true });
    }
    res.json({ success: true });
  } catch (error: any) {
    const status = error.message === 'Database initializing' ? 503 : 500;
    res.status(status).json({ error: error.message || 'Failed to delete chat' });
  }
});

router.patch("/:id", authenticateToken, async (req: any, res) => {
  try {
    const { title, context_summary } = req.body;
    let success = false;
    let updatedTitle = undefined;
    let updatedContextSummary = undefined;

    if (title !== undefined) {
      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Title is required' });
      }
      success = await updateUserChatTitle(req.params.id, req.user.id, title.trim());
      updatedTitle = title.trim();
    }

    if (context_summary !== undefined) {
      success = await updateUserChatContextSummary(req.params.id, req.user.id, context_summary);
      updatedContextSummary = context_summary;
    }

    if (title === undefined && context_summary === undefined) {
      return res.status(400).json({ error: 'Title or context_summary is required' });
    }

    if (!success) return res.status(404).json({ error: 'Chat not found' });
    delCache(`chats:user:${req.user.id}`);
    const { io } = await import('../config/socket.js');
    if (io && updatedTitle) {
      io.to(`user_${req.user.id}`).emit('chat_title_updated', { chatId: String(req.params.id), title: updatedTitle });
      io.to(`user_${req.user.id}`).emit('chat_updated', { chatId: String(req.params.id) });
    }
    res.json({ success: true, title: updatedTitle, context_summary: updatedContextSummary });
  } catch (error: any) {
    const status = error.message === 'Database initializing' ? 503 : 500;
    res.status(status).json({ error: error.message || 'Failed to update chat' });
  }
});

router.post("/:id/fork", authenticateToken, chatLimiter, async (req: any, res) => {
  try {
    const hasActiveSub = await checkActiveSubscription(req.user.id);
    if (!hasActiveSub) {
      return res.status(403).json({ 
        error: 'subscription_required', 
        code: 'PLAN_REQUIRED',
        message: 'يرجى اختيار باقة اشتراك لمتابعة تفريع المحادثات.',
        message_en: 'An active subscription is required to fork a chat.',
        redirect: '/subscription'
      });
    }

    const chatId = req.params.id;
    const { messageId } = req.body;

    if (!messageId) {
      return res.status(400).json({ error: 'Message ID is required for forking' });
    }

    const chatCheck = await pool.query('SELECT * FROM chats WHERE id = $1', [chatId]);
    if (chatCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Original chat not found' });
    }

    const originalChat = chatCheck.rows[0];
    if (originalChat.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to fork this chat' });
    }

    const msgRes = await pool.query('SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC, id ASC', [chatId]);
    const originalMessages = msgRes.rows;

    const msgIndex = originalMessages.findIndex((m: any) => m.id === parseInt(messageId) || m.id === messageId);
    if (msgIndex === -1) {
      return res.status(404).json({ error: 'Target message not found in this chat' });
    }

    const messagesToCopy = originalMessages.slice(0, msgIndex + 1);

    const userLang = req.user.language || 'en';
    const forkedTitlePrefix = userLang === 'ar' ? 'فرع: ' : 'Forked: ';
    const newTitle = `${forkedTitlePrefix}${originalChat.title || 'Chat'}`.substring(0, 255);

    const newChatRes = await pool.query(
      'INSERT INTO chats (user_id, title, tool_id, tool, context_summary) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, newTitle, originalChat.tool_id || 'chat_fast', originalChat.tool || 'chat_fast', originalChat.context_summary || '']
    );
    const newChat = newChatRes.rows[0];

    for (const msg of messagesToCopy) {
      await pool.query(
        `INSERT INTO messages (
          chat_id, role, content, tool_id, model, tokens_used, feedback, 
          thinking_steps, citations, follow_ups, generation_time, tool, is_pinned
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          newChat.id, msg.role, msg.content, msg.tool_id, msg.model,
          msg.tokens_used, msg.feedback,
          JSON.stringify(msg.thinking_steps || []),
          JSON.stringify(msg.citations || []),
          JSON.stringify(msg.follow_ups || []),
          msg.generation_time, msg.tool, msg.is_pinned
        ]
      );
    }

    delCache(`chats:user:${req.user.id}`);
    const { io } = await import('../config/socket.js');
    if (io) {
      io.to(`user_${req.user.id}`).emit('chat_updated', { chatId: String(newChat.id) });
    }

    res.json(newChat);
  } catch (error: any) {
    const status = error.message === 'Database initializing' ? 503 : 500;
    res.status(status).json({ error: error.message || 'Failed to fork chat' });
  }
});

router.post("/sync-message", authenticateToken, chatLimiter, verifyBillingFunds, async (req: any, res) => {
  let userMessageId = 0;
  let assistantMessageId = 0;
  let messageSaved = false;
  try {
    const hasActiveSub = await checkActiveSubscription(req.user.id);
    if (!hasActiveSub) {
      return res.status(403).json({ 
        error: 'subscription_required', 
        code: 'PLAN_REQUIRED',
        message: 'يرجى اختيار باقة اشتراك لإرسال الرسائل.',
        message_en: 'An active subscription is required to sync messages.',
        redirect: '/subscription'
      });
    }

    const { chatId, content, toolId, modelId, imageSettings, videoSettings, fileData, forensicMode } = req.body;
    if (!chatId || !content) {
      return res.status(400).json({ error: 'chatId and content are required' });
    }

    try {
      validatePromptLength(content);
    } catch (err: any) {
      return res.status(400).json(JSON.parse(err.message));
    }

    const userMsgResult = await pool.query(
      'INSERT INTO messages (chat_id, role, content, tool, tool_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [chatId, 'user', content, toolId || 'chat_fast', toolId || 'chat_fast']
    );
    userMessageId = userMsgResult.rows[0].id;

    // Check if chat title needs immediate extraction/generation on first user message
    try {
      const chatTitleCheck = await pool.query('SELECT title FROM chats WHERE id = $1', [chatId]);
      const currentTitle = chatTitleCheck.rows[0]?.title || '';
      const isGenericTitle = !currentTitle || currentTitle === 'New Chat' || currentTitle === 'محادثة جديدة' || currentTitle === 'New Session' || currentTitle === 'New Conversation';
      
      if (isGenericTitle) {
        const immediateTitle = extractImmediateChatTitle(content);
        await pool.query('UPDATE chats SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [immediateTitle, chatId]);
        delCache(`chats:user:${req.user.id}`);
        const { io } = await import('../config/socket.js');
        if (io) {
          io.to(`user_${req.user.id}`).emit('chat_title_updated', { chatId: String(chatId), title: immediateTitle });
          io.to(`user_${req.user.id}`).emit('chat_updated', { chatId: String(chatId) });
        }
        generateChatTitle(chatId, content, req.user.id).catch(() => {});
      }
    } catch (titleErr) {
      console.warn('[SyncMessage] Title auto-generation check non-fatal error:', titleErr);
    }

    const assistantMsgResult = await pool.query(
      'INSERT INTO messages (chat_id, role, content, tool, tool_id, model) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [chatId, 'assistant', '', toolId || 'chat_fast', toolId || 'chat_fast', modelId]
    );
    assistantMessageId = assistantMsgResult.rows[0].id;

    const { executeTaskLogic } = await import('../services/orchestrator.js');
    const { io } = await import('../config/socket.js');

    if (io) {
      io.to(`user_${req.user.id}`).emit('typing', { isTyping: true, role: 'assistant', name: 'Perplexta' });
    }

    const generationStart = Date.now();

    const result = await executeTaskLogic(
      { 
        tool_id: toolId || 'chat_fast', 
        prompt: content, 
        chat_id: chatId,
        system_prompt: '',
        model_id: modelId,
        image_settings: imageSettings,
        video_settings: videoSettings,
        file_data: fileData,
        forensic_mode: forensicMode,
        assistant_message_id: assistantMessageId
      }, 
      req.user.id, 
      undefined, 
      (chunk) => {
        if (io) {
          io.to(`user_${req.user.id}`).emit('chat_chunk', { chunk, chatId, isFinal: false });
        }
      }
    );

    const generationTimeSeconds = parseFloat(((Date.now() - generationStart) / 1000).toFixed(2));

    const { extractServerThinking } = await import('../utils/thinkingParser.js');
    const thinkingParsed = extractServerThinking(result.raw_result || result.result || '');
    const baseCleanText = thinkingParsed.hasThinking ? thinkingParsed.cleanContent : (result.result || '');

    const { cleanText, followUps } = extractFollowUps(baseCleanText);
    const finalFollowUps = (result.follow_ups && result.follow_ups.length > 0) ? result.follow_ups : followUps;

    let thinkingSteps: any[] = [];
    if (thinkingParsed.hasThinking && thinkingParsed.thinkingContent) {
      thinkingSteps = [{ step: thinkingParsed.thinkingContent, status: 'completed', is_raw_trace: true }];
    } else if (result.thinking_steps && Array.isArray(result.thinking_steps)) {
      thinkingSteps = result.thinking_steps;
    }

    await pool.query(
      'UPDATE messages SET content = $1, generation_time = $2, citations = $3, follow_ups = $4, thinking_steps = $5 WHERE id = $6',
      [cleanText, generationTimeSeconds, JSON.stringify(result.citations || []), JSON.stringify(finalFollowUps || []), JSON.stringify(thinkingSteps), assistantMessageId]
    );
    messageSaved = true;

    // Post-generation hooks
    await pool.query('UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [chatId]);
    delCache(`chats:user:${req.user.id}`);

    if (io) {
      io.to(`user_${req.user.id}`).emit('typing', { isTyping: false, role: 'assistant', name: 'Perplexta' });
      io.to(`user_${req.user.id}`).emit('chat_chunk', { chunk: '', chatId, isFinal: true });
      io.to(`user_${req.user.id}`).emit('chat_response', { 
        result: cleanText, 
        chatId, 
        message_id: assistantMessageId,
        tool: toolId || 'chat_fast',
        generation_time: generationTimeSeconds,
        citations: result.citations || [],
        follow_ups: finalFollowUps || [],
        thinking_steps: thinkingSteps
      });
      io.to(`user_${req.user.id}`).emit('chat_updated');
    }

    const { broadcastAdminStats } = await import('../services/admin.js');
    broadcastAdminStats().catch(err => console.error('[Socket] Failed to broadcast admin stats on sync message:', err));

    res.json({ success: true, messageId: assistantMessageId });
  } catch (error: any) {
    let status = 500;
    let errBody = { error: error.message || 'Failed to sync message in background' };
    let isExpectedBusinessLimit = false;

    try {
      const parsed = JSON.parse(error.message);
      if (parsed.type === 'QUOTA_EXCEEDED' || parsed.type === 'DUPLICATE_REQUEST_IN_FLIGHT') {
        status = 429;
        errBody = parsed;
        isExpectedBusinessLimit = true;
      } else if (parsed.type === 'SYSTEM_INACTIVE') {
        status = 503;
        errBody = parsed;
        isExpectedBusinessLimit = true;
      }
    } catch (_) {}

    if (isExpectedBusinessLimit) {
      console.info(`[SyncMessage Notice]: User ${req.user?.id} received ${(errBody as any).type || 'notice'}: ${(errBody as any).error || error.message}`);
    } else {
      console.error('[SyncMessage Error]:', error);
    }
    
    if (!messageSaved) {
      if (typeof assistantMessageId !== 'undefined' && assistantMessageId > 0) {
        await pool.query('DELETE FROM messages WHERE id = $1', [assistantMessageId]).catch((e: any) => console.error('[SyncMessage] Cleanup assistant empty message failed:', e));
      }
      if (typeof userMessageId !== 'undefined' && userMessageId > 0) {
        await pool.query('DELETE FROM messages WHERE id = $1', [userMessageId]).catch((e: any) => console.error('[SyncMessage] Cleanup user message failed:', e));
      }
    } else {
      console.info('[SyncMessage] Generation succeeded and saved. Skipping deletion cleanup despite post-generation write/socket error.');
    }

    res.status(status).json(errBody);
  }
});

export default router;
