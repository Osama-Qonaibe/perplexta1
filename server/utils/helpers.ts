import net from 'net';
import dns from 'dns';

export const FOLLOW_UP_PATTERN = /(?:\[(?:FOLLOW_?UPS?(?:_START)?|FOLLOW[\s-_]UPS?|أسئلة[_\s-]متابعة|اسئلة[_\s-]متابعة|أسئلة[_\s-]المتابعة|اسئلة[_\s-]المتابعة|أسئلة[_\s-]متابعة[_\s-]مقترحة|اسئلة[_\s-]متابعة[_\s-]مقترحة|فوللو[_\s-]?(?:ابس|اب)|فولو[_\s-]?(?:ابس|اب)|اقتراحات[_\s-]متابعة|اقتراحات[_\s-]المتابعة|اقتراحات[_\s-]تفاعلية|اقتراحات|أسئلة[_\s-]مقترحة|اسئلة[_\s-]مقترحة|Follow-?ups?|Follow-?up[\s_]Questions|Suggested[\s_]Questions|Related[\s_]Questions|NEXT_STEPS|SUGGESTIONS)\]|(?:\*\*|#{1,4}\s*|\[)?(?:أسئلة[_\s-]المتابعة|أسئلة[_\s-]متابعة|اسئلة[_\s-]متابعة|فوللو[_\s-]ابس|فولو[_\s-]ابس|فوللو[_\s-]اب|فولو[_\s-]اب|Follow-?ups?|Follow-?up[\s_]Questions|Suggested[\s_]Questions|أسئلة[_\s-]مقترحة|اسئلة[_\s-]مقترحة|FOLLOW_?UPS?(?:_START)?|FOLLOW[\s-_]UPS?|اقتراحات[_\s-]متابعة|اقتراحات[_\s-]المتابعة|اقتراحات[_\s-]تفاعلية|اقتراحات|SUGGESTIONS|NEXT_STEPS)(?:\*\*|:|\])?)\n?([\s\S]*)$/i;

export function formatActionableSuggestion(suggestion: string): string {
  if (!suggestion) return '';
  let s = suggestion.trim();

  // Strip leading numbering, bullet points, or exploration arrows
  s = s.replace(/^\s*(?:\d+[\.\)\-:]|\*|-|•|–|—|>|\+|↳|\u21B3)\s*/, '').trim();

  // Arabic transformations: Convert assistant question forms into first-person user requests
  s = s.replace(/^هل\s+(?:ترغب|تود|تريد|تفضل)\s+(?:في\s+)?أن\s+(?:أرفق|ارفق)\s+/i, 'أرغب بإرفاق ');
  s = s.replace(/^هل\s+(?:ترغب|تود|تريد|تفضل)\s+(?:في\s+)?أن\s+(?:أضيف|اضيف|أضع|اضع)\s+/i, 'أرغب بإضافة ');
  s = s.replace(/^هل\s+(?:ترغب|تود|تريد|تفضل)\s+(?:في\s+)?أن\s+(?:أشرح|اشرح|أوضح|اوضح)\s+/i, 'أرغب بشرح وتوضيح ');
  s = s.replace(/^هل\s+(?:ترغب|تود|تريد|تفضل)\s+(?:في\s+)?أن\s+(?:أحول|احول|أعيد|اعيد)\s+/i, 'أرغب بتحويل ');
  s = s.replace(/^هل\s+(?:ترغب|تود|تريد|تفضل)\s+(?:في\s+)?أن\s+(?:أطور|اطور|أحسن|احسن)\s+/i, 'أرغب بتحسين ');
  s = s.replace(/^هل\s+(?:ترغب|تود|تريد|تفضل)\s+(?:في\s+)?أن\s+(?:أقدم|اقدم|أستعرض|استعرض|أعرض|اعرض)\s+/i, 'أرغب باستعراض ');
  s = s.replace(/^هل\s+(?:ترغب|تود|تريد|تفضل)\s+(?:في\s+)?أن\s+(?:أقوم|اقوم)\s+بـ?\s*/i, 'أرغب بـ ');
  s = s.replace(/^هل\s+(?:ترغب|تود|تريد|تفضل)\s+(?:في\s+)?أن\s+/i, 'أرغب بـ ');

  // Direct question verbs: هل ترغب / هل تود / هل تريد / هل تفضل
  s = s.replace(/^هل\s+(?:ترغب|تود)\s+(?:في\s+|بـ?\s*)?/i, 'أرغب بـ ');
  s = s.replace(/^هل\s+تريد\s+(?:في\s+|بـ?\s*)?/i, 'أريد ');
  s = s.replace(/^هل\s+تفضل\s+(?:في\s+|بـ?\s*)?/i, 'أفضل ');
  s = s.replace(/^هل\s+تحتاج\s+(?:إلى|الى)?\s*/i, 'أحتاج إلى ');
  s = s.replace(/^هل\s+تبحث\s+عن\s*/i, 'أبحث عن ');
  s = s.replace(/^هل\s+يمكننا\s+(?:أن\s+)?/i, 'أرغب بـ ');
  s = s.replace(/^هل\s+يمكنك\s+(?:أن\s+)?/i, 'أرغب بـ ');
  s = s.replace(/^هل\s+نستطيع\s+(?:أن\s+)?/i, 'أرغب بـ ');

  // Clean grammatical prepositions
  s = s.replace(/^أرغب بـ\s+(?:في|بـ?|إلى|الى)\s*/i, 'أرغب بـ ');
  s = s.replace(/^أرغب بـ\s*أ/i, 'أرغب بإ');
  s = s.replace(/^أرغب بـ\s*ت/i, 'أرغب بت');
  s = s.replace(/^أرغب بـ\s*م/i, 'أرغب بم');
  s = s.replace(/^أرغب بـ\s*ا/i, 'أرغب با');
  s = s.replace(/^أرغب بـ\s+/i, 'أرغب بـ ');

  // English transformations
  s = s.replace(/^(?:would\s+you\s+like\s+me\s+to|do\s+you\s+want\s+me\s+to|shall\s+i)\s+/i, 'Please ');
  s = s.replace(/^(?:would\s+you\s+like\s+to|do\s+you\s+want\s+to)\s+/i, 'I want to ');
  s = s.replace(/^should\s+we\s+/i, "Let's ");
  s = s.replace(/^can\s+we\s+/i, "Let's ");

  // Strip trailing question marks from declarative action prompts
  if (
    s.startsWith('أرغب') ||
    s.startsWith('أريد') ||
    s.startsWith('أفضل') ||
    s.startsWith('أود') ||
    s.startsWith('أحتاج') ||
    s.startsWith('أبحث') ||
    s.startsWith('قم ') ||
    s.startsWith('أضف ') ||
    s.startsWith('أرفق ') ||
    s.startsWith('Please') ||
    s.startsWith('I want') ||
    s.startsWith("Let's") ||
    s.startsWith('Show me')
  ) {
    s = s.replace(/[\?؟\s]+$/, '');
  }

  return s;
}

export const extractFollowUps = (text: string, prompt?: string, lang: 'ar' | 'en' = 'ar', toolId: string = 'chat_fast'): { cleanText: string, followUps: string[] } => {
  if (!text) return { cleanText: '', followUps: [] };

  // If prompt is a brief greeting, do not generate awkward follow-ups
  const isGreeting = prompt && (
    prompt.length < 35 && /^(مرحبا|مساء الخير|مساء اليخر|مسا الخير|صباح الخير|السلام عليكم|سلام|كيفك|كيف حالك|شكرا|شكراً|اهلين|هلا|hi|hello|hey|good morning|good evening)/i.test(prompt.trim())
  );

  const match = text.match(FOLLOW_UP_PATTERN);
  if (match && match[1]) {
    const rawUps = match[1];
    const followUps = rawUps
      .split('\n')
      .map(q => formatActionableSuggestion(q))
      .filter(q => q.length > 3 && q.length < 250 && !q.startsWith('[') && !q.endsWith(']'));
    const cleanText = text.replace(FOLLOW_UP_PATTERN, '').trim();
    if (isGreeting) {
      return { cleanText, followUps: [] };
    }
    if (followUps.length > 0) {
      return { cleanText, followUps: followUps.slice(0, 3) };
    }
  }

  // Also check for trailing lines starting with ↳
  const arrowMatch = text.match(/(?:^|\n)((?:↳[^\n]+\n?)+)$/);
  if (arrowMatch && arrowMatch[1]) {
    const arrowUps = arrowMatch[1]
      .split('\n')
      .map(q => formatActionableSuggestion(q))
      .filter(q => q.length > 3 && q.length < 250);
    const cleanText = text.replace(/(?:^|\n)((?:↳[^\n]+\n?)+)$/, '').trim();
    if (isGreeting) {
      return { cleanText, followUps: [] };
    }
    if (arrowUps.length > 0) {
      return { cleanText, followUps: arrowUps.slice(0, 3) };
    }
  }

  const cleanText = text.replace(FOLLOW_UP_PATTERN, '').trim();
  if (isGreeting || cleanText.length < 50) {
    return { cleanText, followUps: [] };
  }

  // Fallback: If no explicit tag was found, generate 3 smart, context-aware follow-up options
  const fallbackFollowUps = generateContextualFollowUpsFallback(prompt || '', cleanText, lang, toolId);
  return { cleanText, followUps: fallbackFollowUps };
};

export const generateContextualFollowUpsFallback = (
  prompt: string,
  responseText: string,
  lang: 'ar' | 'en' = 'ar',
  toolId: string = 'chat_fast'
): string[] => {
  const combined = (prompt + ' ' + responseText).toLowerCase();

  if (lang === 'ar') {
    if (toolId === 'code' || combined.includes('كود') || combined.includes('برمج') || combined.includes('دالة') || combined.includes('خوارزم') || combined.includes('خطأ') || combined.includes('api') || combined.includes('database') || combined.includes('css') || combined.includes('html')) {
      return [
        'أرغب بتحسين أداء هذا الكود',
        'اشرح خطوات عمل هذا الحل',
        'أرغب بإضافة معالجة الأخطاء'
      ];
    }
    if (toolId === 'deep_research' || combined.includes('بحث') || combined.includes('دراسة') || combined.includes('تحليل') || combined.includes('تقرير')) {
      return [
        'أرغب بمراجعة أبرز المصادر',
        'قارن هذا بالمعايير العالمية',
        'أرغب بخطة تنفيذية للخطوات'
      ];
    }
    if (toolId === 'canvas' || toolId === 'image' || toolId === 'video') {
      return [
        'أرغب بتعديل النمط البصري',
        'ولد نماذج إضافية متناسقة',
        'أرغب برفع جودة الإخراج'
      ];
    }
    if (combined.includes('مدينة') || combined.includes('تقع') || combined.includes('أين') || combined.includes('تاريخ') || combined.includes('منطقة') || combined.includes('محافظة') || combined.includes('الخليل') || combined.includes('القدس') || combined.includes('بلدة') || combined.includes('مكان')) {
      return [
        'أرغب بمعرفة تاريخ المنطقة',
        'ما أهم المعالم الأثرية هنا؟',
        'حدثني عن الأنشطة الاقتصادية'
      ];
    }
    if (combined.includes('ما هو') || combined.includes('من هو') || combined.includes('ما هي') || combined.includes('اشرح') || combined.includes('وضح')) {
      return [
        'أرغب بتوضيح أكثر للموضوع',
        'قدم أمثلة تطبيقية مباشرة',
        'ما هي الخطوات التالية المقترحة؟'
      ];
    }
    return [
      'أرغب بتفاصيل إضافية مفيدة',
      'قدم أمثلة عملية توضيحية',
      'ما هي الخطوات التالية للبدء؟'
    ];
  } else {
    if (toolId === 'code' || combined.includes('code') || combined.includes('function') || combined.includes('api') || combined.includes('database') || combined.includes('bug')) {
      return [
        'Optimize code performance',
        'Explain the logic step by step',
        'Add robust error handling'
      ];
    }
    if (toolId === 'deep_research' || combined.includes('research') || combined.includes('analysis') || combined.includes('report')) {
      return [
        'Review authoritative sources',
        'Compare to industry standards',
        'Provide actionable next steps'
      ];
    }
    if (combined.includes('city') || combined.includes('located') || combined.includes('history') || combined.includes('where') || combined.includes('region')) {
      return [
        'Explore historical landmarks',
        'What is the economic significance?',
        'Tell me about surrounding regions'
      ];
    }
    return [
      'Elaborate further on this',
      'Provide practical examples',
      'What are recommended next steps?'
    ];
  }
};

export function isPrivateIP(ip: string): boolean {
  if (!net.isIP(ip)) return false;
  
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 0) return true;
    return false;
  }
  
  if (net.isIPv6(ip)) {
    const norm = ip.toLowerCase();
    if (norm === '::1' || norm === '0:0:0:0:0:0:0:1' || norm === '::ffff:127.0.0.1') return true;
    if (norm.startsWith('fe80:')) return true;
    if (norm.startsWith('fc') || norm.startsWith('fd')) return true;
    if (norm === '::' || norm === '0:0:0:0:0:0:0:0') return true;
    return false;
  }
  
  return true;
}

