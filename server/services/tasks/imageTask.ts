import { pool } from '../../db/index.js';
import { getProviderKey, callAIProvider } from '../ai.js';
import { getSystemSettings } from '../system.js';
import { logSystemActivity } from '../notifications.js';
import { saveGeneratedImageToDisk } from '../files.js';
import { io } from '../../config/socket.js';
import { 
  withTimeout, 
  safeParseResponse, 
  safeDecrementOnFailure, 
  validateProviderCapacity,
  IMG_TIMEOUT_MS,
  getNestedField
} from './utils.js';
import { getEconomySettings } from '../wallet.js';
import { getCachedGpuProviders } from '../gpuVaultService.js';
import { dispatchGpuTask } from '../gpu/gpuTaskDispatcher.js';

import type { TaskExecutionContext } from '../orchestratorRegistry.js';

function resolveImageDimensions(aspectRatio: string): { width: number; height: number } {
  if (aspectRatio === '16:9') {
    return { width: 1344, height: 768 };
  } else if (aspectRatio === '9:16') {
    return { width: 768, height: 1344 };
  } else if (aspectRatio === '21:9') {
    return { width: 1536, height: 640 };
  } else if (aspectRatio === '4:3') {
    return { width: 1152, height: 864 };
  } else if (aspectRatio === '3:4') {
    return { width: 864, height: 1152 };
  } else if (aspectRatio === '3:2') {
    return { width: 1152, height: 768 };
  } else if (aspectRatio === '2:3') {
    return { width: 768, height: 1152 };
  }
  return { width: 1024, height: 1024 };
}

async function executeDynamicImageProtocol(
  protocol: any,
  apiKey: string,
  modelName: string,
  prompt: string,
  aspectRatio: string,
  quality: string,
  style: string,
  signal: AbortSignal
): Promise<string> {
  const method = (protocol.method || 'POST').toUpperCase();
  const endpoint = protocol.endpoint || protocol.init_endpoint || '';
  if (!endpoint) {
    throw new Error('Image Protocol Configuration error: missing endpoint/init_endpoint.');
  }

  const authHeader = protocol.auth_header || 'Authorization';
  const authPrefix = protocol.auth_prefix !== undefined ? protocol.auth_prefix : 'Bearer';
  const authValue = authPrefix ? `${authPrefix} ${apiKey}`.trim() : apiKey;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(protocol.extra_headers || {})
  };
  if (authHeader) {
    headers[authHeader] = authValue;
  }

  const { width, height } = resolveImageDimensions(aspectRatio);

  let body: any;
  if (protocol.body_wrapper === 'version_input') {
    body = {
      version: modelName,
      input: {
        prompt,
        width,
        height,
        aspect_ratio: aspectRatio,
        quality,
        style
      }
    };
  } else {
    body = {
      model: modelName,
      prompt,
      n: 1,
      width,
      height,
      size: `${width}x${height}`,
      response_format: protocol.result_type === 'base64' ? 'b64_json' : 'url',
      aspect_ratio: aspectRatio,
      quality,
      style
    };
  }

  const requestOptions: RequestInit = {
    method,
    headers,
    signal
  };
  if (method !== 'GET') {
    requestOptions.body = JSON.stringify(body);
  }

  const res = await fetch(endpoint, requestOptions);
  const data = await safeParseResponse(res, 'Dynamic Image API Generation request failed');

  if (protocol.type === 'polling' || protocol.poll_endpoint) {
    const taskId = data.id || data.task_id || getNestedField(data, protocol.poll_id_field || 'id');
    if (!taskId) {
      throw new Error('Dynamic polling initialization failed: Task ID is missing from response payload.');
    }

    const pollRawEndpoint = protocol.poll_endpoint || `${endpoint}/${taskId}`;
    const pollEndpoint = pollRawEndpoint.replace('{id}', taskId).replace('{task_id}', taskId);

    const maxPolls = protocol.max_polls || 40;
    const interval = protocol.poll_interval_ms || 2000;
    const successValue = protocol.poll_success_value || 'succeeded';
    const statusField = protocol.poll_status_field || 'status';
    const failValue = protocol.poll_fail_value || 'failed';

    for (let i = 0; i < maxPolls; i++) {
      if (signal.aborted) {
        throw new Error('Image polling timed out or aborted.');
      }
      await new Promise(resolve => setTimeout(resolve, interval));

      const pollRes = await fetch(pollEndpoint, {
        method: 'GET',
        headers: {
          ...(authHeader ? { [authHeader]: authValue } : {}),
          ...(protocol.extra_headers || {})
        },
        signal
      });
      const pollData = await safeParseResponse(pollRes, 'Dynamic polling step failed');
      const status = String(getNestedField(pollData, statusField) || '').toLowerCase();

      if (status === successValue.toLowerCase()) {
        const value = getNestedField(pollData, protocol.result_field || 'output[0]');
        if (!value) {
          throw new Error('Result field was empty on succeeded dynamic poll response.');
        }
        return protocol.result_type === 'base64' ? `data:image/png;base64,${value}` : value;
      }

      if (status === failValue.toLowerCase()) {
        const errorDetail = pollData.error || pollData.message || 'Execution failed';
        throw new Error(`Dynamic API task failed: ${JSON.stringify(errorDetail)}`);
      }
    }
    throw new Error(`Image generation polling timed out after ${maxPolls * interval / 1000} seconds.`);
  }

  const resultField = protocol.result_field || 'data[0].url';
  let value = getNestedField(data, resultField);
  if (!value) {
    value = data?.data?.[0]?.url || data?.data?.[0]?.b64_json || data?.url || data?.image || data?.output?.[0] || data?.output;
  }

  if (!value) {
    throw new Error(`Result field '${resultField}' was empty in dynamic API response.`);
  }

  if (protocol.result_type === 'base64' || (value.length > 1000 && !value.includes(':'))) {
    return value.startsWith('data:') ? value : `data:image/png;base64,${value}`;
  }
  return value;
}

