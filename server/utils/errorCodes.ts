export const ERROR_CODES = {
  AUTH_EMAIL_REQUIRED: { code: 'AUTH_EMAIL_REQUIRED', status: 400 },
  AUTH_PASSWORD_REQUIRED: { code: 'AUTH_PASSWORD_REQUIRED', status: 400 },
  AUTH_INVALID_EMAIL: { code: 'AUTH_INVALID_EMAIL', status: 400 },
  AUTH_WEAK_PASSWORD: { code: 'AUTH_WEAK_PASSWORD', status: 400 },
  AUTH_INVALID_CREDENTIALS: { code: 'AUTH_INVALID_CREDENTIALS', status: 401 },
  AUTH_TOKEN_EXPIRED: { code: 'AUTH_TOKEN_EXPIRED', status: 401 },
  AUTH_TOKEN_INVALID: { code: 'AUTH_TOKEN_INVALID', status: 401 },
  AUTH_FORBIDDEN: { code: 'AUTH_FORBIDDEN', status: 403 },
  VALIDATION_FAILED: { code: 'VALIDATION_FAILED', status: 400 },
  DB_CONNECTION_ERROR: { code: 'DB_CONNECTION_ERROR', status: 500 },
  DB_QUERY_ERROR: { code: 'DB_QUERY_ERROR', status: 500 },
  DB_UNIQUE_VIOLATION: { code: 'DB_UNIQUE_VIOLATION', status: 409 },
  DB_FK_VIOLATION: { code: 'DB_FK_VIOLATION', status: 400 },
  RESOURCE_NOT_FOUND: { code: 'RESOURCE_NOT_FOUND', status: 404 },
  USER_NOT_FOUND: { code: 'USER_NOT_FOUND', status: 404 },
  CHAT_NOT_FOUND: { code: 'CHAT_NOT_FOUND', status: 404 },
  AD_NOT_FOUND: { code: 'AD_NOT_FOUND', status: 404 },
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', status: 500 },
  SERVICE_UNAVAILABLE: { code: 'SERVICE_UNAVAILABLE', status: 503 }
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;
