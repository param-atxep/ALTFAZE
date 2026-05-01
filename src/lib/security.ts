import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = globalThis as typeof globalThis & {
  __altfazeRateLimitStore?: Map<string, RateLimitRecord>;
};

const store = rateLimitStore.__altfazeRateLimitStore || new Map<string, RateLimitRecord>();
rateLimitStore.__altfazeRateLimitStore = store;

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip');

  return (
    cfIp ||
    realIp ||
    forwardedFor?.split(',')[0]?.trim() ||
    '127.0.0.1'
  );
}

export function createRateLimitKey(request: NextRequest, scope: string): string {
  return `${scope}:${getClientIp(request)}`;
}

export function rateLimit(request: NextRequest, scope: string, config: RateLimitConfig) {
  const key = createRateLimitKey(request, scope);
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });

    return {
      allowed: true,
      remaining: config.limit - 1,
      resetAt,
    };
  }

  const nextCount = existing.count + 1;
  const allowed = nextCount <= config.limit;

  store.set(key, {
    count: nextCount,
    resetAt: existing.resetAt,
  });

  return {
    allowed,
    remaining: Math.max(0, config.limit - nextCount),
    resetAt: existing.resetAt,
  };
}

export function applyRateLimitHeaders(response: NextResponse, result: ReturnType<typeof rateLimit>, config: RateLimitConfig) {
  response.headers.set('X-RateLimit-Limit', String(config.limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));
  return response;
}

export function createRateLimitResponse(result: ReturnType<typeof rateLimit>, config: RateLimitConfig) {
  const response = NextResponse.json(
    {
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
    },
    { status: 429 }
  );

  return applyRateLimitHeaders(response, result, config);
}

export function createSecurityHeaders() {
  const contentSecurityPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline' https:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
    "connect-src 'self' https: wss:",
    "media-src 'self' blob: https:",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ');

  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'Content-Security-Policy': contentSecurityPolicy,
  };
}

export function isAllowedUploadMimeType(mimeType: string): boolean {
  return [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/zip',
  ].includes(mimeType);
}

export function validateUploadFile(file: File, maxSizeBytes = 10 * 1024 * 1024) {
  if (!isAllowedUploadMimeType(file.type)) {
    return { valid: false, error: 'Unsupported file type' };
  }

  if (file.size > maxSizeBytes) {
    return { valid: false, error: `File must be smaller than ${Math.round(maxSizeBytes / (1024 * 1024))}MB` };
  }

  return { valid: true };
}

export function verifyHmacSha256Signature(payload: string, signature: string, secret: string) {
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const signatureBuffer = Buffer.from(signature, 'utf8');

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

export function parseCloudinaryUrl(cloudinaryUrl: string) {
  const parsed = new URL(cloudinaryUrl);

  return {
    cloudName: parsed.hostname,
    apiKey: decodeURIComponent(parsed.username),
    apiSecret: decodeURIComponent(parsed.password),
  };
}