export async function isSafeHost(hostOrConnStr: string): Promise<boolean> {
  if (!hostOrConnStr) return false;
  
  let host = hostOrConnStr;
  const connStr = hostOrConnStr.trim();

  if (connStr.includes('://')) {
    try {
      const parsed = new URL(connStr);
      host = parsed.hostname;
    } catch {
      const match = connStr.match(/@([^/:]+)/);
      if (match) host = match[1];
    }
  } else {
    host = connStr.split(':')[0];
  }
  
  host = host.trim().toLowerCase();
  
  if (
    host === 'localhost' ||
    host === 'localhost.localdomain' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.lan') ||
    host.endsWith('.test') ||
    host.endsWith('.invalid')
  ) {
    return false;
  }
  
  if (net.isIP(host)) return !isPrivateIP(host);
  
  try {
    const lookup = await dns.promises.lookup(host);
    if (lookup?.address) return !isPrivateIP(lookup.address);
  } catch {
    return false;
  }
  
  return true;
}

export function normalizeArabicNumerals(text: string): string {
  return text
    .replace(/[٠0]/g, '0')
    .replace(/[١1]/g, '1')
    .replace(/[٢2]/g, '2')
    .replace(/[٣3]/g, '3')
    .replace(/[٤4]/g, '4')
    .replace(/[٥5]/g, '5')
    .replace(/[٦6]/g, '6')
    .replace(/[٧7]/g, '7')
    .replace(/[٨8]/g, '8')
    .replace(/[٩9]/g, '9');
}

