import express from 'express';
import { pool } from '../db/index.js';
import { io } from '../config/socket.js';
import { callAIProvider, getProviderKey, getProviderUrlKey, invalidateVaultCache } from './ai.js';
import { checkAndIncrementQuota, incrementUserUsage, getToolFriendlyName } from './quota.js';
import { logSecurityAlert, logSystemActivity } from './notifications.js';
import { forensicScanPDF } from './extractor.js';
import { perplextaTTS } from './tts.js';
import { isExplicitSearchRequested, REALTIME_SEARCH_KEYWORDS } from '../config/searchKeywords.js';
import { performPerplextaSearch } from './search.js';
import { getAppName } from './system.js';
import { extractFollowUps, normalizeArabicNumerals } from '../utils/helpers.js';
import { buildSystemPrompt } from '../config/protocol.js';
import { executeWithBillingMiddleware } from './billing.js';
import { getEconomySettings } from './wallet.js';
import { OrchestratorRegistry } from './orchestratorRegistry.js';
import { withTimeout, safeDecrementOnFailure, safeParseResponse, AI_CALL_TIMEOUT_MS, TTS_TIMEOUT_MS, STT_TIMEOUT_MS } from './tasks/utils.js';
import { sanitizeHTMLAndXSS, validatePromptLength, MAX_CUMULATIVE_HISTORY_CHARS, MAX_DOC_EXTRACT_SIZE } from '../utils/security.js';
import { userLoader, getCachedOrchestratorConfig, getCachedSystemSettings, getCachedApiKeysVault, invalidateApiKeysVaultCache, invalidateOrchestratorConfigCache } from '../db/queries.js';
import { acquireInFlightLock, releaseInFlightLock } from '../utils/inFlightLock.js';
import { extractDirectUserMemories, updateChatContextSummary, consolidateAllUserMemories, addMemory } from './memory.js';
import { scanForPromptInjection, redactInternalArtifacts } from './securitySanitizer.js';

export { extractDirectUserMemories, updateChatContextSummary };

const MEMORY_TAG_REGEX = /<extracted_memory(?:\s+category\s*=\s*["']?([^"'>]+)["']?)?\s*>([\s\S]*?)<\/extracted_memory>/gi;
const SEARCH_TAG_REGEX = /<search_query>([\s\S]*?)<\/search_query>/gi;
const WIKI_TAG_REGEX = /<wiki_search>([\s\S]*?)<\/wiki_search>/gi;
const MAPS_TAG_REGEX = /<maps_search>([\s\S]*?)<\/maps_search>/gi;
const CONSOLIDATE_TAG_REGEX = /<consolidate_memory>([\s\S]*?)<\/consolidate_memory>/gi;
const TASK_TAG_REGEX = /<task_dispatch>([\s\S]*?)<\/task_dispatch>/gi;
const AUTH_TAG_REGEX = /<auth_token>([\s\S]*?)<\/auth_token>/gi;

const UPDATE_SUMMARY_LIMIT = 20;
const UPDATE_SUMMARY_TIMEOUT_MS = 30000;

async function recordProviderUsage(provider: string, route: any) {
  try {
    const estimatedCost = 0.01;
    if (estimatedCost > 0) {
      await pool.query(
        'UPDATE api_keys_vault SET used_today = used_today + $1, updated_at = CURRENT_TIMESTAMP WHERE provider = $2',
        [estimatedCost, provider.toLowerCase()]
      );
    }
  } catch (err) {
    console.error('[Orchestrator] Failed to record provider usage:', err);
  }
}

export const isSocialGreeting = (text: string): boolean => {
  if (!text || typeof text !== 'string') return true;
  const cleaned = text.trim().toLowerCase().replace(/[^\w\s\u0600-\u06FF]/gi, '');
  if (cleaned.length === 0) return true;
  if (cleaned.length < 4) return true;

  const socialKeywords = [
    'مرحبا', 'مرحبتين', 'سلام', 'سلامات', 'السلام عليكم', 'وعليكم السلام', 'كيفك', 'كيف حالك', 'شخبارك', 'كيف الحال',
    'شكرا', 'شكراً', 'شكرا جزيلا', 'تسلم', 'يسلمو', 'اهلين', 'اهلا', 'أهلا', 'أهلاً', 'هلا', 'هلا والله', 'يا هلا', 'حياك', 'حياك الله',
    'مساء الخير', 'مساء اليخر', 'مسا الخير', 'مساء النور', 'مساء الورد', 'مساكم الله بالخير', 'مسا الورد',
    'صباح الخير', 'صباح النور', 'صباح الورد', 'صباح الفل', 'صبحت بالخير',
    'يعطيك العافية', 'الله يعافيك', 'منور', 'تحياتي', 'كل عام وانتم بخير', 'جمعة مباركة', 'عاش من شافك',
    'hi', 'hello', 'hey', 'hey there', 'how are you', 'howdy', 'whats up', 'sup', 'thanks', 'thank you',
    'good morning', 'good evening', 'good afternoon', 'good night', 'bye', 'goodbye', 'test', 'ping', 'مستعد'
  ];

  if (cleaned.length <= 35) {
    if (socialKeywords.some(kw => cleaned === kw || cleaned.startsWith(kw) || cleaned.includes(kw))) {
      return true;
    }
  }

  return false;
};

function scheduleChatSummaryUpdate(chatIdNum: number, userId: number) {
  setImmediate(() => {
    updateChatContextSummary(chatIdNum, userId).catch(err => {
      console.error('[Orchestrator Task Scheduler] Progressive summarization error:', err);
      logSystemActivity(userId, 'SUMMARIZATION_FAILED', `Context summary update failed for chat ${chatIdNum}: ${err.message}`, { chatIdNum }).catch(() => {});
    });
  });
}

function scheduleMemoryConsolidation(userId: number) {
  setImmediate(() => {
    consolidateAllUserMemories({ targetUserId: userId, threshold: 10 }).catch(err => {
      console.error('[Orchestrator Task Scheduler] Memory consolidation error:', err);
      logSystemActivity(userId, 'MEMORY_CONSOLIDATION_FAILED', `Memory consolidation failed for user ${userId}: ${err.message}`, { userId }).catch(() => {});
    });
  });
}