export async function executeImageTask(ctx: TaskExecutionContext): Promise<{ result: string }> {
  const { reqBody, userId, route, quotaCheck, walletCharged } = ctx;
  let { finalPrompt } = ctx;
  const toolIdStr = 'image';

  if (io) {
    io.to(`user_${userId}`).emit('image_progress', {
      progress: 10,
      status: 'analyzing',
      status_ar: 'تحليل المطلب الفني وتجهيز الأنماط العصبية الدقيقة...',
      status_en: 'Evaluating artistic prompt & aligning premium style maps...'
    });
  }

  // Multilingual prompt optimization strictly routed through Orchestrator text intelligence
  const needsTranslation = /[^\x00-\x7F]/.test(finalPrompt);
  if (needsTranslation) {
    try {
      const { getCachedOrchestratorConfig } = await import('../../db/queries.js');
      const textRoute = (await getCachedOrchestratorConfig('chat_fast')) || (await getCachedOrchestratorConfig('perplexta_analysis'));
      
      const provider = textRoute?.primary_provider;
      const model = textRoute?.primary_model;
      
      if (provider && model) {
        const apiKey = await getProviderKey(provider);
        if (apiKey) {
          if (io) {
            io.to(`user_${userId}`).emit('image_progress', {
              progress: 15,
              status: 'translating',
              status_ar: 'جاري مواءمة وتحسين المطلب الفني عبر الأوركسترا...',
              status_en: 'Optimizing artistic prompt via Orchestrator route...'
            });
          }
          const translateSystem = 'You are a professional multilingual translator and prompt optimization engine. Translate non-English prompts to clear, descriptive English for image generation without adding unrequested elements. Return ONLY the translation with zero commentary.';
          const translated = (await withTimeout(
            callAIProvider(
              provider,
              model,
              apiKey,
              `Translate the following prompt into clean, descriptive English for AI image generation:\n"${finalPrompt}"`,
              translateSystem,
              undefined,
              [],
              { temperature: 0.1 }
            ),
            5000,
            'ImagePromptTranslation'
          )) as any as string;
          if (translated && translated.trim()) {
            finalPrompt = translated.trim().replace(/^["']|["']$/g, '');
          }
        }
      }
    } catch (err: any) {
      console.warn('[Image Prompt Translator] Prompt optimization skipped via Orchestrator:', err.message);
    }
  }

  const imageSettings = reqBody.image_settings || {};
  const selectedRatio = String(imageSettings.aspectRatio || '1:1');

  const targets = [
    { provider: route.primary_provider, model: route.primary_model, label: 'primary' },
    { provider: route.fallback_1_provider, model: route.fallback_1_model, label: 'fallback_1' },
    { provider: route.fallback_2_provider, model: route.fallback_2_model, label: 'fallback_2' },
    { provider: route.fallback_3_provider, model: route.fallback_3_model, label: 'fallback_3' }
  ].filter(t => t.provider && t.model).slice(0, 2);

  if (targets.length === 0) {
    await safeDecrementOnFailure(quotaCheck, userId, toolIdStr, walletCharged);
    throw new Error(JSON.stringify({
      error: "No active image providers or routing pathways found in your system configuration.",
      error_ar: "لم يتم العثور على أي مزودي خدمة أو مسارات نماذج نشطة في إعدادات النظام الحالية.",
      type: "SYSTEM_INACTIVE"
    }));
  }

  const vaultMap = new Map<string, any>();
  try {
    const { getCachedApiKeysVault } = await import('../../db/queries.js');
    const activeKeys = await getCachedApiKeysVault();
    if (activeKeys && activeKeys.length > 0) {
      for (const key of activeKeys) {
        if (key && key.provider) {
          vaultMap.set(key.provider.toLowerCase().replace(/\s+/g, ''), key);
        }
      }
    }
  } catch (err: any) {
    console.warn('[Image Task Pre-fetch] Failed to pre-load configuration keys:', err.message);
  }

  let promptPrefix = '';
  let promptSuffix = '';
  const selectedStyle = String(imageSettings.style || 'Cinematic').toLowerCase().trim();

  let promptPrefThreshold = 150;
  try {
    const systemSettings = await getSystemSettings();
    if (systemSettings && systemSettings.image_prompt_pref_threshold !== null && systemSettings.image_prompt_pref_threshold !== undefined) {
      promptPrefThreshold = Number(systemSettings.image_prompt_pref_threshold);
    }
  } catch (err: any) {
    console.warn('[Image Task] Failed to fetch prompt preference threshold from system_settings:', err.message);
  }

  const isCustomDetailedPrompt = finalPrompt.length > promptPrefThreshold;

  if (!isCustomDetailedPrompt) {
    if (selectedStyle.includes('cinematic') || selectedStyle.includes('سينمائي')) {
      promptPrefix = 'Photorealistic film still, cinematic composition, golden hour side-lighting, atmospheric haze, deep volumetric shadows, film textures, ';
    } else if (selectedStyle.includes('realistic') || selectedStyle.includes('واقعي')) {
      promptPrefix = 'Realistic professional photograph, 80mm lens, tack-sharp central focus with natural bokeh, realistic lighting, ';
    } else if (selectedStyle.includes('anime') || selectedStyle.includes('أنمي') || selectedStyle.includes('انمي')) {
      promptPrefix = 'Japanese anime illustration key visual, hand-painted background aesthetic, clean linework, beautiful digital lighting, ';
    } else if (selectedStyle.includes('digital') || selectedStyle.includes('فن رقمي')) {
      promptPrefix = 'Digital art masterpiece, fantasy concept art, rich color palette, depth, Trending on ArtStation, ';
    } else {
      promptPrefix = 'High-fidelity professional masterpiece, carefully arranged composition, clean lighting, ';
    }
  }

  if (selectedRatio === '16:9') {
    promptSuffix += ' Optimized widescreen panoramic framing.';
  } else if (selectedRatio === '9:16') {
    promptSuffix += ' Elegant vertical composition framing.';
  } else if (selectedRatio === '4:3' || selectedRatio === '3:2') {
    promptSuffix += ' Landscape classic framing alignment.';
  } else {
    promptSuffix += ' Balanced central aspect ratio framing.';
  }

  const selectedQuality = String(imageSettings.quality || 'HD').toLowerCase().trim();
  if (selectedQuality === 'ultra' || selectedQuality === 'hd' || selectedQuality === 'high') {
    promptSuffix += ' High resolution details, clear textures.';
  }

  promptSuffix += ' [Constraint: high-quality, clear limbs and faces].';

  const available = 4000 - promptPrefix.length - promptSuffix.length;
  const trimmedCore = finalPrompt.substring(0, Math.max(200, available));
  finalPrompt = promptPrefix + trimmedCore + promptSuffix;

  let imageUrl = '';
  let successfulProvider = '';
  let successfulModel = '';

  if (io) {
    io.to(`user_${userId}`).emit('image_progress', {
      progress: 35,
      status: 'validating',
      status_ar: 'التحقق من جاهزية المحرك الفني وجدولة الطلب العصبوني...',
      status_en: 'Verifying image core availability & scheduling neural task...'
    });
  }

  for (const target of targets) {
    const providerId = target.provider.toLowerCase().replace(/\s+/g, '');
    const modelToUse = target.model || '';

    console.log(`[Image Orchestrator] Processing Sovereign GPU Route Pathway [${target.label}]: ${providerId} - ${modelToUse}`);

    try {
      const gpuRes = await dispatchGpuTask({
        userId,
        taskType: 'image_gen',
        prompt: finalPrompt,
        imageSettings,
        preferredProviderId: providerId,
        preferredModelId: modelToUse
      });
      if (gpuRes.mediaUrl) {
        imageUrl = gpuRes.mediaUrl;
        successfulProvider = gpuRes.providerId;
        successfulModel = gpuRes.modelId;
        break;
      }
    } catch (gpuErr: any) {
      console.warn(`[Image Orchestrator] Sovereign GPU task dispatch failed for ${providerId}:`, gpuErr.message);
      continue;
    }
  }

  if (!imageUrl) {
    await safeDecrementOnFailure(quotaCheck, userId, toolIdStr, walletCharged);
    throw new Error(JSON.stringify({
      error: "All configured image generation providers in the fallback chain failed or returned empty results.",
      error_ar: "فشلت جميع مسارات المزودين التبادلية لتوليد الصور أو أعادت نتائج فارغة.",
      type: "GENERATION_ERROR"
    }));
  }

  if (io) {
    io.to(`user_${userId}`).emit('image_progress', {
      progress: 100,
      status: 'completed',
      status_ar: 'اكتمل توليد الصورة فائقة الدقة بنجاح!',
      status_en: 'Premium image synthesized and refined successfully!'
    });
  }

  let savedUrl = imageUrl;

  try {
    const estimatedCost = 0.03;
    if (estimatedCost > 0 && successfulProvider) {
      await pool.query(
        'UPDATE gpu_providers SET used_today = used_today + $1, updated_at = CURRENT_TIMESTAMP WHERE provider_id = $2',
        [estimatedCost, successfulProvider]
      );
    }

    await logSystemActivity(userId, 'PERPLEXTA_EXECUTION', `Image generated via ${successfulProvider}/${successfulModel}`, { toolIdStr, provider: successfulProvider });

    const savedUrlWithAspect = `${savedUrl}#aspect=${selectedRatio}`;
    return { result: `![Generated Image](${savedUrlWithAspect})` };
  } catch (imgErr: any) {
    console.error('[Orchestrator Image] Silent warning: ledger or system activity logging failed but returning image anyway:', imgErr.message);
    const savedUrlWithAspect = `${savedUrl}#aspect=${selectedRatio}`;
    return { result: `![Generated Image](${savedUrlWithAspect})` };
  }
}
