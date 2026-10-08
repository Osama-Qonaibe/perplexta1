import { Request, Response, NextFunction } from 'express';

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // If the request contains an explicit Authorization header, CSRF is mathematically impossible because
  // browser cross-origin requests cannot inject custom HTTP headers without CORS preflight and access to the token.
  if (req.headers.authorization) {
    return next();
  }

  const origin = (req.headers.origin as string) || (req.headers.referer as string);

  // If no origin/referer, block untrusted state-changing request
  if (!origin) {
    return res.status(403).json({ error: 'CSRF protection: State-changing requests must include an Origin, Referer, or Authorization header.' });
  }

  // Allow trusted native mobile wrappers (Capacitor, Ionic)
  const isNativeScheme = origin.startsWith('capacitor://') || 
                         origin.startsWith('ionic://');

  if (isNativeScheme) {
    return next();
  }

  // Chrome extensions: allow only if explicitly whitelisted in env or accompanied by custom anti-CSRF token
  if (origin.startsWith('chrome-extension://')) {
    const allowedExtensions = process.env.ALLOWED_CHROME_EXTENSION_IDS 
      ? process.env.ALLOWED_CHROME_EXTENSION_IDS.split(',').map(s => s.trim()) 
      : [];
    const extensionId = origin.replace('chrome-extension://', '').split('/')[0];
    if (allowedExtensions.length > 0 && allowedExtensions.includes(extensionId)) {
      return next();
    }
    if (req.headers['x-csrf-token'] || req.headers['authorization']) {
      return next();
    }
    return res.status(403).json({ error: 'CSRF protection: Untrusted browser extension origin blocked.' });
  }

  if (process.env.NODE_ENV === 'production') {
    try {
      const allowed: string[] = [];
      if (process.env.APP_URL) {
        allowed.push(process.env.APP_URL);
      }
      if (process.env.CORS_ALLOWED_ORIGINS) {
        allowed.push(...process.env.CORS_ALLOWED_ORIGINS.split(',').map((o: string) => o.trim()));
      }

      const originUrl = new URL(origin);
      const originStr = `${originUrl.protocol}//${originUrl.host}`;

      const isAllowed = allowed.some(domain => {
        if (!domain) return false;
        const cleanDomain = domain.endsWith('/') ? domain.slice(0, -1) : domain;
        try {
          const domUrl = new URL(cleanDomain);
          return `${domUrl.protocol}//${domUrl.host}` === originStr;
        } catch {
          return cleanDomain === originStr;
        }
      });

      if (!isAllowed) {
        return res.status(403).json({ error: 'CSRF protection: Untrusted or unauthorized origin blocked.' });
      }
    } catch {
      return res.status(403).json({ error: 'CSRF protection: Invalid request origin format.' });
    }
  }

  next();
}