function getDynamicHistoryLimit(totalMessages: number, maxDepth: number = 16): number {
  if (totalMessages <= 4) return Math.min(4, maxDepth);
  if (totalMessages <= 8) return Math.min(6, maxDepth);
  if (totalMessages <= 14) return Math.min(8, maxDepth);
  if (totalMessages <= 30) return Math.min(12, maxDepth);
  return maxDepth;
}

import { extractServerThinking } from '../utils/thinkingParser.js';

export function cleanAIOutput(text: string): string {
  if (!text) return '';
  
  // Advanced regex to strip all variations of thinking/reasoning tags
  const THINK_PATTERNS = [
    /<thinking>[\s\S]*?<\/thinking>/gi,
    /<think>[\s\S]*?<\/think>/gi,
    /:think>[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi,
    /【[\s\S]*?】/g, 
    /\[Reasoning\][\s\S]*?\[\/Reasoning\]/gi
  ];

  let cleaned = text;
  THINK_PATTERNS.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  return cleaned
    .replace(MEMORY_TAG_REGEX, '')
    .replace(SEARCH_TAG_REGEX, '')
    .replace(WIKI_TAG_REGEX, '')
    .replace(MAPS_TAG_REGEX, '')
    .replace(CONSOLIDATE_TAG_REGEX, '')
    .replace(TASK_TAG_REGEX, '')
    .replace(AUTH_TAG_REGEX, '')
    .trim();
}

export const executeTaskLogic = async (reqBody: any, userId: number, req?: express.Request, onChunk?: (chunk: string) => void, socket?: any) => {
  let { tool_id, prompt, chat_id, file_data, audio_settings } = reqBody;
  let toolIdStr = (tool_id as string) || 'chat_fast';

  const chatIdNum = chat_id ? parseInt(chat_id) : 0;
  const isChatOnly = ['chat_fast', 'chat_pro', 'chat_reasoning'].includes(toolIdStr);
  const isDedicatedSearchTool = ['sovereign_search', 'search', 'deep_research'].includes(toolIdStr);
  let searchCitations: any[] = [];

  // Protect against excessive lengths to ensure fair use and stability
  validatePromptLength(prompt);

  // Eliminate malicious scripts, XSS triggers, and tag injections early
  const securedUserPrompt = sanitizeHTMLAndXSS(prompt);

  const sanitizePrompt = (p: string) => {
    if (!p) return p;
    return p.replace(/(SYSTEM[ _]MEMORY[ _]INGESTION|LIVE[ _]WEB[ _]CONTEXT|USER[ _]PROMPT|TECHNICAL[ _]DIRECTIVE|ASSISTANT[ _]MEMORY[ _]RECORDS|CONVERSATION[ _]CONTEXT[ _]SUMMARY):/gi, '[CLEANED_MARKER]');
  };

  const cleanUserPrompt = sanitizePrompt(securedUserPrompt);
  let finalPrompt = cleanUserPrompt;

  if (file_data && file_data.data) {
    try {
      const fileBuffer = Buffer.from(file_data.data, 'base64');
      const isImageVideoAudio = file_data.type?.startsWith('image/') || file_data.type?.startsWith('video/') || file_data.type?.startsWith('audio/');

      if (file_data.type === 'application/pdf') {
        try {
          const forensicReport = forensicScanPDF(fileBuffer);
          const forensicPromptSegment = `
[PDF BRIDGE - DEEP FORENSIC AUDIT DISCLOSURE]
The user attached a sensitive document evaluated under the PDF Bridge's Forensic Mode. Review and analyze the structural layout, extracted metadata, and anomalies documented below:

- PDF Version: ${forensicReport.pdfVersion}
- Password Encrypted: ${forensicReport.isEncrypted ? 'YES' : 'NO'}
- Total Parsed Objects: ${forensicReport.totalObjectsCount}
- Compressed Streams (Flate): ${forensicReport.flateStreamsCount}
- Optional Content Groups (Hidden Layers): ${forensicReport.optionalContentGroupsCount} [${forensicReport.hiddenLayers.join(', ')}]
- Interactive JavaScript Definitions Count: ${forensicReport.interactiveJavascriptCount}
- Embedded Internal Files: ${forensicReport.embeddedFilesCount}
- Hyperlinks/URI targets: ${forensicReport.actionsUriCount}
- Modification State (Trailer Markers count): ${forensicReport.incrementalEofCount} (Multiple modifications: ${forensicReport.incrementalEofCount > 1 ? 'YES' : 'NO'})
- Duplicate Page Root Registries Count: ${forensicReport.rootDefCount}

Detailed Scanner Diagnostics:
${forensicReport.detailedLog.map((log: string) => `  • ${log}`).join('\n')}

System-Level Anomalies:
${forensicReport.anomalies.length > 0 ? forensicReport.anomalies.map((a: string) => `  ⚠️ [ANOMALY] ${a}`).join('\n') : "  No critical binary anomalies detected."}

Instruction: You MUST explicitly disclose this forensic audit to the user. Describe the detected metadata, verify the existence of hidden layers or OCG names, and raise any security warnings (for active scripts, incremental amendments, etc.) before or alongside your standard content evaluation.
`;
          finalPrompt = `${finalPrompt}\n\n${forensicPromptSegment}`;
        } catch (err: any) {
          console.error('[Orchestrator Forensic Engine] Base64 PDF forensic scan failed:', err.message);
        }
      }

      const shouldExtractText = !isImageVideoAudio;
      if (shouldExtractText) {
        const { extractTextFromBuffer } = await import('./extractor.js');
        let extractedText = await extractTextFromBuffer(fileBuffer, file_data.type || '', file_data.name);
        if (extractedText && extractedText.trim() !== '') {
          // Truncate document outputs to fit standard safe model processing constraints under Google/Gemini bounds
          if (extractedText.length > MAX_DOC_EXTRACT_SIZE) {
            extractedText = extractedText.substring(0, MAX_DOC_EXTRACT_SIZE) + 
              "\n\n[TRUNCATED: Text content truncated to 60,000 characters to ensure system stability under Google/Gemini Fair Use limits]\n[تم تقليص النص إلى 60,000 حرفاً لضمان استقرار الخدمة وسياسة الاستخدام العادل لجوجل]";
          }
          const contentHeader = file_data.type === 'application/pdf'
            ? `[PDF CONTENT EXTRACTED - ${file_data.name}]`
            : `[FILE CONTENT - ${file_data.name}]`;
          finalPrompt = `${finalPrompt}\n\n${contentHeader}:\n${extractedText}`;
        }
      }
    } catch (err: any) {
      console.error('[Orchestrator File Extraction] Error parsing attached file buffer:', err);
    }
  }

  if (!pool) throw new Error('System still initializing. Please wait.');

  const [rawRouteConfig, chatRes, user, activeKeys, memoryRes, systemSettings] = await Promise.all([
    getCachedOrchestratorConfig(toolIdStr),
    chatIdNum > 0 ? pool.query('SELECT context_summary FROM chats WHERE id = $1 AND user_id = $2', [chatIdNum, userId]) : Promise.resolve({ rows: [] }),
    userLoader.load(userId),
    getCachedApiKeysVault(),
    pool.query(
      `SELECT fact FROM chat_memories
       WHERE user_id = $1
       ORDER BY
         CASE WHEN chat_id = $2 THEN 0 ELSE 1 END ASC,
         created_at DESC
       LIMIT 50`,
      [userId, chatIdNum]
    ).catch(() => ({ rows: [] })),
    getCachedSystemSettings().catch(() => ({ memory_limit_per_user: 48 }))
  ]);

  const memoryLimit = systemSettings?.memory_limit_per_user || 48;

  const isGpuComputeTool = ['vision', 'perplexta_vision', 'image', 'video'].includes(toolIdStr);
  const isAudioTool = ['tts', 'stt', 'perplexta_music'].includes(toolIdStr);

  let route = rawRouteConfig;

  if (isGpuComputeTool) {
    if (!route || !route.primary_provider || !route.primary_model || !route.is_active) {
      await logSystemActivity(userId, 'INACTIVE_GPU_TOOL_ACCESS', `User attempted to access GPU tool "${toolIdStr}" but it is currently unconfigured or inactive in the Tool Orchestrator.`, { toolId: toolIdStr });
      throw new Error(JSON.stringify({
        error: `Specialized GPU tool "${toolIdStr}" is currently unconfigured or inactive. Please configure a designated GPU node and model in the Orchestrator via GPU Infrastructure.`,
        error_ar: `أداة الـ GPU المتخصصة "${toolIdStr}" غير مهيأة أو معطلة حالياً. يرجى تعيين خادم GPU ونموذج مناسب في موجه النماذج (الأوركسترا) من لوحة التحكم.`,
        type: "SYSTEM_INACTIVE"
      }));
    }
  } else if (isAudioTool) {
    if (!route || !route.primary_provider || !route.primary_model || !route.is_active) {
      throw new Error(JSON.stringify({
        error: `Specialized audio tool "${toolIdStr}" is currently unconfigured or inactive in the Tool Orchestrator. Please configure a designated audio provider and model in the Orchestrator.`,
        error_ar: `أداة الصوتيات المتخصصة "${toolIdStr}" غير مهيأة أو معطلة حالياً في الأوركسترا. يرجى تعيين المزود والنموذج المخصص من لوحة التحكم.`,
        type: "SYSTEM_INACTIVE"
      }));
    }
  } else {
    if (activeKeys.length === 0) {
      throw new Error(JSON.stringify({
        error: "The intelligence core is currently undergoing a scheduled synchronization. Operations will resume momentarily.",
        error_ar: "نظام الذكاء الاصطناعي يخضع حالياً لمزامنة مبرمجة. ستستأنف العمليات خلال لحظات.",
        type: "SYSTEM_INACTIVE"
      }));
    }

    if (!route || !route.primary_provider || !route.primary_model) {
      if (activeKeys.length > 0) {
        const activeProvider = activeKeys.find((k: any) => k.models && k.models.length > 0) || activeKeys[0];
        if (activeProvider && activeProvider.models && activeProvider.models.length > 0) {
          const textModel = activeProvider.models.find((m: any) => {
            const id = (m.id || m.name || (typeof m === 'string' ? m : '')).toLowerCase();
            const methods = m.supportedMethods || m.supportedGenerationMethods || [];
            const supportsText = methods.length === 0 || methods.includes('generateContent');
            return supportsText && !id.includes('tts') && !id.includes('image') && !id.includes('embedding') && !id.includes('transcribe') && !id.includes('robotics') && !id.includes('computer-use') && !id.includes('antigravity') && !id.includes('deep-research');
          }) || activeProvider.models[0];

          const modelId = textModel.id || textModel.name || (typeof textModel === 'string' ? textModel : '');
          const providerName = activeProvider.provider;

        if (modelId && providerName) {
          route = {
            tool_id: toolIdStr,
            primary_provider: providerName,
            primary_model: modelId,
            is_active: true,
            max_history_depth: 16,
            system_prompt: '',
            temperature: 0.7,
            top_p: 0.95
          };

          // Dynamically persist to tool_orchestrator table in PostgreSQL
          pool.query(`
            INSERT INTO tool_orchestrator (tool_id, primary_provider, primary_model, is_active, updated_at)
            VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)
            ON CONFLICT (tool_id) DO UPDATE
            SET primary_provider = CASE WHEN tool_orchestrator.primary_provider IS NULL OR tool_orchestrator.primary_provider = '' THEN EXCLUDED.primary_provider ELSE tool_orchestrator.primary_provider END,
                primary_model = CASE WHEN tool_orchestrator.primary_model IS NULL OR tool_orchestrator.primary_model = '' THEN EXCLUDED.primary_model ELSE tool_orchestrator.primary_model END,
                is_active = true,
                updated_at = CURRENT_TIMESTAMP
          `, [toolIdStr, providerName, modelId]).catch((dbErr: any) => {
            console.warn('[Orchestrator] Dynamic route persistence notice:', dbErr?.message || dbErr);
          });
          invalidateOrchestratorConfigCache(toolIdStr);
        }
      }
    }
  }
}

  if (!route || !route.primary_provider || !route.primary_model) {
    await logSystemActivity(userId, 'INACTIVE_TOOL_ACCESS', `User attempted to access tool "${toolIdStr}" but it is currently inactive or undergoing maintenance.`, { toolId: toolIdStr });
    throw new Error(JSON.stringify({
      error: "This specialized service is temporarily unavailable for optimization. Our engineers have been notified.",
      error_ar: "هذه الخدمة المتخصصة غير متاحة مؤقتاً لأغراض التحسين. تم إخطار مهندسينا بالفعل.",
      type: "SYSTEM_INACTIVE"
    }));
  }

  // 0. Zero-Knowledge Pre-Flight Security Gate (Blocks adversarial probing & prompt injection at the network gate)
  const injectionScan = scanForPromptInjection(cleanUserPrompt);
  if (injectionScan.blocked) {
    const userRes = await pool.query('SELECT language FROM users WHERE id = $1', [userId]).catch(() => ({ rows: [] }));
    const isAr = (userRes.rows[0]?.language || 'ar') === 'ar';
    const blockedMsg = isAr ? injectionScan.responseAr! : injectionScan.responseEn!;

    if (onChunk) {
      onChunk(blockedMsg);
    }
    return {
      result: blockedMsg,
      citations: [],
      follow_ups: [],
      provider: 'perplexta_shield',
      model: 'zero_knowledge_defense',
      apiKey: ''
    };
  }

  // In-Flight Request Deduplication Check
  const lockAcquired = acquireInFlightLock(userId, toolIdStr, finalPrompt);
  if (!lockAcquired) {
    const userRes = await pool.query('SELECT language FROM users WHERE id = $1', [userId]).catch(() => ({ rows: [] }));
    const isAr = (userRes.rows[0]?.language || 'ar') === 'ar';
    throw new Error(JSON.stringify({
      error: `An identical '${toolIdStr}' generation request is already in progress. Please wait for it to finish.`,
      error_ar: `هناك طلب توليد متطابق قيد المعالجة حالياً لنفس النص بنفس الأداة ('${toolIdStr}'). يرجى الانتظار لحين اكتمال الطلب الأول.`,
      type: "DUPLICATE_REQUEST_IN_FLIGHT"
    }));
  }

  try {
    const quotaCheck = await checkAndIncrementQuota(userId, toolIdStr);

    if (!quotaCheck.allowed) {
      const userRes = await pool.query('SELECT language FROM users WHERE id = $1', [userId]).catch(() => ({ rows: [] }));
      const isAr = (userRes.rows[0]?.language || 'ar') === 'ar';
      const friendlyNameAr = getToolFriendlyName(toolIdStr, 'ar');
      const friendlyNameEn = getToolFriendlyName(toolIdStr, 'en');

      if (quotaCheck.period === 'plan_required') {
        throw new Error(JSON.stringify({
          error: `Please select a subscription plan to start using "${friendlyNameEn}".`,
          error_ar: `يرجى اختيار باقة اشتراك لبدء استخدام أداة "${friendlyNameAr}".`,
          type: "PLAN_REQUIRED",
          limit: 0,
          currentUsage: 0,
          period: "plan_required",
          tool: toolIdStr,
          toolName: isAr ? friendlyNameAr : friendlyNameEn,
          redirect: '/subscription'
        }));
      }

      const periodLabelAr = quotaCheck.period === 'monthly' ? 'الشهري' : 'اليومي';
      const periodLabelEn = quotaCheck.period === 'monthly' ? 'monthly' : 'daily';
      const limitVal = quotaCheck.limit !== undefined ? quotaCheck.limit : 0;
      const currentVal = quotaCheck.currentUsage !== undefined ? quotaCheck.currentUsage : limitVal;

      throw new Error(JSON.stringify({
        error: `You have reached the ${periodLabelEn} limit for "${friendlyNameEn}"`,
        error_ar: `لقد استنفدت الحد ${periodLabelAr} المتاح لأداة "${friendlyNameAr}"`,
        type: "QUOTA_EXCEEDED",
        limit: limitVal,
        currentUsage: currentVal,
        period: quotaCheck.period,
        tool: toolIdStr,
        toolName: isAr ? friendlyNameAr : friendlyNameEn,
        redirect: '/subscription'
      }));
    }

  return await executeWithBillingMiddleware(
    userId,
    toolIdStr,
    finalPrompt,
    quotaCheck,
    async (updateCostProgress, onSuccess, walletCharged) => {
      let history: { role: string; content: string }[] = [];
  if (chatIdNum > 0) {
    try {
      const maxDepth = route?.max_history_depth || 16;
      const historyRes = await pool.query(
        "SELECT role, content FROM messages WHERE chat_id = $1 AND content IS NOT NULL AND content != '' ORDER BY created_at DESC LIMIT $2",
        [chatIdNum, maxDepth]
      );
      let rawHistory = [...historyRes.rows].reverse();
      const historyLimit = getDynamicHistoryLimit(rawHistory.length, maxDepth);
      if (rawHistory.length > historyLimit) {
        rawHistory = rawHistory.slice(rawHistory.length - historyLimit);
      }
      if (rawHistory.length > 0 && rawHistory[rawHistory.length - 1].role === 'user') {
        rawHistory.pop();
      }
      let cumulativeHistoryChars = 0;
      const boundedHistory: { role: string; content: string }[] = [];
      // Traverse history backward to keep only the newest messages that safely fit context size limits
      for (let i = rawHistory.length - 1; i >= 0; i--) {
        const m = rawHistory[i];
        const msgContent = m.content || '';
        if (cumulativeHistoryChars + msgContent.length > MAX_CUMULATIVE_HISTORY_CHARS) {
          console.warn(`[History Security Shield] Chat thread history length reached fair use ceiling (${cumulativeHistoryChars} chars). Truncating past conversation segments.`);
          break;
        }
        cumulativeHistoryChars += msgContent.length;
        boundedHistory.unshift({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: msgContent
        });
      }
      history = boundedHistory;
    } catch (err) {
      console.error('[Orchestrator] Failed to fetch chat history:', err);
    }
  }

  let userLang: 'ar' | 'en' = 'ar';
  let userContext: any = undefined;

  // Detect language dynamically from the current user prompt
  const arabicChars = (cleanUserPrompt.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length;
  const latinChars = (cleanUserPrompt.match(/[a-zA-Z]/g) || []).length;
  const promptIsArabic = arabicChars > 0 && arabicChars >= latinChars * 0.25;

  try {
    const userRes = await pool.query(
      `SELECT u.id, u.name, u.email, u.language,
              bp.id AS page_id, bp.name AS page_name, bp.slug AS page_slug
       FROM users u
       LEFT JOIN bulletin_pages bp ON bp.user_id = u.id
       WHERE u.id = $1
       ORDER BY bp.id ASC
       LIMIT 1`,
      [userId]
    );
    const uRow = userRes.rows[0];
    if (uRow) {
      if (promptIsArabic) {
        userLang = 'ar';
      } else if (latinChars > arabicChars * 2) {
        userLang = 'en';
      } else {
        userLang = uRow.language === 'ar' ? 'ar' : 'en';
      }
      const cleanName = uRow.name || uRow.email?.split('@')[0] || '';
      userContext = {
        userName: cleanName,
        viralbookProfileUrl: uRow.id ? `https://perplexta.com/viralbook/u/${uRow.id}` : 'https://perplexta.com/viralbook',
        viralbookPageUrl: uRow.page_slug ? `https://perplexta.com/viralbook/p/${uRow.page_slug}` : (uRow.page_id ? `https://perplexta.com/viralbook/p/${uRow.page_id}` : undefined),
        viralbookPageName: uRow.page_name || undefined
      };
    } else {
      userLang = promptIsArabic ? 'ar' : 'en';
    }
  } catch (userQueryErr) {
    console.warn('[Orchestrator] User context query fallback:', userQueryErr);
    userLang = promptIsArabic ? 'ar' : 'en';
  }

  const appName = getAppName(userLang);
  const protocol = buildSystemPrompt(appName, toolIdStr, userLang, userContext);

  const chatWantsSearch = (isDedicatedSearchTool || (isChatOnly && isExplicitSearchRequested(cleanUserPrompt, toolIdStr))) && !isSocialGreeting(cleanUserPrompt);

  if (chatWantsSearch) {
    try {
      if (io) {
        io.to(`user_${userId}`).emit('search_steps', { 
          step: userLang === 'ar' ? 'جاري الاتصال بمحرك البحث وتجميع البيانات الفورية...' : 'Connecting to live web index and harvesting context...', 
          status: 'processing' 
        });
      }
      
      const searchResults = await performPerplextaSearch(cleanUserPrompt);
      if (searchResults && searchResults.length > 0) {
        searchCitations = searchResults.map((r: any, idx: number) => ({
          title: r.title,
          link: r.link || r.url,
          url: r.url || r.link,
          index: idx + 1,
          snippet: r.snippet,
          source: r.source || r.domain || 'Web Source',
          domain: r.domain || 'web'
        }));

        const searchContext = searchCitations.map((c: any) => 
          `[Source ${c.index}]: ${c.title}\nDomain: ${c.domain || c.source}\nURL: ${c.url}\nSnippet: ${c.snippet}`
        ).join('\n\n---\n\n');

        finalPrompt = `[LIVE WEB CONTEXT]\n${searchContext}\n\n[USER QUERY]\n${cleanUserPrompt}`;
        
        if (io) {
          io.to(`user_${userId}`).emit('search_steps', { 
            step: userLang === 'ar' ? 'تم استخراج وتوثيق نتائج البحث الفورية بنجاح' : 'Live web intelligence harvested and indexed successfully.', 
            status: 'completed' 
          });
          io.to(`user_${userId}`).emit('citations', { citations: searchCitations });
        }
      } else {
        if (io) {
          io.to(`user_${userId}`).emit('search_steps', { 
            step: userLang === 'ar' ? 'لم يتم العثور على نتائج بحث مباشرة، جاري تفعيل المرجعية المعرفية المباشرة' : 'No direct web matches cataloged. Utilizing deep internal knowledge bases...', 
            status: 'completed' 
          });
        }
      }
    } catch (searchErr) {
      console.error(`[Orchestrator Search Grounding] Failed:`, searchErr);
    }
  }

  if (toolIdStr === 'image') {
    const handler = await OrchestratorRegistry.getHandler('image');
    const res = await handler({
      reqBody, userId, route, quotaCheck, walletCharged, finalPrompt
    });
    await onSuccess('');
    return res;
  }

  if (toolIdStr === 'tts') {
    try {
      const voiceId = reqBody.voice_id || '21m00Tcm4TlvDq8ikWAM';
      const modelId = route.primary_model;
      const providerId = route.primary_provider.toLowerCase().replace(/\s+/g, '');
      const audioBuffer = await withTimeout(
        perplextaTTS(cleanUserPrompt, voiceId, modelId, providerId),
        TTS_TIMEOUT_MS,
        'tts'
      );

       await recordProviderUsage(providerId, route);

      await logSystemActivity(userId, 'PERPLEXTA_EXECUTION', `TTS generated via ElevenLabs voice=${voiceId}`, { toolIdStr });
      await onSuccess('');

      return { result: audioBuffer.toString('base64'), result_type: 'audio_base64' };
    } catch (ttsErr: any) {
      await safeDecrementOnFailure(quotaCheck, userId, toolIdStr, walletCharged);
      console.error('[Orchestrator TTS] Generation failed:', ttsErr.message);
      throw new Error(JSON.stringify({
        error: `TTS generation failed: ${ttsErr.message}`,
        error_ar: `فشل توليد الصوت: ${ttsErr.message}`,
        type: "GENERATION_ERROR"
      }));
    }
  }

  if (toolIdStr === 'stt') {
    try {
      if (!file_data || !file_data.data) {
        throw new Error('No audio file provided for speech-to-text.');
      }

      const providerId = route.primary_provider.toLowerCase().replace(/\s+/g, '');
      const apiKey = await getProviderKey(providerId);

      if (!apiKey) {
        await safeDecrementOnFailure(quotaCheck, userId, toolIdStr, walletCharged);
        throw new Error(JSON.stringify({
          error: `Speech-to-text service is temporarily unavailable. API key for provider '${providerId}' not found in vault.`,
          error_ar: `خدمة تحويل الصوت إلى نص غير متاحة حالياً. لم يتم العثور على مفتاح API للمزود '${providerId}' في الخزينة.`,
          type: "SYSTEM_INACTIVE"
        }));
      }

      const audioBuffer = Buffer.from(file_data.data, 'base64');
      const formData = new FormData();
      const audioBlob = new Blob([audioBuffer], { type: file_data.type || 'audio/webm' });
      formData.append('file', audioBlob, file_data.name || 'audio.webm');
      formData.append('model', route.primary_model);
      if (cleanUserPrompt) formData.append('prompt', cleanUserPrompt);

      const vaultRow = activeKeys.find(k => k.provider.toLowerCase().replace(/\s+/g, '') === providerId);
      const customUrl = vaultRow ? vaultRow.url_key : (await getProviderUrlKey(providerId));
      const sttEndpoint = customUrl;

      if (!sttEndpoint) {
        throw new Error(`STT Orchestrator: Provider '${providerId}' is missing a registered endpoint URL (url_key) in the vault.`);
      }

      const res = await withTimeout(
        fetch(sttEndpoint, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}` },
          body: formData
        }),
        STT_TIMEOUT_MS,
        'stt'
      );

      const data = await safeParseResponse(res, 'STT API error');
      const transcription = data.text || '';

      await recordProviderUsage(providerId, route);

      await logSystemActivity(userId, 'PERPLEXTA_EXECUTION', `STT transcription via ${route.primary_provider}/${route.primary_model}`, { toolIdStr });
      await onSuccess('');

      return { result: transcription };
    } catch (sttErr: any) {
      await safeDecrementOnFailure(quotaCheck, userId, toolIdStr, walletCharged);
      console.error('[Orchestrator STT] Transcription failed:', sttErr.message);
      throw new Error(JSON.stringify({
        error: `STT transcription failed: ${sttErr.message}`,
        error_ar: `فشل تحويل الصوت إلى نص: ${sttErr.message}`,
        type: "GENERATION_ERROR"
      }));
    }
  }

  if (toolIdStr === 'video') {
    const handler = await OrchestratorRegistry.getHandler('video');
    const res = await handler({
      reqBody, userId, route, quotaCheck, walletCharged, finalPrompt
    });
    await onSuccess('');
    return res;
  }

  if (toolIdStr === 'vision' || toolIdStr === 'perplexta_vision') {
    const handler = await OrchestratorRegistry.getHandler('vision');
    const res = await handler({
      reqBody, userId, route, quotaCheck, walletCharged, finalPrompt
    });
    await onSuccess('');
    return res;
  }

  let userMemoriesStr = '';
  if (memoryRes?.rows?.length > 0) {
    userMemoriesStr = `\n[MEMORY]: ${memoryRes.rows.map((m: any) => m.fact).join('; ')}\n`;
  }

  const taskDesc = userLang === 'ar' ? route.task_description_ar : route.task_description;
  const contextSummary = chatRes.rows[0]?.context_summary 
    ? `\n[CONTEXT]: ${chatRes.rows[0].context_summary}\n`
    : '';

  let refinedSystemPromptSegment = '';

  if (toolIdStr === 'canvas') {
    const audioSet = audio_settings || {};
    let moodLabel = audioSet.mood || 'Epic';
    let durationCount = Number(audioSet.duration || 30);
    let vocalTypeLabel = audioSet.vocalType || 'Instrumental';

    const promptLower = (prompt || '').toLowerCase();
    
    if (promptLower.includes('ملحمية') || promptLower.includes('epic')) moodLabel = 'Epic';
    else if (promptLower.includes('طرب') || promptLower.includes('tarab')) moodLabel = 'Tarab';
    else if (promptLower.includes('تكنو') || promptLower.includes('techno')) moodLabel = 'EDM';

    refinedSystemPromptSegment = `[AUDIO_MODE]: Mood: ${moodLabel}, Vocals: ${vocalTypeLabel}, Duration: ${durationCount}s.
Structure: [I. Cover & Mood Art], [II. Audio Suite Environment], [III. Sonic Orchestration].`.trim();
  } else if (toolIdStr === 'perplexta_analysis') {
    refinedSystemPromptSegment = '[ANALYSIS_MODE]: Perform elite file audit and deep analysis.';
  } else if (toolIdStr === 'code') {
    refinedSystemPromptSegment = `
[DEDICATED CODE & SOFTWARE ENGINEERING DIRECTIVE - MANDATORY COMPLETENESS & ACCURACY]:
1. 100% EXHAUSTIVE IMPLEMENTATION: Deliver complete, production-grade code without any placeholders. NEVER omit code blocks with comments like "// TODO", "// ...", "// implement here", or "// remaining logic".
2. METICULOUS ACCURACY TO REQUEST: Strictly implement every feature, data model, state variable, calculation, edge case, and constraint explicitly or implicitly requested by the user.
3. PRODUCTION STANDARDS: Provide full TypeScript types, robust error handling, edge-case guards, and complete import/export statements.
4. EXPLICIT FILE PATHS & LTR CODE: Every code block MUST have an explicit language fence (\`\`\`typescript, \`\`\`tsx, \`\`\`python, etc.) and begin with the exact file path on line 1 as a comment.`.trim();
  }

  if (chatWantsSearch && searchCitations.length > 0) {
    const searchInstructions = `
[LIVE WEB GROUNDING & CITATION DIRECTIVE]:
Real-time verified web sources have been retrieved for this request and supplied in the context block with indices [1], [2], etc.
1. Synthesize an authoritative, thorough response combining live facts from these web sources with deep reasoning.
2. For any specific fact, statement, figure, price, or date derived from the live sources, reference the exact source using bracketed numbers, e.g., [1] or [1][2] at the end of the clause.
3. Strictly DO NOT write out raw URLs or markdown web links (e.g. [title](url)) in the text; use numeric badges [1] only.
4. If sources cover the topic partially, state the verified findings clearly and provide your comprehensive analysis.`.trim();
    refinedSystemPromptSegment = refinedSystemPromptSegment ? `${refinedSystemPromptSegment}\n${searchInstructions}` : searchInstructions;
  }

  const finalSystemPrompt = `${protocol}
[OBJECTIVE]: ${taskDesc || 'Professional precision execution.'}
${contextSummary}${userMemoriesStr}
${refinedSystemPromptSegment}`.trim();

  const rawModelsToTry = [
    { provider: route.primary_provider, model: route.primary_model },
    { provider: route.fallback_1_provider, model: route.fallback_1_model },
    { provider: route.fallback_2_provider, model: route.fallback_2_model },
    { provider: route.fallback_3_provider, model: route.fallback_3_model }
  ].filter(m => m.provider && m.model);

  // Deduplicate sequential targets to prevent retrying the exact same failed model
  const seenTargets = new Set<string>();
  const modelsToTry = rawModelsToTry.filter(m => {
    const key = `${(m.provider || '').toLowerCase().trim()}:${(m.model || '').toLowerCase().trim()}`;
    if (seenTargets.has(key)) return false;
    seenTargets.add(key);
    return true;
  });

  const vaultMap = new Map<string, any>();
  if (activeKeys && activeKeys.length > 0) {
    for (const key of activeKeys) {
      if (key && key.provider) {
        vaultMap.set(key.provider.toLowerCase().replace(/\s+/g, ''), key);
      }
    }
  }

  let generatedText = '';
  let successfulModel = null;
  let successfulApiKey = '';
  let outerAccumulatedOutput = '';

  for (const target of modelsToTry) {
    const providerId = target.provider.toLowerCase().replace(/\s+/g, '');

    // Sanitize model name to remove redundant provider prefixes if stored in DB incorrectly
    let displayModel = target.model;
    if (displayModel.toLowerCase().startsWith(`${providerId}/`)) {
      displayModel = displayModel.substring(providerId.length + 1);
    }

    try {
        const cachedRow = vaultMap.get(providerId);
        let isProviderActive = true;
        let dailyBudget = 0;
        let usedToday = 0;
        let urlKey: string | null = null;

        if (cachedRow) {
          dailyBudget = parseFloat(cachedRow.daily_budget || '0');
          usedToday = parseFloat(cachedRow.used_today || '0');
          urlKey = cachedRow.url_key;
        }

        const apiKey = await getProviderKey(providerId);
        if (!apiKey) {
          console.warn(`[Orchestrator] No active API key found for provider "${target.provider}". Skipping.`);
          continue;
        }

        if (dailyBudget > 0 && usedToday >= dailyBudget) {
          await logSecurityAlert(userId, 'BUDGET_EXCEEDED', 'medium', `Vault Budget Hit: Provider "${target.provider}" reached its daily budget limit (${usedToday}/${dailyBudget}). Attempting fallback.`, { provider: target.provider, dailyBudget, usedToday });
          continue;
        }

        // Zero-Query Shield: Pre-validate that target.model exists in registered provider models to guarantee zero queries for non-existent models
        if (cachedRow && cachedRow.models) {
          let registeredModels: any[] = [];
          try {
            registeredModels = typeof cachedRow.models === 'string' ? JSON.parse(cachedRow.models) : cachedRow.models;
          } catch {
            registeredModels = [];
          }
          if (Array.isArray(registeredModels) && registeredModels.length > 0) {
            const knownSet = new Set<string>();
            for (const item of registeredModels) {
              const raw = typeof item === 'string' ? item : (item?.id || item?.name || '');
              if (raw) {
                const lower = raw.toLowerCase().trim();
                knownSet.add(lower);
                if (lower.startsWith('models/')) knownSet.add(lower.replace('models/', ''));
                if (lower.includes('/')) knownSet.add(lower.split('/').pop()!);
              }
            }

            const targetLower = target.model.toLowerCase().trim();
            const displayLower = displayModel.toLowerCase().trim();
            const targetNoPrefix = targetLower.replace('models/', '');

            const modelExists = knownSet.has(targetLower) || knownSet.has(displayLower) || knownSet.has(targetNoPrefix);
            if (!modelExists) {
              console.warn(`[Orchestrator Shield] Model "${target.model}" not found in registered models for provider "${target.provider}". Skipping query to prevent 404 error.`);
              continue;
            }
          }
        }

        let isInsideThinkingBlock = false;

        const wrappedOnChunk = (chunk: string) => {
          let sanitizedChunk = '';
          let i = 0;
          
          while (i < chunk.length) {
            if (!isInsideThinkingBlock) {
              const startThink = chunk.indexOf('<think>', i);
              if (startThink !== -1) {
                sanitizedChunk += chunk.substring(i, startThink);
                isInsideThinkingBlock = true;
                i = startThink + 7;
              } else {
                sanitizedChunk += chunk.substring(i);
                break;
              }
            } else {
              const endThink = chunk.indexOf('</think>', i);
              if (endThink !== -1) {
                isInsideThinkingBlock = false;
                i = endThink + 8;
              } else {
                break;
              }
            }
          }
          
          // For chat_reasoning and thinking tags, preserve chunk stream intact so the frontend can display live reasoning
          if (toolIdStr !== 'chat_reasoning' && !sanitizedChunk.includes('<thinking>') && !sanitizedChunk.includes('<think>')) {
            sanitizedChunk = sanitizedChunk
              .replace(/<think>[\s\S]*?<\/think>/gi, '')
              .replace(/:think>[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi, '')
              .replace(/【[\s\S]*?】/g, '')
              .replace(/\[Reasoning\][\s\S]*?\[\/Reasoning\]/gi, '');
          }

          updateCostProgress(sanitizedChunk);
          if (onChunk) onChunk(sanitizedChunk);
        };

        const customTimeoutMs = route.timeout_seconds ? route.timeout_seconds * 1000 : (toolIdStr === 'code' ? 180000 : AI_CALL_TIMEOUT_MS);
        const effectiveTimeoutMs = Math.max(customTimeoutMs, toolIdStr === 'code' ? 180000 : 45000);

        const routeProtoConfig = (route.protocol_config && typeof route.protocol_config === 'object') ? route.protocol_config : {};
        const callOptions = {
          fileData: file_data,
          temperature: typeof routeProtoConfig.temperature === 'number' ? routeProtoConfig.temperature : (toolIdStr === 'code' ? 0.15 : (route.temperature ?? 0.7)),
          topP: typeof routeProtoConfig.top_p === 'number' ? routeProtoConfig.top_p : (route.top_p ?? 0.95),
          maxOutputTokens: typeof routeProtoConfig.max_tokens === 'number' ? routeProtoConfig.max_tokens : (toolIdStr === 'code' ? 16384 : 8192),
          toolId: toolIdStr
        };

        generatedText = await withTimeout(
          callAIProvider(target.provider, target.model, apiKey, finalPrompt, finalSystemPrompt, wrappedOnChunk, history, callOptions, urlKey ?? undefined),
          effectiveTimeoutMs,
          `${target.provider}/${displayModel}`
        );
        successfulModel = target;
        successfulApiKey = apiKey;

        await recordProviderUsage(target.provider, route);

        if (chatIdNum > 0) {
          scheduleChatSummaryUpdate(chatIdNum, userId);
        }

        try {
          // 1. Extract direct user facts from user prompt via Autonomous Local Engine
          const directUserFacts = extractDirectUserMemories(cleanUserPrompt);

          // 2. Extract any tags generated in model output (<extracted_memory>)
          const tagMatches: { fact: string; category: string }[] = [];
          let tagMatch;
          const memTagRegex = new RegExp(MEMORY_TAG_REGEX.source, 'gi');
          while ((tagMatch = memTagRegex.exec(generatedText)) !== null) {
            const category = (tagMatch[1] || 'general').trim().toLowerCase();
            const factText = tagMatch[2]?.trim();
            if (factText && factText.length >= 3) {
              tagMatches.push({ fact: factText, category });
            }
          }

          const allFactsToProcess = [...directUserFacts, ...tagMatches];

          if (allFactsToProcess.length > 0) {
            for (const item of allFactsToProcess) {
              try {
                const savedFact = await addMemory(userId, item.fact, item.category, 'user', chatIdNum || undefined);
                if (savedFact && io) {
                  io.to(`user_${userId}`).emit('memory_extracted', {
                    fact: savedFact.fact,
                    category: savedFact.category,
                    id: savedFact.id
                  });
                }
              } catch (addErr: any) {
                if (addErr.message?.includes('limit reached')) {
                  scheduleMemoryConsolidation(userId);
                  if (io) io.to(`user_${userId}`).emit('memory_warning', { userId });
                }
              }
            }
          }

          generatedText = generatedText.replace(memTagRegex, '').trim();

          // 3. Trigger progressive context summary update for active chat
          if (chatIdNum > 0) {
            scheduleChatSummaryUpdate(chatIdNum, userId);
          }
        } catch (memProcErr) {
          console.error('[Orchestrator] Error during local memory engine extraction:', memProcErr);
        }

        break; // exit trials on model execution success
      } catch (innerErr: any) {
        if (innerErr.message === 'OUT_OF_POINTS_BUDGET_HALT') {
          throw innerErr; // rethrow directly to trigger external abort
        }
        console.error(`[Orchestrator] Failure on ${target.provider}/${displayModel}:`, innerErr);

        const errMessage = innerErr.message || '';
        const isTemporaryRateLimit = 
          errMessage.includes('429') || 
          errMessage.includes('503') ||
          errMessage.toLowerCase().includes('rate limit') || 
          errMessage.toLowerCase().includes('too many requests') || 
          errMessage.toLowerCase().includes('resource_exhausted') || 
          errMessage.toLowerCase().includes('quota') || 
          errMessage.toLowerCase().includes('high demand') ||
          errMessage.toLowerCase().includes('unavailable') ||
          errMessage.toLowerCase().includes('spikes in demand') ||
          errMessage.toLowerCase().includes('overloaded') ||
          errMessage.toLowerCase().includes('generativelanguage');

        if (isTemporaryRateLimit) {
          const statusLabel = errMessage.includes('503') ? '503 high demand' : '429 rate limit / temporary overload';
          console.warn(`[Orchestrator] Temporary ${statusLabel} on provider "${target.provider}" / model "${target.model}". Silently transitioning to next fallback in chain.`);
        }

        const isQuotaOrAuthExhausted =
          !isTemporaryRateLimit && (
            errMessage.includes('401') ||
            errMessage.includes('403') ||
            errMessage.includes('1113') ||
            errMessage.includes('Insufficient balance') ||
            errMessage.includes('resource package') ||
            // errMessage.includes('quota') || // REMOVED: Too aggressive, often temporary
            errMessage.includes('recharge') ||
            errMessage.includes('balance') ||
            errMessage.includes('subscription') ||
            errMessage.includes('upgrade')
          );

        // Key status remains preserved; runtime errors do not deactivate provider keys.
      }
    }

    if (!successfulModel && modelsToTry.length > 0) {
      throw new Error('All models requested under active orchestrator strategies failed to return a validated solution.');
    }



    if (!generatedText) {
      await logSystemActivity(userId, 'ORCHESTRATION_SUSPENDED', `Tool "${toolIdStr}" is temporarily suspended or capacity is hit. No active model connection succeeded.`, { toolIdStr, modelsTried: modelsToTry });

      throw new Error(JSON.stringify({
        error: "The service for this tool is temporarily suspended due to scheduled technical maintenance or capacity limits. Please try again in a few moments.",
        error_ar: "تم إيقاف الخدمة المرتبطة بهذه الأداة مؤقتاً لأغراض الصيانة والتحديث الفني الجاري لتحسين الأداء. يُرجى المحاولة مرة أخرى بعد قليل.",
        type: "SYSTEM_INACTIVE"
      }));
    }

    if (toolIdStr !== 'chat_fast') {
      await logSystemActivity(userId, 'PERPLEXTA_EXECUTION', `Executed specialized tool "${toolIdStr}" using ${successfulModel?.provider}/${successfulModel?.model}`, { toolIdStr, model: successfulModel });
    }

    await onSuccess(generatedText);
    await incrementUserUsage(userId, toolIdStr).catch(() => {});

    const thinkingExtraction = extractServerThinking(generatedText);
    const sanitizedOutput = cleanAIOutput(generatedText);
    const { cleanText, followUps } = extractFollowUps(sanitizedOutput, cleanUserPrompt, userLang, toolIdStr);
    const safeOutputText = redactInternalArtifacts(cleanText);

    return { 
      result: safeOutputText, 
      raw_result: generatedText,
      thinking_content: thinkingExtraction.thinkingContent,
      citations: searchCitations, 
      follow_ups: followUps,
      provider: successfulModel?.provider,
      model: successfulModel?.model,
      apiKey: successfulApiKey
    };
  });
  } finally {
    releaseInFlightLock(userId, toolIdStr, finalPrompt);
  }
};
