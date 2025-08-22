import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60 * 60 * 1000);

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum requests per window
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

export function createRateLimit(options: RateLimitOptions) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100,
    message = 'Too many requests from this IP, please try again later.',
    standardHeaders = true,
    legacyHeaders = false,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}-${req.url}`;
    const now = Date.now();
    const resetTime = now + windowMs;

    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime,
      };
    } else {
      store[key].count++;
    }

    const current = store[key];
    const remaining = Math.max(0, max - current.count);
    const msBeforeReset = Math.max(0, current.resetTime - now);

    if (standardHeaders) {
      res.set('RateLimit-Limit', max.toString());
      res.set('RateLimit-Remaining', remaining.toString());
      res.set('RateLimit-Reset', new Date(current.resetTime).toISOString());
    }

    if (legacyHeaders) {
      res.set('X-RateLimit-Limit', max.toString());
      res.set('X-RateLimit-Remaining', remaining.toString());
      res.set('X-RateLimit-Reset', Math.ceil(current.resetTime / 1000).toString());
    }

    if (current.count > max) {
      res.set('Retry-After', Math.ceil(msBeforeReset / 1000).toString());
      return res.status(429).json({
        error: 'Too Many Requests',
        message,
        retryAfter: Math.ceil(msBeforeReset / 1000),
      });
    }

    next();
  };
}

// Predefined rate limiters for different endpoints
export const rateLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 AI analysis requests per 15 minutes per IP
  message: 'Too many AI analysis requests. Please wait before making another request.',
});

export const uploadRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 uploads per 5 minutes per IP
  message: 'Too many file uploads. Please wait before uploading another file.',
});

export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 auth attempts per 15 minutes per IP
  message: 'Too many authentication attempts. Please wait before trying again.',
});

export const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  message: 'Too many requests from this IP, please try again later.',
});