export function extractImmediateChatTitle(text: string, lang = 'en'): string {
  if (!text || !text.trim()) {
    return lang === 'ar' ? 'محادثة جديدة' : 'New Session';
  }
  
  // Clean markdown headers, code fences, inline codes, blockquotes, markdown links, HTML tags, bold/italic symbols
  let cleaned = text
    .replace(/^#+\s+/gm, '') // remove markdown headings #, ##
    .replace(/```[\s\S]*?```/g, '') // remove code blocks
    .replace(/`([^`]+)`/g, '$1') // remove inline code backticks
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // remove markdown links [label](url)
    .replace(/<[^>]*>/g, '') // remove html tags
    .replace(/[*_~>#]/g, '') // remove bold, italic, blockquotes
    .replace(/\s+/g, ' ') // normalize whitespace
    .trim();

  if (!cleaned) {
    return lang === 'ar' ? 'محادثة جديدة' : 'New Session';
  }

  // Take the first line / sentence
  const firstSentence = cleaned.split(/[\n.!?؟]/)[0]?.trim() || cleaned;
  const candidate = firstSentence.length > 0 ? firstSentence : cleaned;

  if (candidate.length <= 48) {
    return candidate;
  }

  // Trim to nearest word boundary under 48 chars
  const truncated = candidate.substring(0, 48);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 25) {
    return truncated.substring(0, lastSpace).trim() + '...';
  }
  return truncated.trim() + '...';
}

