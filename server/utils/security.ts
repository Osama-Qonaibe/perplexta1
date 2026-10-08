/**
 * Perplexta Platform - Security & Input Validation Helpers
 * strictly aligned with Google Gemini Fair Use policies.
 */

/**
 * Encodes special HTML characters into their corresponding safe HTML entities
 * to prevent Cross-Site Scripting (XSS) when rendering user input in HTML responses or email bodies.
 */
export function escapeHtml(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Serializes data to JSON safely for direct inclusion within HTML <script> blocks.
 * Escapes characters that could break out of <script> context (e.g., </script>, <!--).
 */
export function serializeJsonForScript(data: any): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export const MAX_USER_PROMPT_LIMIT = 16000;
export const MAX_CUMULATIVE_HISTORY_CHARS = 100000;
export const MAX_DOC_EXTRACT_SIZE = 60000;

/**
 * Strips dangerous HTML, scripts, events, and dynamic triggers to prevent XSS payloads.
 */
export function sanitizeHTMLAndXSS(text: string): string {
  if (!text) return text;

  return text
    // 1. Strip script tags and their content
    .replace(/<script[^>]*>([\s\S]*?)<\/script[^>]*>/gi, '[SECURE_REMOVED_SCRIPT]')
    // 2. Strip inline event handlers (e.g., onload, onerror, onclick)
    .replace(/\bon\w+\s*=\s*['"][^'"]*['"]/gi, '[SECURE_REMOVED_EVENT]')
    .replace(/\bon\w+\s*=\s*`[^`]*`/gi, '[SECURE_REMOVED_EVENT]')
    .replace(/\bon\w+\s*=\s*[^"'\s>]+/gi, '[SECURE_REMOVED_EVENT]')
    // 3. Prevent javascript:... protocol execution triggers
    .replace(/href\s*=\s*['"]?\s*javascript:[^'"]*['"]?/gi, 'href="#"')
    .replace(/src\s*=\s*['"]?\s*javascript:[^'"]*['"]?/gi, 'src="about:blank"')
    // 4. Strip iframe, object, embed, applet, and other unsafe raw tags
    .replace(/<iframe[^>]*>([\s\S]*?)<\/iframe[^>]*>/gi, '[SECURE_REMOVED_IFRAME]')
    .replace(/<object[^>]*>([\s\S]*?)<\/object[^>]*>/gi, '[SECURE_REMOVED_OBJECT]')
    .replace(/<embed[^>]*>([\s\S]*?)<\/embed[^>]*>/gi, '[SECURE_REMOVED_EMBED]')
    .replace(/<applet[^>]*>([\s\S]*?)<\/applet[^>]*>/gi, '[SECURE_REMOVED_APPLET]')
    .replace(/<meta[^>]*>/gi, '[SECURE_REMOVED_META]')
    .replace(/<link[^>]*>/gi, '[SECURE_REMOVED_LINK]')
    // 5. Eliminate HTML comments to avoid parser confusion
    .replace(/<!--([\s\S]*?)-->/g, '');
}

/**
 * Validates direct user text prompt sizes to prevent flood & context overflows.
 */
export function validatePromptLength(text: string): void {
  if (!text) return;
  
  if (text.length > MAX_USER_PROMPT_LIMIT) {
    throw new Error(JSON.stringify({
      error: `Security Alert: User input exceeds the professional fair-use limit of ${MAX_USER_PROMPT_LIMIT.toLocaleString()} characters. Please refine or shorten your text to proceed.`,
      error_ar: `تنبيه أمني: يتجاوز الكود أو النص المرسل حد الاستخدام العادل المسموح به (${MAX_USER_PROMPT_LIMIT.toLocaleString()} حرفاً). يرجى تقليل طول النص للمتابعة.`,
      type: "PROMPT_TOO_LONG"
    }));
  }
}

/**
 * Validates external URLs to prevent Server-Side Request Forgery (SSRF)
 * against cloud metadata services, loopback interfaces, and private corporate subnets.
 */
export function isSafeExternalUrl(targetUrl: string): boolean {
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const host = parsed.hostname.toLowerCase().trim();
    if (!host) return false;

    // Disallow loopback, internal domains, and cloud metadata hostnames
    if (
      host === 'localhost' ||
      host === '0.0.0.0' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === 'metadata.google.internal' ||
      host.endsWith('.internal') ||
      host.endsWith('.local') ||
      host.endsWith('.localhost')
    ) {
      return false;
    }

    // Disallow private IPv4 ranges and link-local addresses
    if (
      /^10\./.test(host) ||
      /^127\./.test(host) ||
      /^169\.254\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
      /^0\./.test(host)
    ) {
      return false;
    }

    // Disallow private / local IPv6 notations
    if (
      host.startsWith('fe80:') ||
      host.startsWith('fc00:') ||
      host.startsWith('fd00:') ||
      host.includes('::')
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
