import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = (err as AppError).statusCode || 500;
  const code = (err as AppError).code || 'INTERNAL_ERROR';

  const logEntry = {
    timestamp: new Date().toISOString(),
    level: statusCode >= 500 ? 'ERROR' : 'WARN',
    code,
    message: err.message,
    path: req.path,
    method: req.method,
    userId: (req as any).user?.id || 'anonymous',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  };

  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify(logEntry));
  } else {
    console.error(`[${logEntry.level}] ${code}: ${err.message}`);
    console.error(`${req.method} ${req.path}`);
    if (err.stack) console.error(err.stack);
  }

  // If it's a navigation request for HTML, return a friendly HTML error page instead of JSON
  const acceptHeader = req.headers['accept'] || '';
  const isHtmlRequest = req.method === 'GET' && acceptHeader.includes('text/html');

  if (isHtmlRequest) {
    const isAr = (req.headers['accept-language'] || '').toLowerCase().startsWith('ar');
    return res.status(statusCode).send(`
      <html>
        <head>
          <title>${isAr ? 'عذراً، حدث خطأ ما' : 'Sorry, something went wrong'}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #faf9f5; color: #181715; text-align: center; padding: 20px; }
            .container { max-width: 500px; }
            h1 { font-size: 24px; margin-bottom: 10px; }
            p { color: #555; line-height: 1.5; }
            button { margin-top: 20px; padding: 12px 24px; background: #181715; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${isAr ? 'الموقع غير متوفر مؤقتاً' : 'Platform Temporarily Unavailable'}</h1>
            <p>${isAr ? 'نحن نقوم بتحديث النظام أو هناك ضغط مؤقت على السيرفر. يرجى المحاولة مرة أخرى بعد لحظات.' : 'We are updating the system or there is temporary server load. Please try again in a few moments.'}</p>
            <button onclick="window.location.reload()">${isAr ? 'إعادة التحميل' : 'Reload Page'}</button>
          </div>
        </body>
      </html>
    `);
  }

  const isProd = process.env.NODE_ENV === 'production';
  const isInternal500 = statusCode >= 500 && !(err as AppError).isOperational;
  const safeMessage = (isProd && isInternal500) ? 'An internal server error occurred' : err.message;
  const safeMessageAr = (isProd && isInternal500) ? 'حدث خطأ داخلي في الخادم، يرجى المحاولة لاحقاً' : undefined;

  res.status(statusCode).json({
    error: safeMessage,
    error_ar: safeMessageAr,
    code,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith('/api')) {
    const err = new AppError(
      `Route not found ${req.method} ${req.path}`,
      404,
      'ROUTE_NOT_FOUND'
    );
    return next(err);
  }
  next();
}
